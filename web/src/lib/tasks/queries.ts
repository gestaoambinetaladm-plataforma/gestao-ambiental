import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function getTasks(status?: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return []

  let query = (supabase as any)
    .from('tasks')
    .select(`
      *,
      project:projects(id, name),
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, name)
    `)
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data ?? []
}

export async function getOrgMembers() {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('profiles')
    .select('id, name, role')
    .eq('organization_id', user.organization_id)
    .eq('status', 'active')
    .order('name')

  return data ?? []
}
