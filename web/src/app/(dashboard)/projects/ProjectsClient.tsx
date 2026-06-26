'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, FolderOpen, Search } from 'lucide-react'
import type { Project } from '@/types'
import ProjectModal from './ProjectModal'

const STATUSES = [
  { value: 'all',           label: 'Todos'              },
  { value: 'draft',         label: 'Rascunho'           },
  { value: 'in_progress',   label: 'Em andamento'       },
  { value: 'waiting_agency',label: 'Aguardando órgão'   },
  { value: 'pending_docs',  label: 'Pend. documentos'   },
  { value: 'approved',      label: 'Aprovado'           },
  { value: 'rejected',      label: 'Indeferido'         },
  { value: 'archived',      label: 'Arquivado'          },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:          { bg: 'var(--n100)',      color: 'var(--n500)'   },
  in_progress:    { bg: '#dbeafe',          color: '#1e40af'       },
  waiting_agency: { bg: 'var(--amber-bg)',  color: '#92400e'       },
  pending_docs:   { bg: 'var(--purple-bg)', color: 'var(--purple)' },
  approved:       { bg: 'var(--g50)',       color: 'var(--g700)'   },
  rejected:       { bg: 'var(--red-bg)',    color: '#991b1b'       },
  archived:       { bg: 'var(--n100)',      color: 'var(--n400)'   },
}

const LICENSE_COLORS: Record<string, string> = {
  LP: '#2563eb', LI: '#7c3aed', LO: '#1d7035', LAS: '#d97706',
  LAR: '#0891b2', LUP: '#dc2626', AAF: '#28944a', AUF: '#6d28d9',
  ADA: '#b45309', OTHER: '#78716c',
}

const LICENSE_TYPES = ['LP','LI','LO','LAS','LAR','LUP','AAF','AUF','ADA','OTHER']

export default function ProjectsClient({ projects, activeStatus }: { projects: Project[]; activeStatus: string }) {
  const router = useRouter()
  const [modal,       setModal]       = useState(false)
  const [search,      setSearch]      = useState('')
  const [licFilter,   setLicFilter]   = useState('')

  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.protocol_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      ((p as any).clients?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchLic = !licFilter || p.license_type === licFilter
    return matchSearch && matchLic
  })

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18 }}>Projetos</h2>
          <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--g600)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 14px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Novo projeto
        </button>
      </div>

      {/* Filtros de status */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => router.push(`/projects${s.value !== 'all' ? `?status=${s.value}` : ''}`)}
            style={{
              padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: `1px solid ${activeStatus === s.value ? 'var(--g200)' : 'transparent'}`,
              background: activeStatus === s.value ? 'var(--g50)' : 'transparent',
              color: activeStatus === s.value ? 'var(--g700)' : 'var(--n600)',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filtro por tipo de licença */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          onClick={() => setLicFilter('')}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            fontFamily: 'monospace', cursor: 'pointer',
            border: `1px solid ${!licFilter ? 'var(--n400)' : 'transparent'}`,
            background: !licFilter ? 'var(--n100)' : 'transparent',
            color: !licFilter ? 'var(--n700)' : 'var(--n500)',
          }}
        >
          Todos
        </button>
        {LICENSE_TYPES.map(lt => {
          const color = LICENSE_COLORS[lt] ?? '#78716c'
          const active = licFilter === lt
          return (
            <button
              key={lt}
              onClick={() => setLicFilter(active ? '' : lt)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                fontFamily: 'monospace', cursor: 'pointer',
                border: `1px solid ${active ? color : 'transparent'}`,
                background: active ? color + '18' : 'transparent',
                color: active ? color : 'var(--n500)',
              }}
            >
              {lt}
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '1px solid var(--n200)',
        borderRadius: 8, padding: '7px 12px', maxWidth: 380, marginBottom: 16,
      }}>
        <Search size={13} color="var(--n400)" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por projeto, protocolo ou cliente..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent' }}
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
        }}>
          <FolderOpen size={32} color="var(--n300)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--n700)', marginBottom: 4 }}>Nenhum projeto encontrado</p>
          <p style={{ fontSize: 12, color: 'var(--n400)', marginBottom: 16 }}>
            Crie o primeiro projeto para começar o acompanhamento.
          </p>
          <button
            onClick={() => setModal(true)}
            style={{
              background: 'var(--g600)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Criar projeto
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(project => {
            const st = STATUS_STYLE[project.status] ?? STATUS_STYLE.draft
            const stLabel = STATUSES.find(s => s.value === project.status)?.label ?? project.status
            const licenseColor = LICENSE_COLORS[project.license_type] ?? '#78716c'
            const client = (project as any).clients

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{
                  background: '#fff', border: '1px solid var(--n200)',
                  borderRadius: 12, padding: 16, cursor: 'pointer',
                  transition: 'all .18s', boxShadow: 'var(--sh)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--g200)'
                  e.currentTarget.style.boxShadow = 'var(--shm)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--n200)'
                  e.currentTarget.style.boxShadow = 'var(--sh)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Topo do card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 4, fontFamily: 'monospace',
                    background: licenseColor + '18', color: licenseColor,
                  }}>
                    {project.license_type}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '2px 8px',
                    borderRadius: 999, background: st.bg, color: st.color,
                  }}>
                    {stLabel}
                  </span>
                </div>

                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, lineHeight: 1.3 }}>
                  {project.name}
                </p>
                {client && (
                  <p style={{ fontSize: 11.5, color: 'var(--n400)', marginBottom: 10 }}>
                    {client.name}
                  </p>
                )}

                {/* Progresso */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--n500)' }}>Progresso</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--n700)' }}>
                      {project.progress_pct}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--n150)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, background: 'var(--g500)',
                      width: `${project.progress_pct}%`, transition: 'width .55s',
                    }} />
                  </div>
                </div>

                {/* Rodapé */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 10, borderTop: '1px solid var(--n150)',
                }}>
                  {project.agency ? (
                    <span style={{ fontSize: 11, color: 'var(--n500)' }}>{project.agency}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--n300)' }}>Sem órgão</span>
                  )}
                  {project.license_expires_at && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--n600)' }}>
                      Vence: {new Date(project.license_expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <ProjectModal onClose={() => setModal(false)} />}
    </div>
  )
}
