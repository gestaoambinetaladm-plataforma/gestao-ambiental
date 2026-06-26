'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function createTaskAction(formData: FormData) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any).from('tasks').insert({
    organization_id:  user.organization_id,
    title:            formData.get('title'),
    description:      formData.get('description') || null,
    status:           formData.get('status') || 'todo',
    priority:         formData.get('priority') || 'medium',
    assigned_to:      formData.get('assigned_to') || null,
    project_id:       formData.get('project_id') || null,
    due_date:         formData.get('due_date') || null,
    estimated_hours:  formData.get('estimated_hours') || null,
    created_by:       user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/tasks')
}

export async function updateTaskStatusAction(id: string, status: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any)
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
}

export async function deleteTaskAction(id: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await (supabase as any)
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
}
