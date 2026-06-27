import { getLeads } from '@/lib/leads/queries'
import { getLeadStages } from '@/lib/settings/members'
import LeadsClient from './LeadsClient'

export default async function CRMPage() {
  const [leads, customStages] = await Promise.all([
    getLeads(),
    getLeadStages(),
  ])
  return <LeadsClient leads={leads} customStages={customStages} />
}
