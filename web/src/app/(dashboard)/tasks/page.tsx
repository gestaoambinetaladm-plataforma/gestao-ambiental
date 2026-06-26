import { getTasks, getOrgMembers } from '@/lib/tasks/queries'
import { getProjects } from '@/lib/projects/queries'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const [tasks, members, projects] = await Promise.all([
    getTasks(),
    getOrgMembers(),
    getProjects(),
  ])
  return <TasksClient tasks={tasks} members={members} projects={projects} />
}
