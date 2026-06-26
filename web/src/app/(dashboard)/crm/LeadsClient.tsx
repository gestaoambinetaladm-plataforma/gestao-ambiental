'use client'

import { useState, useTransition } from 'react'
import { Plus, Phone, Mail, Building2, Trash2, ChevronRight, X, Check } from 'lucide-react'
import { updateLeadStageAction, deleteLeadAction, addLeadActivityAction } from '@/lib/leads/actions'
import LeadModal from './LeadModal'

const STAGES = [
  { value: 'new',           label: 'Novo',            color: '#64748b' },
  { value: 'contacted',     label: 'Contactado',      color: '#2563eb' },
  { value: 'proposal_sent', label: 'Proposta Enviada', color: '#7c3aed' },
  { value: 'negotiation',   label: 'Negociação',      color: '#d97706' },
  { value: 'won',           label: 'Ganho',           color: '#16a34a' },
  { value: 'lost',          label: 'Perdido',         color: '#dc2626' },
]

const ACTIVITY_TYPES = [
  { value: 'call',      label: '📞 Ligação'    },
  { value: 'email',     label: '✉️ E-mail'     },
  { value: 'meeting',   label: '🤝 Reunião'    },
  { value: 'whatsapp',  label: '💬 WhatsApp'   },
  { value: 'note',      label: '📝 Nota'       },
]

function formatCurrency(v: number | null) {
  if (!v) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function LeadsClient({ leads }: { leads: any[] }) {
  const [modal, setModal]         = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [, startTransition]       = useTransition()

  const grouped = STAGES.reduce<Record<string, any[]>>((acc, s) => {
    acc[s.value] = leads.filter(l => l.stage === s.value)
    return acc
  }, {})

  function handleMoveStage(lead: any, direction: 'forward' | 'back') {
    const idx = STAGES.findIndex(s => s.value === lead.stage)
    const next = direction === 'forward' ? idx + 1 : idx - 1
    if (next < 0 || next >= STAGES.length) return
    startTransition(() => { updateLeadStageAction(lead.id, STAGES[next].value) })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este lead?')) return
    startTransition(() => { deleteLeadAction(id) })
  }

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18 }}>CRM — Leads</h2>
          <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} no pipeline
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
          <Plus size={15} /> Novo lead
        </button>
      </div>

      {/* Kanban */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, minmax(220px, 1fr))`,
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {STAGES.map(stage => (
          <div key={stage.value}>
            {/* Header da coluna */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginBottom: 10, padding: '0 4px',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: stage.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--n700)', flex: 1 }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'var(--n150)', color: 'var(--n500)',
                borderRadius: 999, padding: '1px 7px',
              }}>
                {grouped[stage.value].length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
              {grouped[stage.value].map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--n200)',
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                    transition: 'all .15s',
                    borderLeft: `3px solid ${stage.color}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = 'var(--shm)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, lineHeight: 1.3 }}>
                    {lead.name}
                  </p>
                  {lead.company && (
                    <p style={{ fontSize: 11, color: 'var(--n500)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <Building2 size={10} /> {lead.company}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                    {lead.phone && (
                      <span style={{ fontSize: 11, color: 'var(--n400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={9} /> {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span style={{ fontSize: 11, color: 'var(--n400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={9} /> {lead.email}
                      </span>
                    )}
                  </div>

                  {lead.estimated_value && (
                    <p style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--g700)',
                      background: 'var(--g50)', borderRadius: 4,
                      padding: '2px 6px', display: 'inline-block', marginBottom: 8,
                    }}>
                      {formatCurrency(lead.estimated_value)}
                    </p>
                  )}

                  {/* Ações rápidas */}
                  <div
                    style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {stage.value !== 'new' && stage.value !== 'lost' && (
                      <button
                        onClick={() => handleMoveStage(lead, 'back')}
                        title="Voltar etapa"
                        style={quickBtnStyle}
                      >
                        ←
                      </button>
                    )}
                    {stage.value !== 'won' && stage.value !== 'lost' && (
                      <button
                        onClick={() => handleMoveStage(lead, 'forward')}
                        title="Avançar etapa"
                        style={{ ...quickBtnStyle, color: 'var(--g700)', background: 'var(--g50)', borderColor: 'var(--g200)' }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(lead.id)}
                      title="Excluir lead"
                      style={{ ...quickBtnStyle, color: 'var(--red)', background: 'var(--red-bg)', borderColor: 'var(--red-b)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}

              {grouped[stage.value].length === 0 && (
                <div style={{
                  border: '1.5px dashed var(--n200)', borderRadius: 10,
                  padding: '20px 12px', textAlign: 'center',
                  color: 'var(--n300)', fontSize: 11,
                }}>
                  Sem leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && <LeadModal onClose={() => setModal(false)} />}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  )
}

const quickBtnStyle: React.CSSProperties = {
  width: 24, height: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: '1px solid var(--n200)',
  background: 'var(--n50)', color: 'var(--n500)',
  cursor: 'pointer', fontSize: 11, fontWeight: 700,
}

// ─── Drawer de detalhe do lead ────────────────────────────────────────────────

function LeadDrawer({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [actType, setActType] = useState('call')
  const [actText, setActText] = useState('')
  const [saving, setSaving]   = useState(false)
  const [, startTransition]   = useTransition()

  const stage = STAGES.find(s => s.value === lead.stage)

  async function handleAddActivity() {
    if (!actText.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.set('type', actType)
    fd.set('description', actText)
    await addLeadActivityAction(lead.id, fd)
    setActText('')
    setSaving(false)
    startTransition(() => {})
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        height: '100vh', overflowY: 'auto',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--n200)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
              {lead.name}
            </h3>
            {lead.company && (
              <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 3 }}>{lead.company}</p>
            )}
            <span style={{
              marginTop: 8, display: 'inline-block',
              fontSize: 11, fontWeight: 600,
              background: stage?.color + '18', color: stage?.color,
              padding: '2px 10px', borderRadius: 999,
            }}>
              {stage?.label}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--n200)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {lead.email && <InfoRow label="E-mail" value={lead.email} />}
            {lead.phone && <InfoRow label="Telefone" value={lead.phone} />}
            {lead.source && <InfoRow label="Origem" value={lead.source} />}
            {lead.estimated_value && (
              <InfoRow label="Valor estimado" value={formatCurrency(lead.estimated_value) ?? '-'} green />
            )}
          </div>
          {lead.notes && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--n600)', lineHeight: 1.5 }}>
              {lead.notes}
            </div>
          )}
        </div>

        {/* Mover stage */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--n200)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--n600)', marginBottom: 8 }}>MOVER PARA</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STAGES.map(s => (
              <button
                key={s.value}
                onClick={() => startTransition(() => { updateLeadStageAction(lead.id, s.value) })}
                style={{
                  fontSize: 11, fontWeight: 500,
                  padding: '4px 10px', borderRadius: 6,
                  border: `1.5px solid ${s.value === lead.stage ? s.color : 'var(--n200)'}`,
                  background: s.value === lead.stage ? s.color + '18' : 'transparent',
                  color: s.value === lead.stage ? s.color : 'var(--n600)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {s.value === lead.stage && <Check size={10} />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registrar atividade */}
        <div style={{ padding: '14px 20px', flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--n600)', marginBottom: 10 }}>REGISTRAR ATIVIDADE</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {ACTIVITY_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setActType(t.value)}
                style={{
                  fontSize: 11, padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${actType === t.value ? 'var(--g400)' : 'var(--n200)'}`,
                  background: actType === t.value ? 'var(--g50)' : '#fff',
                  color: actType === t.value ? 'var(--g700)' : 'var(--n600)',
                  fontWeight: actType === t.value ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={actText}
            onChange={e => setActText(e.target.value)}
            placeholder="Descreva a atividade..."
            rows={3}
            style={{
              width: '100%', padding: '8px 11px',
              border: '1px solid var(--n200)', borderRadius: 8,
              fontSize: 13, color: 'var(--n900)', resize: 'vertical', outline: 'none',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 8,
            }}
          />
          <button
            onClick={handleAddActivity}
            disabled={saving || !actText.trim()}
            style={{
              background: 'var(--g600)', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 13, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? .6 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: green ? 'var(--g700)' : 'var(--n800)', fontWeight: green ? 600 : 400 }}>
        {value}
      </p>
    </div>
  )
}
