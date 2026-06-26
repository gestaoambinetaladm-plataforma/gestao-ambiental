'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderOpen, Users, ListTodo,
  FileText, TrendingUp, Settings, ChevronLeft,
  Bell, Search, LogOut, Leaf,
} from 'lucide-react'
import { logoutAction } from '@/lib/auth/actions'

interface NavItem {
  href:   string
  label:  string
  icon:   React.ReactNode
  badge?: number
  section?: string
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={17} />, section: 'PRINCIPAL' },
  { href: '/projects',  label: 'Projetos',   icon: <FolderOpen size={17} /> },
  { href: '/clients',   label: 'Clientes',   icon: <Users size={17} /> },
  { href: '/tasks',     label: 'Tarefas',    icon: <ListTodo size={17} />, section: 'TRABALHO' },
  { href: '/documents', label: 'Documentos', icon: <FileText size={17} /> },
  { href: '/crm',       label: 'CRM',        icon: <TrendingUp size={17} />, section: 'COMERCIAL' },
  { href: '/settings',  label: 'Config.',    icon: <Settings size={17} />, section: 'SISTEMA' },
]

interface AppShellProps {
  children:  React.ReactNode
  userName:  string
  orgName:   string
  userRole:  string
}

export default function AppShell({ children, userName, orgName, userRole }: AppShellProps) {
  const [slim, setSlim] = useState(false)
  const pathname = usePathname()

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width:           slim ? '60px' : 'var(--sb)',
        flexShrink:      0,
        background:      'var(--g800)',
        display:         'flex',
        flexDirection:   'column',
        position:        'relative',
        zIndex:          20,
        overflow:        'hidden',
        transition:      'width .26s cubic-bezier(.4,0,.2,1)',
      }}>

        {/* Logo / Empresa */}
        <div style={{
          height:       'var(--hh)',
          display:      'flex',
          alignItems:   'center',
          gap:          11,
          padding:      '0 16px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          flexShrink:   0,
          overflow:     'hidden',
        }}>
          <div style={{
            width:        30, height: 30, flexShrink: 0,
            borderRadius: 8,
            background:   'linear-gradient(135deg, var(--g500), var(--g700))',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow:    '0 2px 8px rgba(0,0,0,.3)',
          }}>
            <Leaf size={15} color="#fff" />
          </div>
          <div style={{
            overflow:   'hidden',
            opacity:    slim ? 0 : 1,
            transform:  slim ? 'translateX(-8px)' : 'none',
            transition: 'opacity .2s, transform .2s',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, color: '#fff' }}>
              Gestão Ambiental
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.36)', marginTop: 1 }}>
              {orgName}
            </div>
          </div>
        </div>

        {/* Botão colapsar */}
        <button
          onClick={() => setSlim(s => !s)}
          style={{
            position:     'absolute',
            right:        -10,
            top:          `calc(var(--hh) + 18px)`,
            width:        20, height: 20,
            borderRadius: '50%',
            background:   'var(--n50)',
            border:       '1.5px solid var(--n200)',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            cursor:       'pointer',
            zIndex:       30,
            boxShadow:    'var(--shm)',
            color:        'var(--n500)',
          }}
        >
          <ChevronLeft
            size={10}
            style={{ transition: 'transform .25s', transform: slim ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Navegação */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 8px' }}>
          {NAV.map((item, i) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <div key={item.href}>
                {item.section && (
                  <div style={{
                    fontSize:      9.5,
                    fontWeight:    600,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color:         'rgba(255,255,255,.22)',
                    padding:       '0 9px 5px',
                    marginTop:     i === 0 ? 4 : 10,
                    whiteSpace:    'nowrap',
                    overflow:      'hidden',
                    opacity:       slim ? 0 : 1,
                    transition:    'opacity .2s',
                  }}>
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  title={slim ? item.label : undefined}
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           10,
                    padding:       '8px 10px',
                    borderRadius:  8,
                    cursor:        'pointer',
                    position:      'relative',
                    color:         active ? '#fff' : 'rgba(255,255,255,.52)',
                    fontSize:      13,
                    fontWeight:    500,
                    textDecoration:'none',
                    background:    active ? 'rgba(255,255,255,.12)' : 'transparent',
                    marginBottom:  1,
                    whiteSpace:    'nowrap',
                    overflow:      'hidden',
                    transition:    'all .15s',
                  }}
                >
                  {active && (
                    <span style={{
                      position:     'absolute',
                      left:         0,
                      top:          '50%',
                      transform:    'translateY(-50%)',
                      width:        2.5,
                      height:       16,
                      borderRadius: '0 2px 2px 0',
                      background:   'var(--g300)',
                    }} />
                  )}
                  <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{
                    flex:       1,
                    opacity:    slim ? 0 : 1,
                    transition: 'opacity .2s',
                  }}>
                    {item.label}
                  </span>
                  {item.badge && !slim && (
                    <span style={{
                      background:   'var(--red)',
                      color:        '#fff',
                      fontSize:     9,
                      fontWeight:   700,
                      minWidth:     17,
                      height:       17,
                      borderRadius: 999,
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent:'center',
                      padding:      '0 4px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Footer usuário */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '10px 8px', flexShrink: 0 }}>
          <form action={logoutAction}>
            <button type="submit" style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '8px 10px',
              borderRadius: 8,
              cursor:       'pointer',
              overflow:     'hidden',
              background:   'transparent',
              border:       'none',
              width:        '100%',
              transition:   'background .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width:        30, height: 30,
                borderRadius: '50%',
                flexShrink:   0,
                display:      'flex', alignItems: 'center', justifyContent: 'center',
                fontSize:     11, fontWeight: 700, color: '#fff',
                background:   'linear-gradient(135deg, var(--g600), var(--g800))',
                boxShadow:    '0 0 0 1.5px rgba(255,255,255,.15)',
              }}>
                {initials}
              </div>
              <div style={{
                flex:       1,
                minWidth:   0,
                textAlign:  'left',
                opacity:    slim ? 0 : 1,
                transition: 'opacity .2s',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{userRole}</div>
              </div>
              <LogOut size={14} color="rgba(255,255,255,.3)" style={{ flexShrink: 0, opacity: slim ? 0 : 1, transition: 'opacity .2s' }} />
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          height:       'var(--hh)',
          flexShrink:   0,
          background:   '#fff',
          borderBottom: '1px solid var(--n200)',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'space-between',
          padding:      '0 22px',
          zIndex:       10,
        }}>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 14 }}>
            {getPageTitle(pathname)}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Busca */}
            <div style={{
              display:     'flex',
              alignItems:  'center',
              gap:         7,
              background:  'var(--n100)',
              border:      '1px solid var(--n200)',
              borderRadius:8,
              padding:     '5px 12px',
              fontSize:    12,
              color:       'var(--n400)',
              cursor:      'pointer',
            }}>
              <Search size={13} />
              <span>Buscar...</span>
              <span style={{
                background:   '#fff',
                border:       '1px solid var(--n200)',
                borderRadius: 4,
                fontFamily:   'monospace',
                fontSize:     9.5,
                padding:      '1px 5px',
                color:        'var(--n400)',
              }}>⌘K</span>
            </div>

            {/* Notificações */}
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--n500)',
              position: 'relative',
            }}>
              <Bell size={16} />
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 7, height: 7,
                borderRadius: '50%',
                background: 'var(--red)',
                border: '1.5px solid #fff',
              }} />
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/projects':  'Projetos',
    '/clients':   'Clientes',
    '/tasks':     'Tarefas',
    '/documents': 'Documentos',
    '/crm':       'CRM — Leads',
    '/settings':  'Configurações',
  }
  const match = Object.keys(titles).find(k => pathname === k || pathname.startsWith(k + '/'))
  return match ? titles[match] : 'Gestão Ambiental'
}
