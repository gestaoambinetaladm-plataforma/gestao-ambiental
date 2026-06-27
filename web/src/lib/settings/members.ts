import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function getOrgMembers() {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('profiles')
    .select('id, name, role, status, phone, created_at')
    .eq('organization_id', user.organization_id)
    .order('name')

  return data ?? []
}

export async function getLeadStages() {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('lead_stages')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('position')

  return data ?? []
}
