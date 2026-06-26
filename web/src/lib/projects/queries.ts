import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function getProjects(filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  let query = (supabase as any)
    .from('projects')
    .select('*, clients(id, name, type, document)')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,protocol_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function getProjectById(id: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return null

  const { data } = await (supabase as any)
    .from('projects')
    .select('*, clients(id, name, type, document, phone, email, city, state)')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  return data
}

export async function getProjectCondicionantes(projectId: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  const { data } = await (supabase as any)
    .from('condicionantes')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', profile.organization_id)
    .order('due_date', { ascending: true })

  return data ?? []
}

export async function getProjectChecklist(projectId: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  const { data } = await (supabase as any)
    .from('project_checklist_items')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', profile.organization_id)
    .order('"order"', { ascending: true })

  return data ?? []
}

export async function getProjectHistory(projectId: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  const { data } = await (supabase as any)
    .from('project_history')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}

export async function getProjectDocuments(projectId: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  const { data } = await (supabase as any)
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return data ?? []
}
