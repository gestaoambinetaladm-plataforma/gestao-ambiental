'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import { z } from 'zod'

// ─── Helper: registrar histórico ─────────────────────────────────────────────

async function logHistory(
  supabase: any,
  projectId: string,
  orgId: string,
  userId: string,
  userName: string,
  action: string,
  description: string,
) {
  await supabase.from('project_history').insert({
    project_id: projectId,
    organization_id: orgId,
    user_id: userId,
    user_name: userName,
    action,
    description,
  })
}

const projectSchema = z.object({
  client_id:             z.string().uuid('Cliente inválido'),
  name:                  z.string().min(2, 'Nome do projeto obrigatório'),
  license_type:          z.enum(['LP','LI','LO','LAS','LAR','LUP','AAF','AUF','ADA','OTHER']),
  status:                z.enum(['draft','in_progress','waiting_agency','pending_docs','approved','rejected','archived']).default('draft'),
  agency:                z.string().optional(),
  protocol_number:       z.string().optional(),
  license_number:        z.string().optional(),
  license_issued_at:     z.string().optional(),
  license_expires_at:    z.string().optional(),
  license_validity_years:z.coerce.number().optional(),
  description:           z.string().optional(),
})

export async function createProjectAction(formData: FormData) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const raw = {
    client_id:             formData.get('client_id'),
    name:                  formData.get('name'),
    license_type:          formData.get('license_type'),
    status:                formData.get('status') || 'draft',
    agency:                formData.get('agency')               || undefined,
    protocol_number:       formData.get('protocol_number')      || undefined,
    license_number:        formData.get('license_number')       || undefined,
    license_issued_at:     formData.get('license_issued_at')    || undefined,
    license_expires_at:    formData.get('license_expires_at')   || undefined,
    license_validity_years:formData.get('license_validity_years')|| undefined,
    description:           formData.get('description')          || undefined,
  }

  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('projects')
    .insert({
      ...parsed.data,
      organization_id: profile.organization_id,
      created_by:      profile.id,
      progress_pct:    0,
    })
    .select()
    .single()

  if (error) return { error: 'Erro ao criar projeto.' }

  // Gerar checklist automático se houver template padrão
  await generateAutoChecklist(data.id, parsed.data.license_type, profile.organization_id)

  revalidatePath('/projects')
  redirect(`/projects/${data.id}`)
}

export async function updateProjectAction(id: string, formData: FormData) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const raw = {
    client_id:             formData.get('client_id'),
    name:                  formData.get('name'),
    license_type:          formData.get('license_type'),
    status:                formData.get('status') || 'draft',
    agency:                formData.get('agency')               || undefined,
    protocol_number:       formData.get('protocol_number')      || undefined,
    license_number:        formData.get('license_number')       || undefined,
    license_issued_at:     formData.get('license_issued_at')    || undefined,
    license_expires_at:    formData.get('license_expires_at')   || undefined,
    license_validity_years:formData.get('license_validity_years')|| undefined,
    description:           formData.get('description')          || undefined,
  }

  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('projects')
    .update(parsed.data)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao atualizar projeto.' }

  await logHistory(supabase, id, profile.organization_id, profile.id, profile.name,
    'project_updated', `Projeto editado por ${profile.name}`)

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return { success: true }
}

export async function updateProgressAction(id: string, progress: number) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  await (supabase as any)
    .from('projects')
    .update({ progress_pct: Math.max(0, Math.min(100, progress)) })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  revalidatePath(`/projects/${id}`)
  return { success: true }
}

export async function toggleChecklistItemAction(itemId: string, projectId: string, completed: boolean) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  await (supabase as any)
    .from('project_checklist_items')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? profile.id : null,
    })
    .eq('id', itemId)
    .eq('organization_id', profile.organization_id)

  // Recalcular progresso automaticamente
  const { data: items } = await (supabase as any)
    .from('project_checklist_items')
    .select('completed')
    .eq('project_id', projectId)
    .eq('organization_id', profile.organization_id)

  if (items && items.length > 0) {
    const done = items.filter((i: any) => i.completed).length
    const pct  = Math.round((done / items.length) * 100)
    await (supabase as any)
      .from('projects')
      .update({ progress_pct: pct })
      .eq('id', projectId)
      .eq('organization_id', profile.organization_id)
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// ─── Condicionantes ───────────────────────────────────────────────────────────

export async function createCondicionanteAction(projectId: string, formData: FormData) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any).from('condicionantes').insert({
    project_id:        projectId,
    organization_id:   profile.organization_id,
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    due_date:          formData.get('due_date') || null,
    alert_days_before: parseInt(String(formData.get('alert_days_before') || '30'), 10),
    status:            'pending',
    created_by:        profile.id,
  })

  if (error) return { error: error.message }

  const title = String(formData.get('title') ?? '')
  const supabase2 = await createClient()
  await logHistory(supabase2, projectId, profile.organization_id, profile.id, profile.name,
    'condicionante_created', `Condicionante adicionada: "${title}"`)

  revalidatePath(`/projects/${projectId}`)
}

export async function updateCondicionanteStatusAction(
  condId: string, projectId: string, status: string,
) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('condicionantes')
    .update({
      status,
      fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null,
    })
    .eq('id', condId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: error.message }

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente', in_progress: 'Em andamento',
    fulfilled: 'Cumprida', overdue: 'Vencida', waived: 'Dispensada',
  }
  await logHistory(supabase, projectId, profile.organization_id, profile.id, profile.name,
    'condicionante_status', `Status de condicionante alterado para "${STATUS_LABELS[status] ?? status}"`)

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteCondicionanteAction(condId: string, projectId: string) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('condicionantes')
    .delete()
    .eq('id', condId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
}

// ─── Soft-delete projeto ─────────────────────────────────────────────────────

export async function deleteProjectAction(projectId: string) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao excluir projeto.' }

  revalidatePath('/projects')
  redirect('/projects')
}

// ─── Documentos do projeto ────────────────────────────────────────────────────

export async function uploadProjectDocumentAction(projectId: string, formData: FormData) {
  const { uploadDocumentAction } = await import('@/lib/documents/actions')
  formData.set('project_id', projectId)
  const result = await uploadDocumentAction(formData)
  revalidatePath(`/projects/${projectId}`)
  return result
}

export async function deleteProjectDocumentAction(docId: string, storagePath: string, projectId: string) {
  const { deleteDocumentAction } = await import('@/lib/documents/actions')
  const result = await deleteDocumentAction(docId, storagePath)
  revalidatePath(`/projects/${projectId}`)
  return result
}

export async function toggleDocumentVisibilityAction(docId: string, projectId: string, visible: boolean) {
  const profile = await getCurrentUserData()
  if (!profile) return { error: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('documents')
    .update({ is_visible_to_client: visible })
    .eq('id', docId)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: 'Erro ao atualizar visibilidade.' }
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// Gera checklist a partir do template padrão
async function generateAutoChecklist(projectId: string, licenseType: string, orgId: string) {
  const supabase = await createClient()

  const { data: template } = await (supabase as any)
    .from('checklist_templates')
    .select('id, checklist_template_items(*)')
    .eq('organization_id', orgId)
    .eq('license_type', licenseType)
    .eq('is_default', true)
    .single()

  if (!template?.checklist_template_items?.length) return

  const items = template.checklist_template_items.map((item: any) => ({
    project_id:      projectId,
    organization_id: orgId,
    title:           item.title,
    description:     item.description,
    order:           item.order,
    completed:       false,
  }))

  await (supabase as any).from('project_checklist_items').insert(items)
}
