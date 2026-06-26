import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  // Verify user is authenticated
  const user = await getCurrentUserData()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify document belongs to org
  const supabase = await createClient()
  const { data: doc } = await (supabase as any)
    .from('documents')
    .select('id')
    .eq('storage_path', path)
    .eq('organization_id', user.organization_id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await adminClient.storage
    .from('documents')
    .createSignedUrl(path, 60)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
