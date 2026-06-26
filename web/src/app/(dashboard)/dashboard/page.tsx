import { getCurrentUserData } from '@/lib/org/queries'
import { logoutAction } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const profile = await getCurrentUserData()
  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Bem-vindo, {profile.name}
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            {profile.organizations?.name} — {profile.role}
          </p>
          <p className="text-green-600 font-medium text-sm mb-6">
            Autenticação funcionando corretamente.
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
