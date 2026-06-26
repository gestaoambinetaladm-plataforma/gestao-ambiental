'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { updateClientAction } from '@/lib/clients/actions'

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

interface Props {
  client: any
  onClose: () => void
}

export default function EditClientModal({ client, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const result = await updateClientAction(client.id, new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    // Sucesso → revalidatePath fecha o modal automaticamente
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
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
              Editar cliente
            </h3>
            <p style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>{client.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <style>{`
            .ec input, .ec select, .ec textarea {
              width: 100%; padding: 8px 11px; border: 1px solid var(--n200);
              border-radius: 8px; font-family: 'DM Sans', sans-serif;
              font-size: 13px; color: var(--n900); background: #fff; outline: none;
            }
            .ec input:focus, .ec select:focus, .ec textarea:focus {
              border-color: var(--g400); box-shadow: 0 0 0 3px rgba(40,148,74,.1);
            }
          `}</style>

          <div className="ec">
            {/* Tipo */}
            <F label="Tipo de pessoa" required>
              <select name="type" defaultValue={client.type}>
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica</option>
              </select>
            </F>

            {/* Nome */}
            <F label="Nome / Razão Social" required>
              <input name="name" required defaultValue={client.name} placeholder="Nome completo ou razão social" />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="CPF / CNPJ">
                <input name="document" defaultValue={client.document ?? ''} placeholder="000.000.000-00" />
              </F>
              <F label="Telefone">
                <input name="phone" defaultValue={client.phone ?? ''} placeholder="(00) 00000-0000" />
              </F>
            </div>

            <F label="E-mail">
              <input name="email" type="email" defaultValue={client.email ?? ''} placeholder="email@exemplo.com" />
            </F>

            <F label="Endereço">
              <input name="address" defaultValue={client.address ?? ''} placeholder="Rua, número, bairro..." />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <F label="Cidade">
                <input name="city" defaultValue={client.city ?? ''} placeholder="Cuiabá" />
              </F>
              <F label="UF">
                <select name="state" defaultValue={client.state ?? ''} style={{ width: 80 }}>
                  <option value="">—</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
            </div>

            <F label="Observações">
              <textarea name="notes" rows={3} defaultValue={client.notes ?? ''} placeholder="Informações adicionais..." />
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
