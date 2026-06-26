'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  link: string | null
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  condicionante_due:        '⚠️',
  task_due:                 '📋',
  license_expiring:         '📅',
  project_status_changed:   '📁',
  document_uploaded:        '📄',
  mention:                  '💬',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificationsBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading,       setLoading]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unread = notifications.filter(n => !n.read).length

  async function fetchNotifications() {
    setLoading(true)
    const res = await fetch('/api/notifications')
    if (res.ok) setNotifications(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids: null }), headers: { 'Content-Type': 'application/json' } })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids: [id] }), headers: { 'Content-Type': 'application/json' } })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function handleClick(n: Notification) {
    markRead(n.id)
    if (n.link) router.push(n.link)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 34, height: 34, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--n500)',
          background: open ? 'var(--n100)' : 'transparent',
          border: '1px solid transparent',
          position: 'relative',
          transition: 'all .15s',
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            minWidth: 8, height: 8,
            borderRadius: '50%',
            background: 'var(--red)',
            border: '1.5px solid #fff',
            fontSize: 9, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: unread > 9 ? '0 3px' : 0,
          }}>
            {unread > 9 ? '9+' : ''}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 360, maxHeight: 480,
          background: '#fff', borderRadius: 14,
          border: '1px solid var(--n200)',
          boxShadow: 'var(--shl)',
          zIndex: 100, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--n100)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13 }}>
                Notificações
              </span>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: 'var(--red)', color: '#fff',
                  borderRadius: 999, padding: '1px 6px',
                }}>
                  {unread}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Marcar todas como lidas"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: 'var(--g600)', background: 'none',
                    border: 'none', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  <CheckCheck size={13} /> Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--n400)', fontSize: 12 }}>
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Bell size={24} color="var(--n300)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--n400)' }}>Sem notificações</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    background: n.read ? 'transparent' : 'var(--g50)',
                    borderBottom: '1px solid var(--n100)',
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (n.link) e.currentTarget.style.background = 'var(--n50)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'var(--g50)' }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: n.read ? 'var(--n100)' : 'var(--g100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                  }}>
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12.5, fontWeight: n.read ? 400 : 600,
                      color: 'var(--n800)', lineHeight: 1.35, marginBottom: 2,
                    }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--n500)', lineHeight: 1.4 }}>
                      {n.body}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--n300)', marginTop: 3 }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot + mark read */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {!n.read && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--g500)' }} />
                    )}
                    {!n.read && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(n.id) }}
                        title="Marcar como lida"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n300)', display: 'flex', padding: 2 }}
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
