'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { getCurrentUserData } from '@/lib/org/queries'

// ─── Membros ──────────────────────────────────────────────────────────────────

export async function inviteMemberAction(formData: FormData) {
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }
  if (user.role !== 'admin' && user.role !== 'director') return { error: 'Sem permissão' }

  const name  = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const role  = String(formData.get('role') ?? 'environmental_engineer')

  if (!name || !email) return { error: 'Nome e e-mail são obrigatórios' }

  // Verifica se já existe conta com este e-mail na org
  const { data: existing } = await adminClient.auth.admin.listUsers()
  const alreadyExists = existing?.users?.find(u => u.email === email)
  if (alreadyExists) return { error: 'Já existe um usuário com este e-mail' }

  // Cria usuário via invite (Supabase envia e-mail de convite)
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role, organization_id: user.organization_id },
  })
  if (inviteError) return { error: inviteError.message }

  // Cria perfil imediatamente (para aparecer na lista)
  const { error: profileError } = await adminClient.from('profiles').insert({
    id:              inviteData.user.id,
    organization_id: user.organization_id,
    name,
    role,
  })
  if (profileError) return { error: profileError.message }

  revalidatePath('/settings')
}

export async function updateMemberRoleAction(memberId: string, role: string) {
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }
  if (user.role !== 'admin' && user.role !== 'director') return { error: 'Sem permissão' }
  if (memberId === user.id) return { error: 'Não é possível alterar sua própria função aqui' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ role })
    .eq('id', memberId)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
}

export async function toggleMemberStatusAction(memberId: string, active: boolean) {
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }
  if (user.role !== 'admin') return { error: 'Apenas admins podem ativar/desativar membros' }
  if (memberId === user.id) return { error: 'Não é possível desativar sua própria conta' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ status: active ? 'active' : 'inactive' })
    .eq('id', memberId)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
}

// ─── Templates de Checklist ───────────────────────────────────────────────────

export async function createTemplateAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const name         = String(formData.get('name') ?? '').trim()
  const license_type = String(formData.get('license_type') ?? '')
  const is_default   = formData.get('is_default') === 'true'

  if (!name || !license_type) return { error: 'Nome e tipo de licença são obrigatórios' }

  // Se marcar como padrão, remove padrão dos outros do mesmo tipo
  if (is_default) {
    await (supabase as any)
      .from('checklist_templates')
      .update({ is_default: false })
      .eq('organization_id', user.organization_id)
      .eq('license_type', license_type)
  }

  const { data, error } = await (supabase as any)
    .from('checklist_templates')
    .insert({
      organization_id: user.organization_id,
      name,
      license_type,
      is_default,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { id: data.id }
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any)
    .from('checklist_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
}

export async function setTemplateDefaultAction(id: string, licenseType: string) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  // Remove padrão dos outros do mesmo tipo
  await (supabase as any)
    .from('checklist_templates')
    .update({ is_default: false })
    .eq('organization_id', user.organization_id)
    .eq('license_type', licenseType)

  const { error } = await (supabase as any)
    .from('checklist_templates')
    .update({ is_default: true })
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
}

export async function addTemplateItemAction(templateId: string, formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  // Verifica que o template pertence à org
  const { data: tpl } = await (supabase as any)
    .from('checklist_templates')
    .select('id')
    .eq('id', templateId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!tpl) return { error: 'Template não encontrado' }

  // Pega ordem máxima atual
  const { data: items } = await (supabase as any)
    .from('checklist_template_items')
    .select('"order"')
    .eq('template_id', templateId)
    .order('"order"', { ascending: false })
    .limit(1)
  const nextOrder = (items?.[0]?.order ?? 0) + 1

  const { error } = await (supabase as any)
    .from('checklist_template_items')
    .insert({
      template_id:  templateId,
      title:        String(formData.get('title') ?? '').trim(),
      description:  formData.get('description') || null,
      order:        nextOrder,
    })

  if (error) return { error: error.message }
  revalidatePath('/settings')
}

export async function deleteTemplateItemAction(itemId: string) {
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await adminClient
    .from('checklist_template_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/settings')
}
