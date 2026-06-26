import { notFound } from 'next/navigation'
import { getClientById, getClientProjects } from '@/lib/clients/queries'
import ClientDetail from './ClientDetail'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, projects] = await Promise.all([
    getClientById(params.id),
    getClientProjects(params.id),
  ])

  if (!client) notFound()

  return <ClientDetail client={client} projects={projects} />
}
