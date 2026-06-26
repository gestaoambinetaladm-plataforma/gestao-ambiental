import { notFound } from 'next/navigation'
import { getProjectById, getProjectCondicionantes, getProjectChecklist, getProjectDocuments, getProjectHistory } from '@/lib/projects/queries'
import { getClients } from '@/lib/clients/queries'
import ProjectDetail from './ProjectDetail'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, condicionantes, checklist, documents, clients, history] = await Promise.all([
    getProjectById(params.id),
    getProjectCondicionantes(params.id),
    getProjectChecklist(params.id),
    getProjectDocuments(params.id),
    getClients(),
    getProjectHistory(params.id),
  ])

  if (!project) notFound()

  return (
    <ProjectDetail
      project={project}
      condicionantes={condicionantes}
      checklist={checklist}
      documents={documents}
      clients={clients}
      history={history}
    />
  )
}
