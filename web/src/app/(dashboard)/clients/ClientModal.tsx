'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClientAction } from '@/lib/clients/actions'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function ClientModal({ onClose }: { onClose: () => void }) {
  const router  = useRouter()
  const [type,    setType]    = useState<'pj' | 'pf'>('pj')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    fd.set('type', type)

    const result = await createClientAction(fd)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onClose()
    router.refresh()
    if (result.id) router.push(`/clients/${result.id}`)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 560,
        boxShadow: 'var(--shl)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--n200)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15 }}>
            Novo cliente
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Tipo */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n700)', display: 'block', marginBottom: 6 }}>
              Tipo de pessoa
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['pj', 'pf'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: `1.5px solid ${type === t ? 'var(--g400)' : 'var(--n200)'}`,
                    background: type === t ? 'var(--g50)' : '#fff',
                    color: type === t ? 'var(--g700)' : 'var(--n600)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <Field label={type === 'pj' ? 'Razão social / Nome fantasia' : 'Nome completo'} required>
            <input name="name" required placeholder={type === 'pj' ? 'Empresa Ltda' : 'João da Silva'} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={type === 'pj' ? 'CNPJ' : 'CPF'}>
              <input name="document" placeholder={type === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'} />
            </Field>
            <Field label="Telefone">
              <input name="phone" placeholder="(00) 00000-0000" />
            </Field>
          </div>

          <Field label="E-mail">
            <input name="email" type="email" placeholder="contato@empresa.com.br" />
          </Field>

          <Field label="Endereço">
            <input name="address" placeholder="Rua, número, bairro" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <Field label="Cidade">
              <input name="city" placeholder="Palmas" />
            </Field>
            <Field label="Estado">
              <select name="state" defaultValue="">
                <option value="">UF</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Observações">
            <textarea name="notes" rows={3} placeholder="Informações adicionais..." />
          </Field>

          {error && (
            <p style={{
              fontSize: 12, color: 'var(--red)',
              background: 'var(--red-bg)', border: '1px solid var(--red-b)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 16,
            }}>
              {error}
            </p>
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
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--g600)', color: '#fff', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
            }}>
              {loading ? 'Salvando...' : 'Cadastrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--n700)', display: 'block', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <style>{`
        .field-wrap input, .field-wrap select, .field-wrap textarea {
          width: 100%; padding: 8px 11px;
          border: 1px solid var(--n200); border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: var(--n900); background: #fff; outline: none;
          transition: border-color .15s;
        }
        .field-wrap input:focus, .field-wrap select:focus, .field-wrap textarea:focus {
          border-color: var(--g400);
          box-shadow: 0 0 0 3px rgba(40,148,74,.1);
        }
        .field-wrap textarea { resize: vertical; }
      `}</style>
      <div className="field-wrap">{children}</div>
    </div>
  )
}
