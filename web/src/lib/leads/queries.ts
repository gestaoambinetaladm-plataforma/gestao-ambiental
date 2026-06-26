import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function getLeads(stage?: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return []

  let query = (supabase as any)
    .from('leads')
    .select('*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, name)')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  if (stage && stage !== 'all') {
    query = query.eq('stage', stage)
  }

  const { data } = await query
  return data ?? []
}

export async function getLeadById(id: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('leads')
    .select('*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, name)')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .single()

  return data
}

export async function getLeadActivities(leadId: string) {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('lead_activities')
    .select('*, created_by_profile:profiles!lead_activities_created_by_fkey(id, name)')
    .eq('lead_id', leadId)
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return data ?? []
}
