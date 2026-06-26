import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function getClients(search?: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  let query = (supabase as any)
    .from('clients')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return null

  const { data } = await (supabase as any)
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .single()

  return data
}

export async function getClientProjects(clientId: string) {
  const supabase = await createClient()
  const profile  = await getCurrentUserData()
  if (!profile) return []

  const { data } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return data ?? []
}
