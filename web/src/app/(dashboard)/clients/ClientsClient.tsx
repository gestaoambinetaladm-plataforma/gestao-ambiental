'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Building2, User, Phone, Mail, MapPin } from 'lucide-react'
import { formatDocument, formatPhone } from '@/lib/format'
import type { Client } from '@/types'
import ClientModal from './ClientModal'

interface Props {
  clients:     Client[]
  searchQuery: string
}

export default function ClientsClient({ clients, searchQuery }: Props) {
  const router = useRouter()
  const [search,  setSearch]  = useState(searchQuery)
  const [modal,   setModal]   = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/clients?q=${encodeURIComponent(search)}`)
  }

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const avatarColor = (name: string) => {
    const colors = ['#1d7035','#2563eb','#7c3aed','#d97706','#dc2626','#0891b2']
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18, color: 'var(--n900)' }}>
            Clientes
          </h2>
          <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--g600)', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Novo cliente
        </button>
      </div>

      {/* Busca */}
      <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 8, padding: '8px 12px',
          maxWidth: 400,
        }}>
          <Search size={14} color="var(--n400)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--n800)',
              background: 'transparent',
            }}
          />
        </div>
      </form>

      {/* Lista */}
      {clients.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 14, padding: '48px 24px',
          textAlign: 'center',
        }}>
          <Building2 size={32} color="var(--n300)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--n700)', marginBottom: 4 }}>Nenhum cliente encontrado</p>
          <p style={{ fontSize: 12, color: 'var(--n400)', marginBottom: 16 }}>
            {searchQuery ? 'Tente outro termo de busca.' : 'Cadastre o primeiro cliente para começar.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setModal(true)}
              style={{
                background: 'var(--g600)', color: '#fff',
                border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cadastrar cliente
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: 'var(--sh)',
        }}>
          {clients.map((client, i) => (
            <div
              key={client.id}
              onClick={() => router.push(`/clients/${client.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: i < clients.length - 1 ? '1px solid var(--n100)' : 'none',
                cursor: 'pointer',
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--n50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: avatarColor(client.name),
              }}>
                {initials(client.name)}
              </div>

              {/* Info principal */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--n900)' }}>
                    {client.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px',
                    borderRadius: 999, background: 'var(--n100)', color: 'var(--n600)',
                    fontFamily: 'monospace',
                  }}>
                    {client.type === 'pj' ? 'PJ' : 'PF'}
                  </span>
                </div>
                {client.document && (
                  <div style={{ fontSize: 11.5, color: 'var(--n400)', marginTop: 2 }}>
                    {formatDocument(client.document)}
                  </div>
                )}
              </div>

              {/* Contato */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--n500)' }}>
                    <Phone size={11} /> {formatPhone(client.phone)}
                  </div>
                )}
                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--n500)' }}>
                    <Mail size={11} /> {client.email}
                  </div>
                )}
                {client.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--n500)' }}>
                    <MapPin size={11} /> {client.city}{client.state ? ` — ${client.state}` : ''}
                  </div>
                )}
              </div>

              {/* Tipo ícone */}
              <div style={{ marginLeft: 8, color: 'var(--n300)' }}>
                {client.type === 'pj' ? <Building2 size={16} /> : <User size={16} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ClientModal onClose={() => setModal(false)} />}
    </div>
  )
}
