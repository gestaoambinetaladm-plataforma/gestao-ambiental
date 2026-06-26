'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import { z } from 'zod'

const clientSchema = z.object({
  type:     z.enum(['pf', 'pj']),
  name:     z.string().min(2, 'Nome obrigatório'),
  document: z.string().optional(),
  email:    z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone:    z.string().optional(),
  city:     z.string().optional(),
  state:    z.string().optional(),
  address:  z.string().optional(),
  notes:    z.string().optional(),
})

export async function createClientAction(formData: FormData) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const raw = {
    type:     formData.get('type'),
    name:     formData.get('name'),
    document: formData.get('document') || undefined,
    email:    formData.get('email')    || undefined,
    phone:    formData.get('phone')    || undefined,
    city:     formData.get('city')     || undefined,
    state:    formData.get('state')    || undefined,
    address:  formData.get('address')  || undefined,
    notes:    formData.get('notes')    || undefined,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('clients')
    .insert({ ...parsed.data, organization_id: profile.organization_id, created_by: profile.id })
    .select()
    .single()

  if (error) return { error: 'Erro ao cadastrar cliente.' }

  revalidatePath('/clients')
  return { success: true, id: data.id }
}

export async function deleteClientAction(clientId: string) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao excluir cliente.' }

  revalidatePath('/clients')
  redirect('/clients')
}

export async function generatePortalTokenAction(clientId: string) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const token = crypto.randomUUID()
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('clients')
    .update({ portal_token: token })
    .eq('id', clientId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao gerar token.' }

  revalidatePath(`/clients/${clientId}`)
  return { success: true, token }
}

export async function updateClientAction(id: string, formData: FormData) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const raw = {
    type:     formData.get('type'),
    name:     formData.get('name'),
    document: formData.get('document') || undefined,
    email:    formData.get('email')    || undefined,
    phone:    formData.get('phone')    || undefined,
    city:     formData.get('city')     || undefined,
    state:    formData.get('state')    || undefined,
    address:  formData.get('address')  || undefined,
    notes:    formData.get('notes')    || undefined,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao atualizar cliente.' }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true }
}
