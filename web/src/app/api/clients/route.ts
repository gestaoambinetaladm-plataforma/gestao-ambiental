import { NextResponse } from 'next/server'
import { getClients } from '@/lib/clients/queries'

export async function GET() {
  const clients = await getClients()
  return NextResponse.json(clients)
}
