'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { updateProjectAction } from '@/lib/projects/actions'

const LICENSE_TYPES = [
  { value: 'LP',    label: 'LP — Licença Prévia'                         },
  { value: 'LI',    label: 'LI — Licença de Instalação'                  },
  { value: 'LO',    label: 'LO — Licença de Operação'                    },
  { value: 'LAS',   label: 'LAS — Licença Ambiental Simplificada'        },
  { value: 'LAR',   label: 'LAR — Licença por Adesão e Compromisso'      },
  { value: 'LUP',   label: 'LUP — Licença de Uso Provisório'             },
  { value: 'AAF',   label: 'AAF — Autorização Ambiental de Funcionamento' },
  { value: 'AUF',   label: 'AUF — Autorização de Uso de Fauna'           },
  { value: 'ADA',   label: 'ADA — Autorização de Desmate e Aproveitamento'},
  { value: 'OTHER', label: 'Outros'                                       },
]

const STATUSES = [
  { value: 'draft',          label: 'Rascunho'          },
  { value: 'in_progress',    label: 'Em andamento'      },
  { value: 'waiting_agency', label: 'Aguardando órgão'  },
  { value: 'pending_docs',   label: 'Pend. documentos'  },
  { value: 'approved',       label: 'Aprovado'          },
  { value: 'rejected',       label: 'Indeferido'        },
  { value: 'archived',       label: 'Arquivado'         },
]

interface Props {
  project: any
  clients: any[]
  onClose: () => void
}

export default function EditProjectModal({ project, clients, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await updateProjectAction(project.id, new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Se sucesso, o revalidatePath vai recarregar a página automaticamente
  }

  // Formata date para input type="date" (YYYY-MM-DD)
  function toDateInput(val: string | null | undefined) {
    if (!val) return ''
    return val.split('T')[0]
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--n200)',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15 }}>
              Editar projeto
            </h3>
            <p style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>{project.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <style>{`
            .ef input, .ef select, .ef textarea {
              width: 100%; padding: 8px 11px; border: 1px solid var(--n200);
              border-radius: 8px; font-family: 'DM Sans', sans-serif;
              font-size: 13px; color: var(--n900); background: #fff; outline: none;
            }
            .ef input:focus, .ef select:focus, .ef textarea:focus {
              border-color: var(--g400); box-shadow: 0 0 0 3px rgba(40,148,74,.1);
            }
          `}</style>

          <div className="ef">
            {/* Cliente (readonly visual, mas enviado como hidden) */}
            <F label="Cliente">
              <input
                value={project.clients?.name ?? ''}
                disabled
                style={{ background: 'var(--n50)', color: 'var(--n400)', cursor: 'not-allowed' }}
              />
              <input type="hidden" name="client_id" value={project.client_id} />
            </F>

            <F label="Nome do projeto" required>
              <input name="name" required defaultValue={project.name} placeholder="LP — Fazenda São João" />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Tipo de licença" required>
                <select name="license_type" required defaultValue={project.license_type}>
                  {LICENSE_TYPES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </F>
              <F label="Status">
                <select name="status" defaultValue={project.status}>
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Órgão responsável">
                <input name="agency" defaultValue={project.agency ?? ''} placeholder="SEMA-MT, NATURATINS..." />
              </F>
              <F label="Número do protocolo">
                <input name="protocol_number" defaultValue={project.protocol_number ?? ''} placeholder="000000/2024" />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Número da licença">
                <input name="license_number" defaultValue={project.license_number ?? ''} placeholder="LO-0001/2024" />
              </F>
              <F label="Validade (anos)">
                <input name="license_validity_years" type="number" min="1" max="10"
                  defaultValue={project.license_validity_years ?? ''} placeholder="4" />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Data de emissão">
                <input name="license_issued_at" type="date" defaultValue={toDateInput(project.license_issued_at)} />
              </F>
              <F label="Data de vencimento">
                <input name="license_expires_at" type="date" defaultValue={toDateInput(project.license_expires_at)} />
              </F>
            </div>

            <F label="Descrição">
              <textarea name="description" rows={3} defaultValue={project.description ?? ''}
                placeholder="Informações adicionais sobre o projeto..." />
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
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--g600)', color: '#fff', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
            }}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
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
