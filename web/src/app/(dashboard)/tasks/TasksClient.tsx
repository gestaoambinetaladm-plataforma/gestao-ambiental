'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Calendar, User, AlertCircle } from 'lucide-react'
import { updateTaskStatusAction, deleteTaskAction } from '@/lib/tasks/actions'
import TaskModal from './TaskModal'

const COLUMNS = [
  { value: 'backlog',     label: 'Backlog',      color: '#94a3b8' },
  { value: 'todo',        label: 'A fazer',      color: '#3b82f6' },
  { value: 'in_progress', label: 'Em andamento', color: '#f59e0b' },
  { value: 'review',      label: 'Revisão',      color: '#8b5cf6' },
  { value: 'done',        label: 'Concluído',    color: '#22c55e' },
]

const PRIORITY_STYLE: Record<string, { color: string; label: string }> = {
  low:    { color: '#64748b', label: 'Baixa'   },
  medium: { color: '#f59e0b', label: 'Média'   },
  high:   { color: '#ef4444', label: 'Alta'    },
  urgent: { color: '#dc2626', label: 'Urgente' },
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export default function TasksClient({ tasks, members, projects }: { tasks: any[]; members: any[]; projects: any[] }) {
  const [modal, setModal]       = useState(false)
  const [, startTransition]     = useTransition()

  const grouped = COLUMNS.reduce<Record<string, any[]>>((acc, c) => {
    acc[c.value] = tasks.filter(t => t.status === c.value)
    return acc
  }, {})

  function handleMove(task: any, direction: 'forward' | 'back') {
    const idx  = COLUMNS.findIndex(c => c.value === task.status)
    const next = direction === 'forward' ? idx + 1 : idx - 1
    if (next < 0 || next >= COLUMNS.length) return
    startTransition(() => { updateTaskStatusAction(task.id, COLUMNS[next].value) })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir esta tarefa?')) return
    startTransition(() => { deleteTaskAction(id) })
  }

  const donePct = tasks.length
    ? Math.round((grouped['done'].length / tasks.length) * 100)
    : 0

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18 }}>Tarefas</h2>
          <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>
            {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} · {donePct}% concluídas
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
          <Plus size={15} /> Nova tarefa
        </button>
      </div>

      {/* Kanban */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))`,
        gap: 12, overflowX: 'auto', paddingBottom: 8,
      }}>
        {COLUMNS.map(col => (
          <div key={col.value}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginBottom: 10, padding: '0 4px',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--n700)', flex: 1 }}>{col.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'var(--n150)', color: 'var(--n500)',
                borderRadius: 999, padding: '1px 7px',
              }}>
                {grouped[col.value].length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
              {grouped[col.value].map(task => {
                const prio    = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium
                const overdue = isOverdue(task.due_date) && task.status !== 'done'
                return (
                  <div
                    key={task.id}
                    style={{
                      background: '#fff',
                      border: `1px solid ${overdue ? 'var(--red-b)' : 'var(--n200)'}`,
                      borderRadius: 10, padding: 12,
                      borderLeft: `3px solid ${col.color}`,
                    }}
                  >
                    {/* Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700,
                        color: prio.color, background: prio.color + '18',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {prio.label.toUpperCase()}
                      </span>
                      {overdue && (
                        <AlertCircle size={12} color="var(--red)" />
                      )}
                    </div>

                    <p style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.35, marginBottom: 6 }}>
                      {task.title}
                    </p>

                    {task.project && (
                      <p style={{ fontSize: 10.5, color: 'var(--g700)', marginBottom: 5 }}>
                        📁 {task.project.name}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {task.assigned_to_profile && (
                        <span style={{ fontSize: 10.5, color: 'var(--n500)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <User size={9} /> {task.assigned_to_profile.name.split(' ')[0]}
                        </span>
                      )}
                      {task.due_date && (
                        <span style={{
                          fontSize: 10.5,
                          color: overdue ? 'var(--red)' : 'var(--n500)',
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontWeight: overdue ? 600 : 400,
                        }}>
                          <Calendar size={9} />
                          {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {col.value !== 'backlog' && (
                        <button onClick={() => handleMove(task, 'back')} style={qBtn}>←</button>
                      )}
                      {col.value !== 'done' && (
                        <button
                          onClick={() => handleMove(task, 'forward')}
                          style={{ ...qBtn, color: 'var(--g700)', background: 'var(--g50)', borderColor: 'var(--g200)' }}
                        >→</button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{ ...qBtn, color: 'var(--red)', background: 'var(--red-bg)', borderColor: 'var(--red-b)' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {grouped[col.value].length === 0 && (
                <div style={{
                  border: '1.5px dashed var(--n200)', borderRadius: 10,
                  padding: '20px 12px', textAlign: 'center',
                  color: 'var(--n300)', fontSize: 11,
                }}>
                  Sem tarefas
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <TaskModal
          onClose={() => setModal(false)}
          members={members}
          projects={projects}
        />
      )}
    </div>
  )
}

const qBtn: React.CSSProperties = {
  width: 24, height: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: '1px solid var(--n200)',
  background: 'var(--n50)', color: 'var(--n500)',
  cursor: 'pointer', fontSize: 11, fontWeight: 700,
}
