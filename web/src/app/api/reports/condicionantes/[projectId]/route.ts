import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createElement } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  orgName:     { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#16a34a', marginBottom: 2 },
  reportTitle: { fontSize: 10, color: '#64748b' },
  headerDate:  { fontSize: 8, color: '#94a3b8' },

  projectBox: {
    backgroundColor: '#f0fdf4', borderRadius: 6,
    padding: '10 14', marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#16a34a',
  },
  projectName:   { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#15803d', marginBottom: 4 },
  projectMeta:   { fontSize: 8.5, color: '#475569' },

  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#166534',
    marginBottom: 8, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: '#dcfce7',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Sumário
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summaryBox: {
    flex: 1, backgroundColor: '#f8fafc',
    borderRadius: 6, padding: '8 12',
    borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  summaryNum:   { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 2 },
  summaryLabel: { fontSize: 8, color: '#64748b', textAlign: 'center' },

  // Tabela
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f0fdf4',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 4, marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    minHeight: 30,
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableRowOverdue: { backgroundColor: '#fff7f7' },

  colNum:    { width: 22, textAlign: 'center' },
  colTitle:  { flex: 1 },
  colDate:   { width: 68, textAlign: 'center' },
  colStatus: { width: 76, textAlign: 'right' },

  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3 },
  tdNum:  { fontSize: 8, color: '#94a3b8' },
  tdText: { fontSize: 8.5, color: '#334155' },
  tdBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  tdSub:  { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 28, left: 44, right: 44,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
})

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendente',      color: '#b45309' },
  in_progress: { label: 'Em andamento',  color: '#1d4ed8' },
  fulfilled:   { label: 'Cumprida',      color: '#15803d' },
  overdue:     { label: 'Atrasada',      color: '#dc2626' },
  waived:      { label: 'Dispensada',    color: '#64748b' },
}

function fmtDate(val?: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('pt-BR')
}

function CondicionantesPDF({ project, condicionantes, org }: {
  project: any
  condicionantes: any[]
  org: any
}) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('pt-BR')

  const pending     = condicionantes.filter(c => c.status === 'pending').length
  const inProgress  = condicionantes.filter(c => c.status === 'in_progress').length
  const fulfilled   = condicionantes.filter(c => c.status === 'fulfilled').length
  const overdue     = condicionantes.filter(c => c.status === 'overdue' ||
    (c.due_date && new Date(c.due_date) < today && c.status !== 'fulfilled' && c.status !== 'waived')).length
  const waived      = condicionantes.filter(c => c.status === 'waived').length

  // Ordena: atrasadas primeiro, depois por prazo
  const sorted = [...condicionantes].sort((a, b) => {
    const aOver = a.due_date && new Date(a.due_date) < today && a.status !== 'fulfilled' && a.status !== 'waived'
    const bOver = b.due_date && new Date(b.due_date) < today && b.status !== 'fulfilled' && b.status !== 'waived'
    if (aOver && !bOver) return -1
    if (!aOver && bOver) return 1
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return createElement(Document, { title: `Condicionantes — ${project.name}` },
    createElement(Page, { size: 'A4', style: styles.page },

      // Header
      createElement(View, { style: styles.header },
        createElement(View, null,
          createElement(Text, { style: styles.orgName }, org?.name ?? 'Gestão Ambiental'),
          createElement(Text, { style: styles.reportTitle }, 'Relatório de Condicionantes'),
        ),
        createElement(View, { style: { alignItems: 'flex-end' } },
          createElement(Text, { style: styles.headerDate }, `Emitido em ${todayStr}`),
        ),
      ),

      // Info do projeto
      createElement(View, { style: styles.projectBox },
        createElement(Text, { style: styles.projectName }, project.name),
        createElement(Text, { style: styles.projectMeta },
          `${project.license_type}${project.agency ? ` · ${project.agency}` : ''}${project.license_number ? ` · Licença ${project.license_number}` : ''}`
        ),
        project.clients
          ? createElement(Text, { style: { ...styles.projectMeta, marginTop: 2 } }, `Cliente: ${project.clients.name}`)
          : null,
      ),

      // Sumário
      createElement(View, { style: styles.summaryRow },
        createElement(View, { style: styles.summaryBox },
          createElement(Text, { style: { ...styles.summaryNum, color: '#b45309' } }, String(pending)),
          createElement(Text, { style: styles.summaryLabel }, 'Pendentes'),
        ),
        createElement(View, { style: styles.summaryBox },
          createElement(Text, { style: { ...styles.summaryNum, color: '#1d4ed8' } }, String(inProgress)),
          createElement(Text, { style: styles.summaryLabel }, 'Em andamento'),
        ),
        createElement(View, { style: styles.summaryBox },
          createElement(Text, { style: { ...styles.summaryNum, color: '#dc2626' } }, String(overdue)),
          createElement(Text, { style: styles.summaryLabel }, 'Atrasadas'),
        ),
        createElement(View, { style: styles.summaryBox },
          createElement(Text, { style: { ...styles.summaryNum, color: '#15803d' } }, String(fulfilled)),
          createElement(Text, { style: styles.summaryLabel }, 'Cumpridas'),
        ),
        createElement(View, { style: styles.summaryBox },
          createElement(Text, { style: { ...styles.summaryNum, color: '#64748b' } }, String(waived)),
          createElement(Text, { style: styles.summaryLabel }, 'Dispensadas'),
        ),
      ),

      // Tabela
      createElement(Text, { style: styles.sectionTitle }, `Condicionantes (${condicionantes.length})`),

      createElement(View, { style: styles.tableHeader },
        createElement(View, { style: styles.colNum },   createElement(Text, { style: styles.thText }, '#')),
        createElement(View, { style: styles.colTitle },  createElement(Text, { style: styles.thText }, 'Condicionante')),
        createElement(View, { style: styles.colDate },   createElement(Text, { style: styles.thText }, 'Prazo')),
        createElement(View, { style: styles.colStatus }, createElement(Text, { style: styles.thText }, 'Status')),
      ),

      ...sorted.map((c, i) => {
        const st = STATUS_MAP[c.status] ?? STATUS_MAP.pending
        const isActuallyOverdue = c.due_date && new Date(c.due_date) < today && c.status !== 'fulfilled' && c.status !== 'waived'
        const rowStyle = isActuallyOverdue
          ? { ...styles.tableRow, ...styles.tableRowOverdue }
          : i % 2 === 1
            ? { ...styles.tableRow, ...styles.tableRowAlt }
            : styles.tableRow
        const statusColor = isActuallyOverdue ? '#dc2626' : st.color

        return createElement(View, { key: c.id, style: rowStyle },
          createElement(View, { style: styles.colNum },
            createElement(Text, { style: styles.tdNum }, String(i + 1)),
          ),
          createElement(View, { style: styles.colTitle },
            createElement(Text, { style: styles.tdBold }, c.title),
            c.description
              ? createElement(Text, { style: styles.tdSub }, c.description)
              : null,
          ),
          createElement(View, { style: styles.colDate },
            createElement(Text, { style: { ...styles.tdText, color: isActuallyOverdue ? '#dc2626' : '#334155' } },
              fmtDate(c.due_date)
            ),
          ),
          createElement(View, { style: styles.colStatus },
            createElement(Text, { style: { ...styles.tdText, color: statusColor, fontFamily: 'Helvetica-Bold' } },
              isActuallyOverdue ? 'Atrasada' : st.label
            ),
          ),
        )
      }),

      // Footer
      createElement(View, { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, org?.name ?? 'Gestão Ambiental'),
        createElement(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: any) => `Página ${pageNumber} de ${totalPages}` }),
      ),
    )
  )
}

export async function GET(_req: NextRequest, { params }: { params: { projectId: string } }) {
  const profile = await getCurrentUserData()
  if (!profile) return new NextResponse('Não autorizado', { status: 401 })

  const { data: project } = await (adminClient as any)
    .from('projects')
    .select('*, clients(name)')
    .eq('id', params.projectId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!project) return new NextResponse('Projeto não encontrado', { status: 404 })

  const [{ data: condicionantes }, { data: org }] = await Promise.all([
    (adminClient as any)
      .from('condicionantes')
      .select('*')
      .eq('project_id', params.projectId)
      .order('due_date', { ascending: true, nullsFirst: false }),
    (adminClient as any)
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single(),
  ])

  const pdfElement = createElement(CondicionantesPDF, {
    project,
    condicionantes: condicionantes ?? [],
    org,
  })

  const buffer = await renderToBuffer(pdfElement as any)
  const filename = `condicionantes-${project.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
