'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createProjectAction } from '@/lib/projects/actions'

const LICENSE_TYPES = [
  { value: 'LP',    label: 'LP — Licença Prévia'                        },
  { value: 'LI',    label: 'LI — Licença de Instalação'                 },
  { value: 'LO',    label: 'LO — Licença de Operação'                   },
  { value: 'LAS',   label: 'LAS — Licença Ambiental Simplificada'       },
  { value: 'LAR',   label: 'LAR — Licença por Adesão e Compromisso'     },
  { value: 'LUP',   label: 'LUP — Licença de Uso Provisório'            },
  { value: 'AAF',   label: 'AAF — Autorização Ambiental de Funcionamento'},
  { value: 'AUF',   label: 'AUF — Autorização de Uso de Fauna'          },
  { value: 'ADA',   label: 'ADA — Autorização de Desmate e Aproveitamento'},
  { value: 'OTHER', label: 'Outros'                                      },
]

export default function ProjectModal({ onClose, defaultClientId }: { onClose: () => void; defaultClientId?: string }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createProjectAction(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
        boxShadow: 'var(--shl)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--n200)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15 }}>Novo projeto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <style>{`
            .pf input, .pf select, .pf textarea {
              width: 100%; padding: 8px 11px; border: 1px solid var(--n200);
              border-radius: 8px; font-family: 'DM Sans', sans-serif;
              font-size: 13px; color: var(--n900); background: #fff; outline: none;
            }
            .pf input:focus, .pf select:focus, .pf textarea:focus {
              border-color: var(--g400); box-shadow: 0 0 0 3px rgba(40,148,74,.1);
            }
          `}</style>

          <div className="pf">
            <F label="Cliente" required>
              <select name="client_id" required defaultValue={defaultClientId ?? ''}>
                <option value="">Selecione o cliente...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </F>

            <F label="Nome do projeto" required>
              <input name="name" required placeholder="LP — Fazenda São João" />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Tipo de licença" required>
                <select name="license_type" required defaultValue="">
                  <option value="">Selecione...</option>
                  {LICENSE_TYPES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </F>
              <F label="Órgão responsável">
                <input name="agency" placeholder="SEMA-MT, NATURATINS..." />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Número do protocolo">
                <input name="protocol_number" placeholder="000000/2024" />
              </F>
              <F label="Número da licença">
                <input name="license_number" placeholder="LO-0001/2024" />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <F label="Data de emissão">
                <input name="license_issued_at" type="date" />
              </F>
              <F label="Data de vencimento">
                <input name="license_expires_at" type="date" />
              </F>
              <F label="Validade (anos)">
                <input name="license_validity_years" type="number" min="1" max="10" placeholder="4" />
              </F>
            </div>

            <F label="Descrição">
              <textarea name="description" rows={3} placeholder="Informações adicionais sobre o projeto..." />
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
            }}>{loading ? 'Criando...' : 'Criar projeto'}</button>
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
