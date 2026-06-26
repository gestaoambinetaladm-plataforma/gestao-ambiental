import { getClients } from '@/lib/clients/queries'
import ClientsClient from './ClientsClient'

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const clients = await getClients(searchParams.q)
  return <ClientsClient clients={clients} searchQuery={searchParams.q ?? ''} />
}
