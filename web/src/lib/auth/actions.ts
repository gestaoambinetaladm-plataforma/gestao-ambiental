'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// ─── Schemas de validação ─────────────────────────────────────────────────────

const registerSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa obrigatório'),
  slug:        z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  name:        z.string().min(2, 'Seu nome é obrigatório'),
  email:       z.string().email('E-mail inválido'),
  password:    z.string().min(8, 'Mínimo 8 caracteres'),
})

const loginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

// ─── Registro de nova empresa ─────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const raw = {
    companyName: formData.get('companyName'),
    slug:        formData.get('slug'),
    name:        formData.get('name'),
    email:       formData.get('email'),
    password:    formData.get('password'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { companyName, slug, name, email, password } = parsed.data

  // Verificar se slug já existe
  const { data: existing } = await adminClient
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { error: 'Este identificador já está em uso. Escolha outro.' }
  }

  // Criar organização
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({ name: companyName, slug, plan: 'trial', status: 'trial' })
    .select()
    .single()

  if (orgError || !org) {
    return { error: 'Erro ao criar empresa. Tente novamente.' }
  }

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    await adminClient.from('organizations').delete().eq('id', org.id)
    console.error('[register] authError:', JSON.stringify(authError))
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: authError?.message ?? 'Erro ao criar usuário. Tente novamente.' }
  }

  // Criar profile manualmente (sem depender de trigger)
  const { error: profileError } = await adminClient.from('profiles').insert({
    id:              authData.user.id,
    organization_id: org.id,
    name,
    role:            'admin',
  })

  if (profileError) {
    // Rollback completo
    await adminClient.auth.admin.deleteUser(authData.user.id)
    await adminClient.from('organizations').delete().eq('id', org.id)
    console.error('[register] profileError:', JSON.stringify(profileError))
    return { error: 'Erro ao configurar perfil. Tente novamente.' }
  }

  // Login automático após registro
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })

  redirect('/dashboard')
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const raw = {
    email:    formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'E-mail ou senha inválidos.' }
    }
    return { error: 'Erro ao fazer login. Tente novamente.' }
  }

  redirect('/dashboard')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
