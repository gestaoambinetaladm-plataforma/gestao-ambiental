'use client'

import { useState, useRef, useTransition } from 'react'
import { Upload, FileText, Download, Trash2, Search, FolderOpen } from 'lucide-react'
import { uploadDocumentAction, deleteDocumentAction } from '@/lib/documents/actions'

const CATEGORY_LABEL: Record<string, string> = {
  report:        'Relatório',
  license:       'Licença',
  study:         'Estudo',
  map:           'Mapa',
  photo:         'Foto',
  contract:      'Contrato',
  official_letter: 'Ofício',
  other:         'Outro',
}

const CATEGORY_COLOR: Record<string, string> = {
  report:        '#3b82f6',
  license:       '#22c55e',
  study:         '#7c3aed',
  map:           '#f59e0b',
  photo:         '#ec4899',
  contract:      '#0891b2',
  official_letter: '#64748b',
  other:         '#94a3b8',
}

function formatSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsClient({ documents }: { documents: any[] }) {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [, startTransition]       = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter(d => {
    const matchSearch = search
      ? d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.project?.name ?? '').toLowerCase().includes(search.toLowerCase())
      : true
    const matchCat = category === 'all' ? true : d.category === category
    return matchSearch && matchCat
  })

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('name', file.name.replace(/\.[^.]+$/, ''))
    fd.set('category', 'other')
    const result = await uploadDocumentAction(fd)
    if (result?.error) setError(result.error)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDelete(id: string, storagePath: string) {
    if (!confirm('Excluir este documento?')) return
    startTransition(() => { deleteDocumentAction(id, storagePath) })
  }

  const categories = ['all', ...Object.keys(CATEGORY_LABEL)]

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 18 }}>Documentos</h2>
          <p style={{ fontSize: 12, color: 'var(--n500)', marginTop: 2 }}>
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.kml,.zip,.rar"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--g600)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? .6 : 1,
            }}
          >
            <Upload size={15} /> {uploading ? 'Enviando...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {/* Busca */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 8, padding: '7px 12px',
        }}>
          <Search size={13} color="var(--n400)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar documento ou projeto..."
            style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', width: 220 }}
          />
        </div>

        {/* Categoria */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                border: `1px solid ${category === c ? 'var(--g200)' : 'transparent'}`,
                background: category === c ? 'var(--g50)' : 'transparent',
                color: category === c ? 'var(--g700)' : 'var(--n600)',
                cursor: 'pointer',
              }}
            >
              {c === 'all' ? 'Todos' : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--n200)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
        }}>
          <FolderOpen size={32} color="var(--n300)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--n700)', marginBottom: 4 }}>Nenhum documento encontrado</p>
          <p style={{ fontSize: 12, color: 'var(--n400)' }}>
            Faça upload de PDFs, relatórios, mapas e outros documentos.
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--n200)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--n100)' : 'none',
              }}
            >
              {/* Ícone categoria */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: (CATEGORY_COLOR[doc.category] ?? '#94a3b8') + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={16} color={CATEGORY_COLOR[doc.category] ?? '#94a3b8'} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--n800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>
                  {CATEGORY_LABEL[doc.category] ?? 'Outro'}
                  {doc.project && <> · 📁 {doc.project.name}</>}
                  {' · '}{formatSize(doc.size_bytes)}
                  {' · '}{new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Status */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: doc.status === 'uploaded' ? 'var(--g50)' : 'var(--n100)',
                color: doc.status === 'uploaded' ? 'var(--g700)' : 'var(--n400)',
              }}>
                {doc.status === 'uploaded' ? 'Disponível' : doc.status}
              </span>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6 }}>
                <a
                  href={`/api/documents/download?path=${encodeURIComponent(doc.storage_path)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    border: '1px solid var(--n200)', background: 'var(--n50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--n500)', textDecoration: 'none',
                  }}
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    border: '1px solid var(--red-b)', background: 'var(--red-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--red)', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
