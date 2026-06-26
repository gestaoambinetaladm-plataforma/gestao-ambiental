'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createLeadAction } from '@/lib/leads/actions'

const SOURCES = ['Indicação', 'Site', 'LinkedIn', 'Instagram', 'Google', 'Evento', 'Outro']
const STAGES  = [
  { value: 'new',           label: 'Novo'              },
  { value: 'contacted',     label: 'Contactado'        },
  { value: 'proposal_sent', label: 'Proposta Enviada'  },
  { value: 'negotiation',   label: 'Negociação'        },
]

export default function LeadModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createLeadAction(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
        boxShadow: 'var(--shl)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--n200)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15 }}>Novo lead</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <style>{`
            .lf input, .lf select, .lf textarea {
              width: 100%; padding: 8px 11px; border: 1px solid var(--n200);
              border-radius: 8px; font-family: 'DM Sans', sans-serif;
              font-size: 13px; color: var(--n900); background: #fff; outline: none;
            }
            .lf input:focus, .lf select:focus, .lf textarea:focus {
              border-color: var(--g400); box-shadow: 0 0 0 3px rgba(40,148,74,.1);
            }
          `}</style>

          <div className="lf">
            <F label="Nome do contato" required>
              <input name="name" required placeholder="João da Silva" />
            </F>
            <F label="Empresa">
              <input name="company" placeholder="Fazenda Boa Vista Ltda" />
            </F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Telefone">
                <input name="phone" placeholder="(65) 99999-9999" />
              </F>
              <F label="E-mail">
                <input name="email" type="email" placeholder="joao@email.com" />
              </F>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Origem">
                <select name="source">
                  <option value="">Selecione...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Etapa inicial">
                <select name="stage" defaultValue="new">
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </F>
            </div>
            <F label="Valor estimado (R$)">
              <input name="estimated_value" type="number" step="0.01" placeholder="50000.00" />
            </F>
            <F label="Observações">
              <textarea name="notes" rows={3} placeholder="Contexto do lead, tipo de licença necessária..." />
            </F>
          </div>

          {error && (
            <p style={{
              fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)',
              border: '1px solid var(--red-b)', borderRadius: 8,
              padding: '8px 12px', marginBottom: 16,
            }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'transparent', border: '1px solid var(--n200)',
              color: 'var(--n700)', cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--g600)', color: '#fff', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
            }}>{loading ? 'Criando...' : 'Criar lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function F({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n700)', display: 'block', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
