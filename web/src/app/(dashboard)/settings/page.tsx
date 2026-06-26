import { getCurrentUserData } from '@/lib/org/queries'
import { getOrgMembers } from '@/lib/settings/members'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

async function getTemplates(orgId: string) {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('checklist_templates')
    .select('*, checklist_template_items(id, title, description, "order")')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function SettingsPage() {
  const user = await getCurrentUserData()
  if (!user) return null

  const [members, templates] = await Promise.all([
    getOrgMembers(),
    getTemplates(user.organization_id),
  ])

  return (
    <SettingsClient
      currentUser={user}
      members={members}
      templates={templates}
    />
  )
}
