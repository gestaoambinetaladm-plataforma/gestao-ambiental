'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { getCurrentUserData } from '@/lib/org/queries'

const BUCKET = 'documents'

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  const file     = formData.get('file') as File | null
  const name     = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || 'other')
  const projectId = formData.get('project_id') as string | null

  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }
  if (!name) return { error: 'Nome obrigatório' }

  const ext       = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${user.organization_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await adminClient.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (storageError) return { error: storageError.message }

  const { error: dbError } = await (supabase as any).from('documents').insert({
    organization_id:      user.organization_id,
    project_id:           projectId || null,
    uploaded_by:          user.id,
    name,
    filename:             file.name,
    mime_type:            file.type,
    size_bytes:           file.size,
    storage_path:         storagePath,
    category,
    status:               'uploaded',
    is_visible_to_client: false,
  })

  if (dbError) {
    await adminClient.storage.from(BUCKET).remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath('/documents')
}

export async function deleteDocumentAction(id: string, storagePath: string) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return { error: 'Não autenticado' }

  await adminClient.storage.from(BUCKET).remove([storagePath])

  const { error } = await (supabase as any)
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/documents')
}
