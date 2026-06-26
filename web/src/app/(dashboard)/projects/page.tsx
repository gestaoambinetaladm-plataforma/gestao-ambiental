import { getProjects } from '@/lib/projects/queries'
import ProjectsClient from './ProjectsClient'

export default async function ProjectsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const projects = await getProjects({ status: searchParams.status, search: searchParams.q })
  return <ProjectsClient projects={projects} activeStatus={searchParams.status ?? 'all'} />
}
