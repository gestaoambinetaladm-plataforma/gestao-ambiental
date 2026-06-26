'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, Circle, AlertTriangle, FileText,
  Calendar, Plus, Trash2, Check, X, Upload, Download, Pencil, FileDown,
} from 'lucide-react'
import EditProjectModal from './EditProjectModal'
import { formatDate } from '@/lib/format'
import {
  toggleChecklistItemAction,
  createCondicionanteAction,
  updateCondicionanteStatusAction,
  deleteCondicionanteAction,
  uploadProjectDocumentAction,
  deleteProjectDocumentAction,
} from '@/lib/projects/actions'
import type { Project, Condicionante } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', in_progress: 'Em andamento', waiting_agency: 'Aguardando órgão',
  pending_docs: 'Pend. documentos', approved: 'Aprovado', rejected: 'Indeferido', archived: 'Arquivado',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:          { bg: 'var(--n100)',      color: 'var(--n500)'   },
  in_progress:    { bg: '#dbeafe',          color: '#1e40af'       },
  waiting_agency: { bg: 'var(--amber-bg)',  color: '#92400e'       },
  pending_docs:   { bg: 'var(--purple-bg)', color: 'var(--purple)' },
  approved:       { bg: 'var(--g50)',       color: 'var(--g700)'   },
  rejected:       { bg: 'var(--red-bg)',    color: '#991b1b'       },
  archived:       { bg: 'var(--n100)',      color: 'var(--n400)'   },
}

const COND_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending',     label: 'Pendente',      color: '#64748b' },
  { value: 'in_progress', label: 'Em andamento',  color: '#3b82f6' },
  { value: 'fulfilled',   label: 'Cumprida',      color: '#22c55e' },
  { value: 'overdue',     label: 'Vencida',       color: '#ef4444' },
  { value: 'waived',      label: 'Dispensada',    color: '#a855f7' },
]

const CATEGORY_LABEL: Record<string, string> = {
  report: 'Relatório', license: 'Licença', study: 'Estudo', map: 'Mapa',
  photo: 'Foto', contract: 'Contrato', official_letter: 'Ofício', other: 'Outro',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  project:        Project & { clients?: any }
  condicionantes: Condicionante[]
  checklist:      any[]
  documents:      any[]
  clients:        any[]
}

const TABS = ['Visão Geral', 'Checklist', 'Condicionantes', 'Documentos']

export default function ProjectDetail({ project, condicionantes: initialConds, checklist, documents: initialDocs, clients }: Props) {
  const router = useRouter()
  const [tab,        setTab]        = useState(0)
  const [items,      setItems]      = useState(checklist)
  const [conds,      setConds]      = useState(initialConds)
  const [docs,       setDocs]       = useState(initialDocs)
  const [editModal,  setEditModal]  = useState(false)
  const [, startTransition] = useTransition()

  const st = STATUS_STYLE[project.status] ?? STATUS_STYLE.draft

  async function toggleItem(itemId: string, current: boolean) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: !current } : i))
    await toggleChecklistItemAction(itemId, project.id, !current)
  }

  const completedCount  = items.filter(i => i.completed).length
  const daysUntilExpiry = project.license_expires_at
    ? Math.ceil((new Date(project.license_expires_at).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', color: 'var(--n500)', fontSize: 13, padding: 0,
        }}>
          <ArrowLeft size={15} /> Voltar para projetos
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`/api/reports/project/${project.id}`}
            download
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: '#fff', border: '1px solid var(--n200)',
              color: 'var(--n700)', cursor: 'pointer', textDecoration: 'none',
            }}
          >
            <FileDown size={14} /> Baixar PDF
          </a>
          <button
            onClick={() => setEditModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: '#fff', border: '1px solid var(--n200)',
              color: 'var(--n700)', cursor: 'pointer',
            }}
          >
            <Pencil size={14} /> Editar projeto
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{
        background: '#fff', border: '1px solid var(--n200)', borderRadius: 16,
        padding: '22px 24px', marginBottom: 18, boxShadow: 'var(--sh)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                fontFamily: 'monospace', background: 'var(--g50)', color: 'var(--g700)',
              }}>{project.license_type}</span>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
                background: st.bg, color: st.color,
              }}>{STATUS_LABEL[project.status]}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 19, marginBottom: 4 }}>
              {project.name}
            </h2>
            {project.clients && (
              <p style={{ fontSize: 13, color: 'var(--n500)' }}>{project.clients.name}</p>
            )}
          </div>

          {/* Progresso circular */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `conic-gradient(var(--g500) ${project.progress_pct * 3.6}deg, var(--n150) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13 }}>
                  {project.progress_pct}%
                </span>
              </div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--n400)', marginTop: 4 }}>Progresso</p>
          </div>
        </div>

        {/* Metadados */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--n100)',
        }}>
          <Meta label="Órgão"         value={project.agency} />
          <Meta label="Protocolo"     value={project.protocol_number} mono />
          <Meta label="Nº da licença" value={project.license_number} mono />
          <Meta label="Emissão"       value={formatDate(project.license_issued_at)} />
        </div>

        {/* Alerta de vencimento */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 90 && project.status === 'approved' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
            padding: '10px 14px', borderRadius: 8,
            background: daysUntilExpiry <= 30 ? 'var(--red-bg)' : 'var(--amber-bg)',
            border: `1px solid ${daysUntilExpiry <= 30 ? 'var(--red-b)' : 'var(--amber-b)'}`,
          }}>
            <AlertTriangle size={15} color={daysUntilExpiry <= 30 ? 'var(--red)' : 'var(--amber)'} />
            <span style={{ fontSize: 13, fontWeight: 500, color: daysUntilExpiry <= 30 ? '#991b1b' : '#92400e' }}>
              Licença vence em {daysUntilExpiry} dias ({formatDate(project.license_expires_at)})
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--n200)', marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: 'none', background: 'none',
            borderBottom: `2px solid ${tab === i ? 'var(--g600)' : 'transparent'}`,
            color: tab === i ? 'var(--g700)' : 'var(--n500)',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Visão Geral ── */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoCard title="Informações da licença">
            <Row label="Tipo"       value={project.license_type} />
            <Row label="Status"     value={STATUS_LABEL[project.status]} />
            <Row label="Emissão"    value={formatDate(project.license_issued_at)} />
            <Row label="Vencimento" value={formatDate(project.license_expires_at)} />
            <Row label="Validade"   value={project.license_validity_years ? `${project.license_validity_years} anos` : undefined} />
          </InfoCard>
          <InfoCard title="Processo administrativo">
            <Row label="Órgão"     value={project.agency} />
            <Row label="Protocolo" value={project.protocol_number} mono />
            <Row label="Licença Nº" value={project.license_number} mono />
            <Row label="Criado em" value={formatDate(project.created_at)} />
          </InfoCard>
          {project.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoCard title="Descrição">
                <p style={{ fontSize: 13, color: 'var(--n600)', lineHeight: 1.6 }}>{project.description}</p>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {/* ── Checklist ── */}
      {tab === 1 && (
        <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5 }}>Checklist</span>
            <span style={{ fontSize: 12, color: 'var(--n500)' }}>{completedCount}/{items.length} concluídos</span>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--n400)', fontSize: 13 }}>
              Nenhum item. Crie um template para o tipo {project.license_type} em <strong>Configurações → Templates de checklist</strong>.
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id, item.completed)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px', borderBottom: '1px solid var(--n100)',
                  cursor: 'pointer', transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--n50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {item.completed
                  ? <CheckCircle2 size={19} color="var(--g600)" style={{ flexShrink: 0 }} />
                  : <Circle size={19} color="var(--n300)" style={{ flexShrink: 0 }} />}
                <span style={{
                  fontSize: 13, flex: 1, lineHeight: 1.3,
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'var(--n400)' : 'var(--n800)',
                }}>
                  {item.title}
                </span>
                {item.completed && item.completed_at && (
                  <span style={{ fontSize: 11, color: 'var(--n400)' }}>{formatDate(item.completed_at)}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Condicionantes ── */}
      {tab === 2 && (
        <CondicionantesTab
          projectId={project.id}
          conds={conds}
          setConds={setConds}
          startTransition={startTransition}
        />
      )}

      {/* ── Documentos ── */}
      {tab === 3 && (
        <DocumentsTab
          projectId={project.id}
          docs={docs}
          setDocs={setDocs}
          startTransition={startTransition}
        />
      )}

      {editModal && (
        <EditProjectModal
          project={project}
          clients={clients}
          onClose={() => setEditModal(false)}
        />
      )}
    </div>
  )
}

// ─── Condicionantes ───────────────────────────────────────────────────────────

function CondicionantesTab({ projectId, conds, setConds, startTransition }: {
  projectId: string
  conds: any[]
  setConds: React.Dispatch<React.SetStateAction<any[]>>
  startTransition: (fn: () => void) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSaving(true)
    const result = await createCondicionanteAction(projectId, new FormData(e.currentTarget))
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
  }

  async function handleStatusChange(condId: string, status: string) {
    startTransition(() => { updateCondicionanteStatusAction(condId, projectId, status) })
    setConds(prev => prev.map(c => c.id === condId ? { ...c, status } : c))
  }

  async function handleDelete(condId: string) {
    if (!confirm('Excluir esta condicionante?')) return
    startTransition(() => { deleteCondicionanteAction(condId, projectId) })
    setConds(prev => prev.filter(c => c.id !== condId))
  }

  const sorted = [...conds].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--n500)' }}>
          {conds.length} condicionante{conds.length !== 1 ? 's' : ''} ·{' '}
          {conds.filter(c => c.status === 'fulfilled').length} cumpridas
        </p>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--g600)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 13px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{
          background: 'var(--g50)', border: '1px solid var(--g200)',
          borderRadius: 12, padding: 18, marginBottom: 16,
        }}>
          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</p>
          )}
          <form onSubmit={handleCreate}>
            <style>{`.cf2 input,.cf2 select,.cf2 textarea{width:100%;padding:7px 10px;border:1px solid var(--n200);border-radius:7px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;background:#fff;}.cf2 input:focus,.cf2 select:focus,.cf2 textarea:focus{border-color:var(--g400);}`}</style>
            <div className="cf2">
              <div style={{ marginBottom: 10 }}>
                <label style={labelSt}>Título *</label>
                <input name="title" required placeholder="Ex: Apresentar relatório semestral de fauna..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelSt}>Prazo</label>
                  <input name="due_date" type="date" />
                </div>
                <div>
                  <label style={labelSt}>Alertar antes (dias)</label>
                  <input name="alert_days_before" type="number" defaultValue="30" min="1" max="365" />
                </div>
                <div />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelSt}>Descrição</label>
                <textarea name="description" rows={2} placeholder="Detalhes da condicionante..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={submitBtnSt}>
                {saving ? 'Salvando...' : 'Adicionar condicionante'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} style={cancelBtnSt}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {sorted.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)', borderRadius: 14,
          padding: '36px 24px', textAlign: 'center',
        }}>
          <Calendar size={28} color="var(--n300)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--n500)', fontSize: 13 }}>Nenhuma condicionante cadastrada</p>
          <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4 }}>
            Adicione as obrigações e prazos da licença ambiental.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(cond => {
            const days = cond.due_date
              ? Math.ceil((new Date(cond.due_date).getTime() - Date.now()) / 86400000)
              : null
            const overdue = days !== null && days < 0 && cond.status !== 'fulfilled' && cond.status !== 'waived'
            const urgent  = days !== null && days <= 7 && days >= 0 && cond.status !== 'fulfilled' && cond.status !== 'waived'
            const warn    = days !== null && days <= 30 && days > 7 && cond.status !== 'fulfilled' && cond.status !== 'waived'

            const accent = overdue ? 'var(--red)' : urgent ? 'var(--red)' : warn ? 'var(--amber)' : cond.status === 'fulfilled' ? 'var(--g500)' : 'var(--n300)'
            const condStatus = COND_STATUSES.find(s => s.value === cond.status)

            return (
              <div key={cond.id} style={{
                background: '#fff',
                border: '1px solid var(--n200)',
                borderLeftWidth: 3, borderLeftColor: accent,
                borderRadius: 10, padding: '13px 15px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                        textDecoration: cond.status === 'fulfilled' || cond.status === 'waived' ? 'line-through' : 'none',
                        color: cond.status === 'fulfilled' || cond.status === 'waived' ? 'var(--n400)' : 'var(--n800)',
                      }}>
                        {cond.title}
                      </p>
                    </div>
                    {cond.description && (
                      <p style={{ fontSize: 12, color: 'var(--n500)', marginBottom: 8 }}>{cond.description}</p>
                    )}
                    {/* Status chips */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {COND_STATUSES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusChange(cond.id, s.value)}
                          style={{
                            fontSize: 10.5, fontWeight: 500,
                            padding: '2px 9px', borderRadius: 999, cursor: 'pointer',
                            border: `1.5px solid ${cond.status === s.value ? s.color : 'var(--n200)'}`,
                            background: cond.status === s.value ? s.color + '18' : 'transparent',
                            color: cond.status === s.value ? s.color : 'var(--n400)',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {cond.status === s.value && <Check size={9} />}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prazo */}
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                    {cond.due_date && (
                      <p style={{
                        fontSize: 12, fontWeight: 700,
                        color: overdue || urgent ? 'var(--red)' : warn ? 'var(--amber)' : 'var(--n600)',
                      }}>
                        {formatDate(cond.due_date)}
                      </p>
                    )}
                    {days !== null && cond.status !== 'fulfilled' && cond.status !== 'waived' && (
                      <p style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--n400)', marginTop: 2 }}>
                        {days < 0 ? `${Math.abs(days)}d em atraso` : days === 0 ? 'Vence hoje!' : `${days}d restantes`}
                      </p>
                    )}
                    {cond.fulfilled_at && (
                      <p style={{ fontSize: 10, color: 'var(--g600)', marginTop: 2 }}>
                        ✓ {formatDate(cond.fulfilled_at)}
                      </p>
                    )}
                    {/* Deletar */}
                    <button
                      onClick={() => handleDelete(cond.id)}
                      style={{
                        marginTop: 8, width: 26, height: 26, borderRadius: 6,
                        border: '1px solid var(--red-b)', background: 'var(--red-bg)',
                        color: 'var(--red)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 'auto',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Documentos do projeto ────────────────────────────────────────────────────

function DocumentsTab({ projectId, docs, setDocs, startTransition }: {
  projectId: string
  docs: any[]
  setDocs: React.Dispatch<React.SetStateAction<any[]>>
  startTransition: (fn: () => void) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [category,  setCategory]  = useState('other')
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setUploading(true)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('name', file.name.replace(/\.[^.]+$/, ''))
    fd.set('category', category)
    const result = await uploadProjectDocumentAction(projectId, fd)
    if (result?.error) setError(result.error)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDelete(docId: string, storagePath: string) {
    if (!confirm('Excluir documento?')) return
    setDocs(prev => prev.filter(d => d.id !== docId))
    startTransition(() => { deleteProjectDocumentAction(docId, storagePath, projectId) })
  }

  return (
    <div>
      {/* Upload toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '7px 11px', borderRadius: 8, border: '1px solid var(--n200)',
            fontSize: 12, color: 'var(--n700)', outline: 'none', background: '#fff',
          }}
        >
          {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.kml,.zip"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--g600)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500,
            cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? .6 : 1,
          }}
        >
          <Upload size={14} /> {uploading ? 'Enviando...' : 'Upload'}
        </button>
        {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
      </div>

      {/* Lista */}
      {docs.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)', borderRadius: 14,
          padding: '36px 24px', textAlign: 'center',
        }}>
          <FileText size={28} color="var(--n300)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--n500)', fontSize: 13 }}>Nenhum documento anexado</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, overflow: 'hidden' }}>
          {docs.map((doc, i) => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
              borderBottom: i < docs.length - 1 ? '1px solid var(--n100)' : 'none',
            }}>
              <FileText size={16} color="var(--g500)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--n800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--n400)' }}>
                  {CATEGORY_LABEL[doc.category] ?? 'Outro'} · {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a
                  href={`/api/documents/download?path=${encodeURIComponent(doc.storage_path)}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    width: 30, height: 30, borderRadius: 7, textDecoration: 'none',
                    border: '1px solid var(--n200)', background: 'var(--n50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--n500)',
                  }}
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
                    border: '1px solid var(--red-b)', background: 'var(--red-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--red)',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Meta({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--n400)', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, color: value ? 'var(--n800)' : 'var(--n300)' }}>
        {value || '—'}
      </p>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--sh)' }}>
      <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--n100)' }}>
      <span style={{ fontSize: 12, color: 'var(--n500)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, color: value ? 'var(--n800)' : 'var(--n300)' }}>
        {value || '—'}
      </span>
    </div>
  )
}

const labelSt: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: 'var(--n600)', display: 'block', marginBottom: 4,
}
const submitBtnSt: React.CSSProperties = {
  padding: '7px 16px', background: 'var(--g600)', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
}
const cancelBtnSt: React.CSSProperties = {
  padding: '7px 14px', background: 'transparent',
  border: '1px solid var(--n200)', color: 'var(--n600)',
  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
}
