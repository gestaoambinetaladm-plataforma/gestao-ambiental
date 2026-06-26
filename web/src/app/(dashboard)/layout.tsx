import { redirect } from 'next/navigation'
import { getCurrentUserData } from '@/lib/org/queries'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserData()
  if (!profile) redirect('/login')

  const roleLabels: Record<string, string> = {
    admin:                   'Administrador',
    director:                'Diretor',
    environmental_engineer:  'Eng. Ambiental',
    biologist:               'Biólogo',
    field_technician:        'Técnico de Campo',
    commercial:              'Comercial',
    financial:               'Financeiro',
    legal:                   'Jurídico',
    designer:                'Designer',
    client:                  'Cliente',
  }

  return (
    <AppShell
      userName={profile.name}
      orgName={profile.organizations?.name ?? ''}
      userRole={roleLabels[profile.role] ?? profile.role}
    >
      {children}
    </AppShell>
  )
}
