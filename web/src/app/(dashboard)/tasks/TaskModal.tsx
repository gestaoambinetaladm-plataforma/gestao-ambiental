'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createTaskAction } from '@/lib/tasks/actions'

export default function TaskModal({
  onClose, members, projects,
}: {
  onClose: () => void
  members: any[]
  projects: any[]
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createTaskAction(new FormData(e.currentTarget))
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
          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15 }}>Nova tarefa</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <style>{`
            .tf input, .tf select, .tf textarea {
              width: 100%; padding: 8px 11px; border: 1px solid var(--n200);
              border-radius: 8px; font-family: 'DM Sans', sans-serif;
              font-size: 13px; color: var(--n900); background: #fff; outline: none;
            }
            .tf input:focus, .tf select:focus, .tf textarea:focus {
              border-color: var(--g400); box-shadow: 0 0 0 3px rgba(40,148,74,.1);
            }
          `}</style>

          <div className="tf">
            <F label="Título" required>
              <input name="title" required placeholder="Elaborar relatório de impacto..." />
            </F>

            <F label="Descrição">
              <textarea name="description" rows={3} placeholder="Detalhes da tarefa..." />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Status">
                <select name="status" defaultValue="todo">
                  <option value="backlog">Backlog</option>
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="review">Revisão</option>
                  <option value="done">Concluído</option>
                </select>
              </F>
              <F label="Prioridade">
                <select name="priority" defaultValue="medium">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Responsável">
                <select name="assigned_to">
                  <option value="">Nenhum</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </F>
              <F label="Projeto">
                <select name="project_id">
                  <option value="">Nenhum</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Data limite">
                <input name="due_date" type="date" />
              </F>
              <F label="Horas estimadas">
                <input name="estimated_hours" type="number" step="0.5" min="0.5" placeholder="2.5" />
              </F>
            </div>
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
            }}>{loading ? 'Criando...' : 'Criar tarefa'}</button>
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
