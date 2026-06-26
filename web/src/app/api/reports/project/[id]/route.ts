import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createElement } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

// ─── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 44,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  headerLeft: { flex: 1 },
  orgName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#16a34a', marginBottom: 2 },
  reportTitle: { fontSize: 10, color: '#64748b' },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 8, color: '#94a3b8' },

  // Section
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#166534',
    marginBottom: 10, paddingBottom: 5,
    borderBottomWidth: 1, borderBottomColor: '#dcfce7',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Grid 2 colunas
  row2: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  field: { flex: 1, marginBottom: 10 },
  fieldLabel: { fontSize: 7.5, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue: { fontSize: 9, color: '#1e293b', fontFamily: 'Helvetica-Bold' },
  fieldValueNormal: { fontSize: 9, color: '#334155' },

  // Progress bar
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3 },
  progressFill: { height: 5, backgroundColor: '#16a34a', borderRadius: 3 },
  progressText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#16a34a', width: 28, textAlign: 'right' },

  // Badge
  badge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
  },

  // Tabela condicionantes
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f0fdf4',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 4, marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  colTitle: { flex: 1 },
  colDate: { width: 70, textAlign: 'center' },
  colStatus: { width: 72, textAlign: 'right' },
  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3 },
  tdText: { fontSize: 8.5, color: '#334155' },
  tdTextBold: { fontSize: 8.5, color: '#1e293b', fontFamily: 'Helvetica-Bold' },

  // Docs
  docRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  docName: { flex: 1, fontSize: 8.5, color: '#334155' },
  docDate: { fontSize: 8, color: '#94a3b8', width: 70, textAlign: 'right' },

  // Footer
  footer: {
    position: 'absolute', bottom: 28, left: 44, right: 44,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
})

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Rascunho',         color: '#475569', bg: '#f1f5f9' },
  in_progress:    { label: 'Em andamento',      color: '#1e40af', bg: '#dbeafe' },
  waiting_agency: { label: 'Aguardando órgão',  color: '#92400e', bg: '#fef3c7' },
  pending_docs:   { label: 'Pend. documentos',  color: '#5b21b6', bg: '#ede9fe' },
  approved:       { label: 'Aprovado',          color: '#166534', bg: '#dcfce7' },
  rejected:       { label: 'Indeferido',        color: '#991b1b', bg: '#fee2e2' },
  archived:       { label: 'Arquivado',         color: '#475569', bg: '#f1f5f9' },
}

const COND_MAP: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendente',    color: '#b45309' },
  in_progress: { label: 'Em andamento', color: '#1d4ed8' },
  fulfilled:   { label: 'Cumprida',   color: '#15803d' },
  overdue:     { label: 'Atrasada',   color: '#dc2626' },
  waived:      { label: 'Dispensada', color: '#64748b' },
}

function fmtDate(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('pt-BR')
}

// ─── Componente PDF ──────────────────────────────────────────────────────────

function ProjectPDF({ project, org, condicionantes, documents }: {
  project: any
  org: any
  condicionantes: any[]
  documents: any[]
}) {
  const st = STATUS_MAP[project.status] ?? STATUS_MAP.draft
  const today = new Date().toLocaleDateString('pt-BR')

  return createElement(Document, { title: `Relatório — ${project.name}` },
    createElement(Page, { size: 'A4', style: styles.page },

      // Header
      createElement(View, { style: styles.header },
        createElement(View, { style: styles.headerLeft },
          createElement(Text, { style: styles.orgName }, org?.name ?? 'Gestão Ambiental'),
          createElement(Text, { style: styles.reportTitle }, 'Relatório de Licenciamento Ambiental'),
        ),
        createElement(View, { style: styles.headerRight },
          createElement(Text, { style: styles.headerDate }, `Emitido em ${today}`),
        ),
      ),

      // Informações do projeto
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, 'Dados do projeto'),

        createElement(View, { style: styles.row2 },
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Projeto'),
            createElement(Text, { style: styles.fieldValue }, project.name),
          ),
          createElement(View, { style: { ...styles.field, flex: 0, width: 80 } },
            createElement(Text, { style: styles.fieldLabel }, 'Tipo'),
            createElement(Text, { style: { ...styles.badge, color: '#475569', backgroundColor: '#f1f5f9' } }, project.license_type),
          ),
        ),

        // Status + progresso
        createElement(View, { style: styles.row2 },
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Status'),
            createElement(Text, { style: { ...styles.badge, color: st.color, backgroundColor: st.bg } }, st.label),
          ),
          createElement(View, { style: { ...styles.field, flex: 2 } },
            createElement(Text, { style: styles.fieldLabel }, `Progresso — ${project.progress_pct}%`),
            createElement(View, { style: styles.progressBar },
              createElement(View, { style: { ...styles.progressFill, width: `${project.progress_pct}%` } }),
            ),
          ),
        ),

        createElement(View, { style: styles.row2 },
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Órgão'),
            createElement(Text, { style: styles.fieldValueNormal }, project.agency || '—'),
          ),
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Protocolo'),
            createElement(Text, { style: styles.fieldValueNormal }, project.protocol_number || '—'),
          ),
        ),

        createElement(View, { style: styles.row2 },
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'N° da licença'),
            createElement(Text, { style: styles.fieldValueNormal }, project.license_number || '—'),
          ),
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Validade'),
            createElement(Text, { style: styles.fieldValueNormal }, project.license_validity_years ? `${project.license_validity_years} anos` : '—'),
          ),
        ),

        createElement(View, { style: styles.row2 },
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Data de emissão'),
            createElement(Text, { style: styles.fieldValueNormal }, fmtDate(project.license_issued_at)),
          ),
          createElement(View, { style: styles.field },
            createElement(Text, { style: styles.fieldLabel }, 'Data de vencimento'),
            createElement(Text, { style: styles.fieldValueNormal }, fmtDate(project.license_expires_at)),
          ),
        ),

        project.description
          ? createElement(View, { style: { marginTop: 2 } },
              createElement(Text, { style: styles.fieldLabel }, 'Descrição'),
              createElement(Text, { style: { ...styles.fieldValueNormal, lineHeight: 1.5 } }, project.description),
            )
          : null,
      ),

      // Informações do cliente
      project.clients
        ? createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, 'Cliente'),
            createElement(View, { style: styles.row2 },
              createElement(View, { style: styles.field },
                createElement(Text, { style: styles.fieldLabel }, 'Nome'),
                createElement(Text, { style: styles.fieldValue }, project.clients.name),
              ),
              createElement(View, { style: styles.field },
                createElement(Text, { style: styles.fieldLabel }, 'Documento'),
                createElement(Text, { style: styles.fieldValueNormal }, project.clients.document || '—'),
              ),
            ),
            createElement(View, { style: styles.row2 },
              createElement(View, { style: styles.field },
                createElement(Text, { style: styles.fieldLabel }, 'E-mail'),
                createElement(Text, { style: styles.fieldValueNormal }, project.clients.email || '—'),
              ),
              createElement(View, { style: styles.field },
                createElement(Text, { style: styles.fieldLabel }, 'Telefone'),
                createElement(Text, { style: styles.fieldValueNormal }, project.clients.phone || '—'),
              ),
            ),
          )
        : null,

      // Condicionantes
      condicionantes.length > 0
        ? createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, `Condicionantes (${condicionantes.length})`),

            // Cabeçalho da tabela
            createElement(View, { style: styles.tableHeader },
              createElement(View, { style: styles.colTitle },
                createElement(Text, { style: styles.thText }, 'Condicionante'),
              ),
              createElement(View, { style: styles.colDate },
                createElement(Text, { style: styles.thText }, 'Prazo'),
              ),
              createElement(View, { style: styles.colStatus },
                createElement(Text, { style: styles.thText }, 'Status'),
              ),
            ),

            ...condicionantes.map((c, i) => {
              const cs = COND_MAP[c.status] ?? COND_MAP.pending
              const isOdd = i % 2 === 1
              return createElement(View, { key: c.id, style: [styles.tableRow, isOdd ? styles.tableRowAlt : {}] },
                createElement(View, { style: styles.colTitle },
                  createElement(Text, { style: styles.tdTextBold }, c.title),
                  c.description
                    ? createElement(Text, { style: { ...styles.tdText, color: '#94a3b8', marginTop: 1 } }, c.description)
                    : null,
                ),
                createElement(View, { style: styles.colDate },
                  createElement(Text, { style: styles.tdText }, fmtDate(c.due_date)),
                ),
                createElement(View, { style: styles.colStatus },
                  createElement(Text, { style: { ...styles.tdText, color: cs.color, fontFamily: 'Helvetica-Bold' } }, cs.label),
                ),
              )
            }),
          )
        : null,

      // Documentos
      documents.length > 0
        ? createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, `Documentos (${documents.length})`),
            ...documents.map((d, i) => createElement(View, { key: d.id, style: [styles.docRow, i % 2 === 1 ? { backgroundColor: '#fafafa' } : {}] },
              createElement(Text, { style: styles.docName }, d.name),
              createElement(Text, { style: styles.docDate }, fmtDate(d.created_at)),
            )),
          )
        : null,

      // Footer
      createElement(View, { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, org?.name ?? 'Gestão Ambiental'),
        createElement(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: any) => `Página ${pageNumber} de ${totalPages}` }),
      ),
    )
  )
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Autenticação
  const supabaseAuth = await createClient()
  const profile = await getCurrentUserData()
  if (!profile) return new NextResponse('Não autorizado', { status: 401 })

  // Busca projeto (verifica ownership)
  const { data: project } = await (adminClient as any)
    .from('projects')
    .select('*, clients(*)')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!project) return new NextResponse('Projeto não encontrado', { status: 404 })

  // Condicionantes + documentos em paralelo
  const [{ data: condicionantes }, { data: documents }, { data: org }] = await Promise.all([
    (adminClient as any)
      .from('condicionantes')
      .select('*')
      .eq('project_id', params.id)
      .order('due_date', { ascending: true }),
    (adminClient as any)
      .from('documents')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false }),
    (adminClient as any)
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single(),
  ])

  const pdfElement = createElement(ProjectPDF, {
    project,
    org,
    condicionantes: condicionantes ?? [],
    documents: documents ?? [],
  })

  const buffer = await renderToBuffer(pdfElement as any)

  const filename = `relatorio-${project.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
