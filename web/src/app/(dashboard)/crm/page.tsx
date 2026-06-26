import { getLeads } from '@/lib/leads/queries'
import LeadsClient from './LeadsClient'

export default async function CRMPage() {
  const leads = await getLeads()
  return <LeadsClient leads={leads} />
}
