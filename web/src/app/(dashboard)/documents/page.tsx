import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import DocumentsClient from './DocumentsClient'

async function getDocuments() {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('documents')
    .select('*, project:projects(id, name), uploaded_by_profile:profiles!documents_uploaded_by_fkey(id, name)')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export default async function DocumentsPage() {
  const documents = await getDocuments()
  return <DocumentsClient documents={documents} />
}
