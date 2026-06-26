'use client'

import { useState } from 'react'
import { Users, ListChecks, User, Plus, Trash2, Star, StarOff, UserCheck, UserX, X, ChevronDown } from 'lucide-react'
import {
  inviteMemberAction, updateMemberRoleAction, toggleMemberStatusAction,
  createTemplateAction, deleteTemplateAction, setTemplateDefaultAction,
  addTemplateItemAction, deleteTemplateItemAction,
} from '@/lib/settings/actions'

const ROLES: Record<string, string> = {
  admin:                   'Admin',
  director:                'Diretor',
  environmental_engineer:  'Eng. Ambiental',
  biologist:               'Biólogo(a)',
  field_technician:        'Técnico de Campo',
  commercial:              'Comercial',
  financial:               'Financeiro',
  legal:                   'Jurídico',
  designer:                'Designer',
  client:                  'Cliente',
}

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

type Tab = 'profile' | 'members' | 'templates'

export default function SettingsClient({ currentUser, members, templates }: {
  currentUser: any
  members: any[]
  templates: any[]
}) {
  const [tab, setTab] = useState<Tab>('profile')

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'director'

  const tabs = [
    { value: 'profile'   as Tab, label: 'Meu perfil',           icon: <User size={14} /> },
    { value: 'members'   as Tab, label: 'Equipe',               icon: <Users size={14} /> },
    { value: 'templates' as Tab, label: 'Templates de checklist', icon: <ListChecks size={14} /> },
  ]

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18 }}>Configurações</h2>
        <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>Gerencie sua conta e organização</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--n200)', marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              border: 'none', background: 'none', cursor: 'pointer',
              color: tab === t.value ? 'var(--g700)' : 'var(--n500)',
              borderBottom: `2px solid ${tab === t.value ? 'var(--g500)' : 'transparent'}`,
              marginBottom: -1, transition: 'all .15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile'   && <ProfileTab user={currentUser} />}
      {tab === 'members'   && <MembersTab members={members} currentUser={currentUser} isAdmin={isAdmin} />}
      {tab === 'templates' && <TemplatesTab templates={templates} />}
    </div>
  )
}

// ─── Aba: Perfil ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: any }) {
  const org = user.organizations
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 760 }}>
      <Card title="Meu perfil">
        <InfoRow label="Nome"     value={user.name} />
        <InfoRow label="Função"   value={ROLES[user.role] ?? user.role} />
        <InfoRow label="Status"   value={user.status === 'active' ? 'Ativo' : 'Inativo'} />
        {user.phone && <InfoRow label="Telefone" value={user.phone} />}
      </Card>
      <Card title="Organização">
        <InfoRow label="Nome"  value={org?.name ?? '-'} />
        <InfoRow label="Plano" value={org?.plan ?? '-'} />
        <InfoRow label="Status" value={org?.status ?? '-'} />
        {org?.trial_ends_at && (
          <InfoRow
            label="Trial até"
            value={new Date(org.trial_ends_at).toLocaleDateString('pt-BR')}
          />
        )}
      </Card>
    </div>
  )
}

// ─── Aba: Membros ─────────────────────────────────────────────────────────────

function MembersTab({ members, currentUser, isAdmin }: { members: any[]; currentUser: any; isAdmin: boolean }) {
  const [showInvite, setShowInvite] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    const result = await inviteMemberAction(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSuccess('Convite enviado! O membro receberá um e-mail para definir a senha.')
    setShowInvite(false);
    (e.target as HTMLFormElement).reset()
  }

  async function handleRoleChange(memberId: string, role: string) {
    const result = await updateMemberRoleAction(memberId, role)
    if (result?.error) alert(result.error)
  }

  async function handleToggleStatus(memberId: string, currentStatus: string) {
    const activate = currentStatus === 'inactive'
    if (!confirm(activate ? 'Reativar este membro?' : 'Desativar este membro?')) return
    const result = await toggleMemberStatusAction(memberId, activate)
    if (result?.error) alert(result.error)
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header com botão convidar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--n500)' }}>
          {members.length} membro{members.length !== 1 ? 's' : ''} na equipe
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--g600)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Convidar membro
          </button>
        )}
      </div>

      {/* Feedback */}
      {error   && <Alert type="error"   msg={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" msg={success} onClose={() => setSuccess('')} />}

      {/* Formulário de convite */}
      {showInvite && isAdmin && (
        <div style={{
          background: 'var(--g50)', border: '1px solid var(--g200)',
          borderRadius: 12, padding: 20, marginBottom: 20,
        }}>
          <h4 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
            Convidar novo membro
          </h4>
          <form onSubmit={handleInvite}>
            <style>{`.inv input,.inv select{width:100%;padding:8px 11px;border:1px solid var(--n200);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;}.inv input:focus,.inv select:focus{border-color:var(--g400);}`}</style>
            <div className="inv" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input name="name" required placeholder="Ana Souza" />
              </div>
              <div>
                <label style={labelStyle}>E-mail *</label>
                <input name="email" type="email" required placeholder="ana@empresa.com" />
              </div>
              <div>
                <label style={labelStyle}>Função</label>
                <select name="role" defaultValue="environmental_engineer">
                  {Object.entries(ROLES).filter(([k]) => k !== 'client').map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={loading} style={submitBtn}>
                {loading ? 'Enviando...' : 'Enviar convite'}
              </button>
              <button type="button" onClick={() => setShowInvite(false)} style={cancelBtn}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de membros */}
      <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, overflow: 'hidden' }}>
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderBottom: i < members.length - 1 ? '1px solid var(--n100)' : 'none',
              opacity: m.status === 'inactive' ? 0.5 : 1,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--g500), var(--g700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              {m.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--n800)' }}>
                {m.name}
                {m.id === currentUser.id && (
                  <span style={{ fontSize: 10, color: 'var(--g600)', marginLeft: 6, fontWeight: 400 }}>(você)</span>
                )}
              </p>
              <p style={{ fontSize: 11, color: 'var(--n400)' }}>
                {ROLES[m.role] ?? m.role}
                {m.status === 'inactive' && (
                  <span style={{ marginLeft: 6, color: 'var(--red)', fontWeight: 600 }}>• Inativo</span>
                )}
              </p>
            </div>

            {/* Alterar função (apenas admin, não o próprio) */}
            {isAdmin && m.id !== currentUser.id && (
              <div style={{ position: 'relative' }}>
                <select
                  defaultValue={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  style={{
                    padding: '5px 28px 5px 10px', borderRadius: 7,
                    border: '1px solid var(--n200)', fontSize: 11,
                    background: '#fff', cursor: 'pointer', outline: 'none',
                    appearance: 'none', color: 'var(--n700)',
                  }}
                >
                  {Object.entries(ROLES).filter(([k]) => k !== 'client').map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--n400)' }} />
              </div>
            )}

            {/* Ativar/desativar (apenas admin, não o próprio) */}
            {currentUser.role === 'admin' && m.id !== currentUser.id && (
              <button
                onClick={() => handleToggleStatus(m.id, m.status)}
                title={m.status === 'active' ? 'Desativar' : 'Reativar'}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${m.status === 'active' ? 'var(--red-b)' : 'var(--g200)'}`,
                  background: m.status === 'active' ? 'var(--red-bg)' : 'var(--g50)',
                  color: m.status === 'active' ? 'var(--red)' : 'var(--g600)',
                  cursor: 'pointer',
                }}
              >
                {m.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Aba: Templates de Checklist ──────────────────────────────────────────────

function TemplatesTab({ templates }: { templates: any[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const result = await createTemplateAction(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setShowCreate(false)
    if (result?.id) setExpanded(result.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este template e todos os seus itens?')) return
    await deleteTemplateAction(id)
  }

  async function handleSetDefault(id: string, licenseType: string) {
    await setTemplateDefaultAction(id, licenseType)
  }

  async function handleAddItem(templateId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const result = await addTemplateItemAction(templateId, new FormData(e.currentTarget))
    if (result?.error) alert(result.error)
    else (e.target as HTMLFormElement).reset()
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remover este item?')) return
    await deleteTemplateItemAction(itemId)
  }

  // Agrupa por tipo de licença
  const grouped = LICENSE_TYPES.map(lt => ({
    ...lt,
    templates: templates.filter(t => t.license_type === lt.value),
  })).filter(g => g.templates.length > 0 || showCreate)

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--n500)' }}>
          {templates.length} template{templates.length !== 1 ? 's' : ''} configurados
        </p>
        <button
          onClick={() => setShowCreate(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--g600)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Novo template
        </button>
      </div>

      {error && <Alert type="error" msg={error} onClose={() => setError('')} />}

      {/* Formulário criar template */}
      {showCreate && (
        <div style={{
          background: 'var(--g50)', border: '1px solid var(--g200)',
          borderRadius: 12, padding: 20, marginBottom: 20,
        }}>
          <h4 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
            Novo template de checklist
          </h4>
          <form onSubmit={handleCreate}>
            <style>{`.cf input,.cf select{width:100%;padding:8px 11px;border:1px solid var(--n200);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;}`}</style>
            <div className="cf" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Nome do template *</label>
                <input name="name" required placeholder="Checklist LP Padrão" />
              </div>
              <div>
                <label style={labelStyle}>Tipo de licença *</label>
                <select name="license_type" required defaultValue="">
                  <option value="" disabled>Selecione...</option>
                  {LICENSE_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
                <button type="submit" disabled={loading} style={submitBtn}>
                  {loading ? 'Criando...' : 'Criar'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={cancelBtn}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--n600)', cursor: 'pointer' }}>
              <input type="checkbox" name="is_default" value="true" />
              Definir como template padrão para este tipo de licença
            </label>
          </form>
        </div>
      )}

      {/* Templates por tipo */}
      {templates.length === 0 && !showCreate ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
        }}>
          <ListChecks size={32} color="var(--n300)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--n700)', marginBottom: 4 }}>Sem templates configurados</p>
          <p style={{ fontSize: 12, color: 'var(--n400)' }}>
            Crie templates de checklist para cada tipo de licença. Eles serão aplicados automaticamente ao criar novos projetos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map(tpl => {
            const isOpen = expanded === tpl.id
            const licenseLabel = LICENSE_TYPES.find(l => l.value === tpl.license_type)?.label ?? tpl.license_type
            const items = [...(tpl.checklist_template_items ?? [])].sort((a: any, b: any) => a.order - b.order)

            return (
              <div key={tpl.id} style={{
                background: '#fff', border: '1px solid var(--n200)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Header do template */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: isOpen ? 'var(--n50)' : '#fff',
                }}
                  onClick={() => setExpanded(isOpen ? null : tpl.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--n800)' }}>{tpl.name}</p>
                      {tpl.is_default && (
                        <span style={{
                          fontSize: 9.5, fontWeight: 700,
                          background: 'var(--g100)', color: 'var(--g700)',
                          padding: '1px 7px', borderRadius: 999, border: '1px solid var(--g200)',
                        }}>
                          PADRÃO
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>
                      {licenseLabel} · {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {!tpl.is_default && (
                      <button
                        onClick={() => handleSetDefault(tpl.id, tpl.license_type)}
                        title="Definir como padrão"
                        style={{ ...iconBtn, color: '#f59e0b', borderColor: '#fcd34d', background: '#fffbeb' }}
                      >
                        <Star size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      style={{ ...iconBtn, color: 'var(--red)', borderColor: 'var(--red-b)', background: 'var(--red-bg)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronDown
                      size={14}
                      color="var(--n400)"
                      style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>
                </div>

                {/* Itens do template (expandido) */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--n100)', padding: '12px 16px' }}>
                    {items.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--n400)', marginBottom: 12 }}>
                        Nenhum item ainda. Adicione abaixo.
                      </p>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        {items.map((item: any, i: number) => (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0',
                            borderBottom: i < items.length - 1 ? '1px solid var(--n100)' : 'none',
                          }}>
                            <span style={{
                              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                              border: '1.5px solid var(--n300)', fontSize: 10, fontWeight: 700,
                              color: 'var(--n400)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {item.order}
                            </span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n800)' }}>{item.title}</p>
                              {item.description && (
                                <p style={{ fontSize: 11, color: 'var(--n400)', marginTop: 1 }}>{item.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ ...iconBtn, color: 'var(--red)', borderColor: 'var(--red-b)', background: 'var(--red-bg)' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar item */}
                    <form onSubmit={e => handleAddItem(tpl.id, e)} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <style>{`.ai input,.ai textarea{padding:7px 10px;border:1px solid var(--n200);border-radius:7px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;}.ai input:focus,.ai textarea:focus{border-color:var(--g400);}`}</style>
                      <div className="ai" style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <input name="title" required placeholder="Ex: Elaborar EIA/RIMA..." style={{ flex: 2 }} />
                        <input name="description" placeholder="Descrição opcional..." style={{ flex: 1.5 }} />
                      </div>
                      <button type="submit" style={{
                        padding: '7px 14px', background: 'var(--g600)', color: '#fff',
                        border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      }}>
                        <Plus size={12} /> Adicionar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, padding: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--n100)' }}>
      <span style={{ fontSize: 12, color: 'var(--n500)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--n800)' }}>{value}</span>
    </div>
  )
}

function Alert({ type, msg, onClose }: { type: 'error' | 'success'; msg: string; onClose: () => void }) {
  const isErr = type === 'error'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8, marginBottom: 16,
      background: isErr ? 'var(--red-bg)' : 'var(--g50)',
      border: `1px solid ${isErr ? 'var(--red-b)' : 'var(--g200)'}`,
      color: isErr ? 'var(--red)' : 'var(--g700)',
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
        <X size={13} />
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: 'var(--n600)',
  display: 'block', marginBottom: 5,
}

const submitBtn: React.CSSProperties = {
  padding: '8px 18px', background: 'var(--g600)', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
}

const cancelBtn: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent',
  border: '1px solid var(--n200)', color: 'var(--n600)',
  borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid var(--n200)', background: 'var(--n50)',
  cursor: 'pointer', color: 'var(--n500)',
}
