import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const user = await getCurrentUserData()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json().catch(() => ({ ids: null }))

  let query = (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (ids?.length) query = query.in('id', ids)

  await query
  return NextResponse.json({ ok: true })
}
