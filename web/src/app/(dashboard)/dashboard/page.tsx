import { createClient as createServerClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import { FolderOpen, Users, TrendingUp, ListTodo, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const supabase = await createServerClient()
  const user = await getCurrentUserData()
  if (!user) return null

  const orgId = user.organization_id

  const [
    { count: totalProjects },
    { count: activeProjects },
    { count: totalClients },
    { count: totalLeads },
    { count: wonLeads },
    { count: pendingTasks },
    { data: expiringLicenses },
    { data: overdueConds },
    { data: recentProjects },
  ] = await Promise.all([
    (supabase as any).from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    (supabase as any).from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['in_progress', 'waiting_agency', 'pending_docs']),
    (supabase as any).from('clients').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    (supabase as any).from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).neq('stage', 'won').neq('stage', 'lost'),
    (supabase as any).from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('stage', 'won'),
    (supabase as any).from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['todo', 'in_progress', 'review']),
    (supabase as any).from('projects').select('id, name, license_expires_at, clients(name)').eq('organization_id', orgId).not('license_expires_at', 'is', null).gt('license_expires_at', new Date().toISOString().split('T')[0]).lte('license_expires_at', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('license_expires_at').limit(5),
    (supabase as any).from('condicionantes').select('id, title, due_date, project:projects(id, name)').eq('organization_id', orgId).in('status', ['pending', 'in_progress']).lt('due_date', new Date().toISOString().split('T')[0]).limit(5),
    (supabase as any).from('projects').select('id, name, status, progress_pct, license_type, clients(name)').eq('organization_id', orgId).order('updated_at', { ascending: false }).limit(6),
  ])

  return {
    totalProjects:   totalProjects ?? 0,
    activeProjects:  activeProjects ?? 0,
    totalClients:    totalClients ?? 0,
    totalLeads:      totalLeads ?? 0,
    wonLeads:        wonLeads ?? 0,
    pendingTasks:    pendingTasks ?? 0,
    expiringLicenses: expiringLicenses ?? [],
    overdueConds:     overdueConds ?? [],
    recentProjects:   recentProjects ?? [],
    userName:         user.name,
  }
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', in_progress: 'Em andamento', waiting_agency: 'Ag. órgão',
  pending_docs: 'Pend. docs', approved: 'Aprovado', rejected: 'Indeferido', archived: 'Arquivado',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#94a3b8', in_progress: '#3b82f6', waiting_agency: '#f59e0b',
  pending_docs: '#8b5cf6', approved: '#22c55e', rejected: '#ef4444', archived: '#94a3b8',
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) return <p style={{ color: 'var(--n500)' }}>Erro ao carregar dados.</p>

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      {/* Saudação */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 20 }}>
          {greeting}, {data.userName.split(' ')[0]}! 👋
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n500)', marginTop: 4 }}>
          Aqui está um resumo do seu dia
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard icon={<FolderOpen size={20} />} label="Projetos ativos"  value={data.activeProjects}  total={data.totalProjects}  color="#3b82f6" href="/projects" />
        <KPICard icon={<Users size={20} />}      label="Clientes"         value={data.totalClients}    color="#22c55e"             href="/clients" />
        <KPICard icon={<TrendingUp size={20} />} label="Leads no pipeline" value={data.totalLeads}     sub={`${data.wonLeads} ganhos`} color="#7c3aed" href="/crm" />
        <KPICard icon={<ListTodo size={20} />}   label="Tarefas pendentes" value={data.pendingTasks}   color="#f59e0b"             href="/tasks" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Projetos recentes */}
        <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 14 }}>Projetos recentes</h3>
            <Link href="/projects" style={{ fontSize: 12, color: 'var(--g600)', textDecoration: 'none', fontWeight: 500 }}>
              Ver todos →
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--n400)', textAlign: 'center', padding: '20px 0' }}>Nenhum projeto ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recentProjects.map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--n100)' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: STATUS_COLOR[p.status] ?? '#94a3b8',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--n400)' }}>
                        {p.clients?.name} · {STATUS_LABEL[p.status]}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--n600)', flexShrink: 0 }}>
                      {p.progress_pct}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Licenças vencendo */}
          <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={16} color="#f59e0b" />
              <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 14 }}>Licenças vencendo (90 dias)</h3>
            </div>
            {data.expiringLicenses.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--n400)' }}>Nenhuma licença vencendo em breve ✓</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.expiringLicenses.map((p: any) => {
                  const days = Math.ceil((new Date(p.license_expires_at).getTime() - now.getTime()) / 86400000)
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', borderRadius: 8,
                        background: days <= 30 ? 'var(--red-bg)' : 'var(--amber-bg)',
                        border: `1px solid ${days <= 30 ? 'var(--red-b)' : '#fcd34d'}`,
                      }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--n800)' }}>{p.name}</p>
                          <p style={{ fontSize: 10.5, color: 'var(--n500)' }}>{p.clients?.name}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: days <= 30 ? 'var(--red)' : '#92400e' }}>
                          {days}d
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Condicionantes vencidas */}
          {data.overdueConds.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--red-b)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color="var(--red)" />
                <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>
                  Condicionantes vencidas ({data.overdueConds.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.overdueConds.map((c: any) => (
                  <Link key={c.id} href={`/projects/${c.project?.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '6px 0', borderBottom: '1px solid var(--n100)' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--n800)' }}>{c.title}</p>
                      <p style={{ fontSize: 10.5, color: 'var(--n400)' }}>
                        {c.project?.name} · {new Date(c.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({
  icon, label, value, total, sub, color, href,
}: {
  icon: React.ReactNode; label: string; value: number
  total?: number; sub?: string; color: string; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--n200)',
        borderRadius: 14, padding: '18px 20px',
        transition: 'all .15s',
        cursor: 'pointer',
      }}
  >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: color + '18', color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
        </div>
        <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-sora)', color: 'var(--n900)', lineHeight: 1 }}>
          {value}
          {total !== undefined && total > 0 && (
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--n400)', marginLeft: 4 }}>/ {total}</span>
          )}
        </p>
        <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 4 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--g600)', marginTop: 2, fontWeight: 500 }}>{sub}</p>}
      </div>
    </Link>
  )
}
