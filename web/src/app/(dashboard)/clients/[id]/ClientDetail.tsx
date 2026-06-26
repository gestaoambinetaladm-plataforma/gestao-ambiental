'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowLeft, Phone, Mail,
  MapPin, FileText, FolderOpen, Share2, Check, Loader2, Edit2,
} from 'lucide-react'
import { formatDocument, formatPhone, formatDate } from '@/lib/format'
import { generatePortalTokenAction } from '@/lib/clients/actions'
import EditClientModal from './EditClientModal'
import type { Client, Project } from '@/types'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: 'Rascunho',           bg: 'var(--n100)',    color: 'var(--n500)'  },
  in_progress:    { label: 'Em andamento',        bg: '#dbeafe',       color: '#1e40af'      },
  waiting_agency: { label: 'Aguardando órgão',    bg: 'var(--amber-bg)', color: '#92400e'   },
  pending_docs:   { label: 'Pend. documentos',    bg: 'var(--purple-bg)', color: 'var(--purple)' },
  approved:       { label: 'Aprovado',            bg: 'var(--g50)',    color: 'var(--g700)'  },
  rejected:       { label: 'Indeferido',          bg: 'var(--red-bg)', color: '#991b1b'      },
  archived:       { label: 'Arquivado',           bg: 'var(--n100)',   color: 'var(--n400)'  },
}

interface Props {
  client:   Client
  projects: Project[]
}

export default function ClientDetail({ client, projects }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [token, setToken] = useState(client.portal_token)
  const [editModal, setEditModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  function copyPortalLink(t?: string) {
    const tok = t ?? token
    if (!tok) return
    const url = `${window.location.origin}/portal/${tok}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleGenerateToken() {
    startTransition(async () => {
      const result = await generatePortalTokenAction(client.id)
      if (result?.success && result.token) {
        setToken(result.token)
        copyPortalLink(result.token)
      }
    })
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {/* Voltar */}
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--n500)', fontSize: 13, marginBottom: 18, padding: 0,
        }}
      >
        <ArrowLeft size={15} /> Voltar para clientes
      </button>

      {/* Header do cliente */}
      <div style={{
        background: '#fff', border: '1px solid var(--n200)',
        borderRadius: 16, padding: '22px 24px', marginBottom: 18,
        boxShadow: 'var(--sh)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--g500), var(--g700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 19, color: 'var(--n900)' }}>
                  {client.name}
                </h2>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px',
                  borderRadius: 999, background: 'var(--n100)', color: 'var(--n600)',
                  fontFamily: 'monospace',
                }}>
                  {client.type === 'pj' ? 'PJ' : 'PF'}
                </span>
              </div>
              {client.document && (
                <p style={{ fontSize: 13, color: 'var(--n500)', marginTop: 2 }}>
                  {formatDocument(client.document)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: 'transparent', border: '1px solid var(--n200)',
              color: 'var(--n700)', cursor: 'pointer',
            }}
          >
            <Edit2 size={13} /> Editar
          </button>

          <button
            onClick={token ? () => copyPortalLink() : handleGenerateToken}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: copied ? 'var(--g50)' : 'transparent',
              border: `1px solid ${copied ? 'var(--g300)' : 'var(--n200)'}`,
              color: copied ? 'var(--g700)' : 'var(--n700)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? .7 : 1,
              transition: 'all .2s',
            }}
          >
            {isPending
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : copied ? <Check size={13} /> : <Share2 size={13} />}
            {isPending ? 'Gerando...' : copied ? 'Link copiado!' : 'Compartilhar portal'}
          </button>
        </div>

        {/* Dados de contato */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14, marginTop: 20, paddingTop: 18,
          borderTop: '1px solid var(--n100)',
        }}>
          <InfoItem icon={<Phone size={13} />} label="Telefone" value={formatPhone(client.phone)} />
          <InfoItem icon={<Mail size={13} />}  label="E-mail"   value={client.email} />
          <InfoItem icon={<MapPin size={13} />} label="Cidade"  value={client.city ? `${client.city}${client.state ? ` — ${client.state}` : ''}` : undefined} />
          <InfoItem icon={<FileText size={13} />} label="Desde" value={formatDate(client.created_at)} />
        </div>

        {client.notes && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--n50)', borderRadius: 8,
            fontSize: 13, color: 'var(--n600)', lineHeight: 1.6,
          }}>
            {client.notes}
          </div>
        )}
      </div>

      {/* Projetos */}
      <div style={{
        background: '#fff', border: '1px solid var(--n200)',
        borderRadius: 16, boxShadow: 'var(--sh)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--n100)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={16} color="var(--g600)" />
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5 }}>
              Projetos
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '1px 7px',
              borderRadius: 999, background: 'var(--n100)', color: 'var(--n500)',
            }}>
              {projects.length}
            </span>
          </div>
          <button
            onClick={() => router.push('/projects/new?clientId=' + client.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'var(--g600)', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            + Novo projeto
          </button>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <FolderOpen size={28} color="var(--n300)" style={{ margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--n500)', fontSize: 13 }}>Nenhum projeto cadastrado</p>
          </div>
        ) : (
          projects.map((project, i) => {
            const st = STATUS_LABEL[project.status] ?? STATUS_LABEL.draft
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--n100)' : 'none',
                  cursor: 'pointer', transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--n50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--n900)', marginBottom: 3 }}>
                    {project.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: '1px 6px',
                      borderRadius: 4, background: 'var(--n100)', color: 'var(--n600)',
                      fontFamily: 'monospace',
                    }}>
                      {project.license_type}
                    </span>
                    {project.agency && (
                      <span style={{ fontSize: 11, color: 'var(--n400)' }}>{project.agency}</span>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div style={{ width: 100 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--n400)' }}>Progresso</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--n700)' }}>{project.progress_pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--n150)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${project.progress_pct}%`, background: 'var(--g500)', borderRadius: 999 }} />
                  </div>
                </div>

                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '3px 8px',
                  borderRadius: 999, background: st.bg, color: st.color,
                  whiteSpace: 'nowrap',
                }}>
                  {st.label}
                </span>
              </div>
            )
          })
        )}
      </div>

      {editModal && (
        <EditClientModal client={client} onClose={() => setEditModal(false)} />
      )}
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--n400)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: value ? 'var(--n800)' : 'var(--n300)' }}>
        {value || '—'}
      </div>
    </div>
  )
}
