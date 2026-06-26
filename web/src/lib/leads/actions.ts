'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function createLeadAction(formData: FormData) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const estimated_value = formData.get('estimated_value')

  const { error } = await (supabase as any).from('leads').insert({
    organization_id:  user.organization_id,
    name:             formData.get('name'),
    company:          formData.get('company') || null,
    email:            formData.get('email') || null,
    phone:            formData.get('phone') || null,
    source:           formData.get('source') || null,
    stage:            formData.get('stage') || 'new',
    estimated_value:  estimated_value ? parseFloat(String(estimated_value).replace(/\./g, '').replace(',', '.')) : null,
    notes:            formData.get('notes') || null,
    created_by:       user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/crm')
}

export async function updateLeadStageAction(id: string, stage: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any)
    .from('leads')
    .update({ stage })
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/crm')
}

export async function updateLeadAction(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const estimated_value = formData.get('estimated_value')

  const { error } = await (supabase as any)
    .from('leads')
    .update({
      name:            formData.get('name'),
      company:         formData.get('company') || null,
      email:           formData.get('email') || null,
      phone:           formData.get('phone') || null,
      source:          formData.get('source') || null,
      stage:           formData.get('stage'),
      estimated_value: estimated_value ? parseFloat(String(estimated_value).replace(/\./g, '').replace(',', '.')) : null,
      notes:           formData.get('notes') || null,
    })
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/crm')
}

export async function addLeadActivityAction(leadId: string, formData: FormData) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any).from('lead_activities').insert({
    lead_id:         leadId,
    organization_id: user.organization_id,
    type:            formData.get('type'),
    description:     formData.get('description'),
    created_by:      user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/crm')
}

export async function deleteLeadAction(id: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any)
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/crm')
}
