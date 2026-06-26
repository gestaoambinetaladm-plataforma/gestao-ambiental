import { notFound } from 'next/navigation'
import { adminClient as supabase } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/format'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: 'Rascunho',         bg: '#f1f5f9', color: '#475569' },
  in_progress:    { label: 'Em andamento',      bg: '#dbeafe', color: '#1e40af' },
  waiting_agency: { label: 'Aguardando órgão',  bg: '#fef3c7', color: '#92400e' },
  pending_docs:   { label: 'Pend. documentos',  bg: '#ede9fe', color: '#5b21b6' },
  approved:       { label: 'Aprovado',          bg: '#dcfce7', color: '#166534' },
  rejected:       { label: 'Indeferido',        bg: '#fee2e2', color: '#991b1b' },
  archived:       { label: 'Arquivado',         bg: '#f1f5f9', color: '#94a3b8' },
}

const COND_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Pendente',    bg: '#fef3c7', color: '#92400e' },
  in_progress: { label: 'Em andamento', bg: '#dbeafe', color: '#1e40af' },
  fulfilled:   { label: 'Cumprida',   bg: '#dcfce7', color: '#166534' },
  overdue:     { label: 'Atrasada',   bg: '#fee2e2', color: '#991b1b' },
  waived:      { label: 'Dispensada', bg: '#f1f5f9', color: '#94a3b8' },
}

export default async function PortalPage({ params }: { params: { token: string } }) {
  // Busca o cliente pelo token (sem autenticação)
  const { data: client } = await (supabase as any)
    .from('clients')
    .select('*')
    .eq('portal_token', params.token)
    .single()

  if (!client) notFound()

  // Busca projetos + condicionantes
  const { data: projects } = await (supabase as any)
    .from('projects')
    .select('*, condicionantes(*)')
    .eq('client_id', client.id)
    .eq('organization_id', client.organization_id)
    .order('created_at', { ascending: false })

  // Busca documentos visíveis ao cliente
  const projectIds = (projects ?? []).map((p: any) => p.id)
  const { data: documents } = projectIds.length > 0
    ? await (supabase as any)
        .from('documents')
        .select('*')
        .eq('organization_id', client.organization_id)
        .eq('is_visible_to_client', true)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Busca org para mostrar nome
  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('name')
    .eq('id', client.organization_id)
    .single()

  const initials = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #28944a, #1d6b36)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{org?.name ?? 'Portal do Cliente'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Portal do Cliente</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Acesso somente leitura
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 16px' }}>

        {/* Card cliente */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #28944a, #1d6b36)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{client.name}</h1>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                {client.email ?? ''}{client.email && client.phone ? ' · ' : ''}{client.phone ?? ''}
              </p>
            </div>
          </div>
        </div>

        {/* Projetos */}
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
          Licenciamentos ({(projects ?? []).length})
        </h2>

        {(projects ?? []).length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13,
          }}>
            Nenhum projeto cadastrado.
          </div>
        ) : (
          (projects ?? []).map((project: any) => {
            const st = STATUS_LABEL[project.status] ?? STATUS_LABEL.draft
            const condicionantes = project.condicionantes ?? []
            const projDocs = (documents ?? []).filter((d: any) => d.project_id === project.id)

            return (
              <div key={project.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden',
              }}>
                {/* Cabeçalho do projeto */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: condicionantes.length > 0 || projDocs.length > 0 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 4, background: '#f1f5f9', color: '#475569',
                          fontFamily: 'monospace', letterSpacing: .5,
                        }}>
                          {project.license_type}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '2px 8px',
                          borderRadius: 999, background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{project.name}</div>
                      {project.agency && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{project.agency}</div>
                      )}
                    </div>

                    {/* Progresso */}
                    <div style={{ minWidth: 100, textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#28944a' }}>{project.progress_pct}%</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>concluído</div>
                      <div style={{
                        height: 5, background: '#e2e8f0', borderRadius: 999,
                        overflow: 'hidden', marginTop: 6, width: 100,
                      }}>
                        <div style={{
                          height: '100%', width: `${project.progress_pct}%`,
                          background: 'linear-gradient(90deg, #28944a, #22c55e)',
                          borderRadius: 999,
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  {(project.license_number || project.license_issued_at || project.license_expires_at) && (
                    <div style={{
                      display: 'flex', gap: 20, marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid #f1f5f9',
                    }}>
                      {project.license_number && (
                        <Dt label="N° da licença" value={project.license_number} />
                      )}
                      {project.protocol_number && (
                        <Dt label="Protocolo" value={project.protocol_number} />
                      )}
                      {project.license_issued_at && (
                        <Dt label="Emissão" value={formatDate(project.license_issued_at)} />
                      )}
                      {project.license_expires_at && (
                        <Dt label="Vencimento" value={formatDate(project.license_expires_at)} />
                      )}
                    </div>
                  )}
                </div>

                {/* Condicionantes */}
                {condicionantes.length > 0 && (
                  <div style={{ padding: '14px 20px', borderBottom: projDocs.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
                      Condicionantes ({condicionantes.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {condicionantes.map((c: any) => {
                        const cs = COND_STATUS[c.status] ?? COND_STATUS.pending
                        const isOverdue = c.due_date && new Date(c.due_date) < new Date() && c.status !== 'fulfilled' && c.status !== 'waived'
                        return (
                          <div key={c.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: isOverdue ? '#fff7f7' : '#f8fafc',
                            borderRadius: 8, border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`,
                            gap: 12,
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a' }}>{c.title}</div>
                              {c.due_date && (
                                <div style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#64748b', marginTop: 2 }}>
                                  Prazo: {formatDate(c.due_date)}
                                  {isOverdue ? ' — Atrasada' : ''}
                                </div>
                              )}
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 500, padding: '3px 8px',
                              borderRadius: 999, background: cs.bg, color: cs.color,
                              whiteSpace: 'nowrap',
                            }}>
                              {cs.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Documentos visíveis ao cliente */}
                {projDocs.length > 0 && (
                  <div style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
                      Documentos ({projDocs.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {projDocs.map((doc: any) => (
                        <div key={doc.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', background: '#f8fafc',
                          borderRadius: 8, border: '1px solid #e2e8f0',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ fontSize: 12, color: '#0f172a', flex: 1 }}>{doc.name}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 32 }}>
          Portal do cliente — acesso somente leitura · {org?.name}
        </p>
      </div>
    </div>
  )
}

function Dt({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{value}</div>
    </div>
  )
}
