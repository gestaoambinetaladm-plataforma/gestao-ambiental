// =============================================================================
// TIPOS GLOBAIS — SaaS de Gestão Ambiental
// =============================================================================

// ─── Multi-tenancy ───────────────────────────────────────────────────────────

export type UserRole =
  | 'admin'
  | 'director'
  | 'environmental_engineer'
  | 'biologist'
  | 'field_technician'
  | 'commercial'
  | 'financial'
  | 'legal'
  | 'designer'
  | 'client'

export interface Organization {
  id: string
  name: string
  slug: string
  document?: string
  plan: 'trial' | 'starter' | 'pro' | 'enterprise'
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at?: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string
  phone?: string
  crea_number?: string
  status: 'active' | 'inactive'
  created_at: string
}

// ─── Licenças ─────────────────────────────────────────────────────────────────

export type LicenseType =
  | 'LP'   // Licença Prévia
  | 'LI'   // Licença de Instalação
  | 'LO'   // Licença de Operação
  | 'LAS'  // Licença Ambiental Simplificada
  | 'LAR'  // Licença Ambiental por Adesão e Compromisso
  | 'LUP'  // Licença de Uso Provisório
  | 'AAF'  // Autorização Ambiental de Funcionamento
  | 'AUF'  // Autorização de Uso de Fauna
  | 'ADA'  // Autorização de Desmate e Aproveitamento
  | 'OTHER'

export type ProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'waiting_agency'
  | 'pending_docs'
  | 'approved'
  | 'rejected'
  | 'archived'

export type CondicionanteStatus =
  | 'pending'
  | 'in_progress'
  | 'fulfilled'
  | 'overdue'
  | 'waived'

// ─── Clientes ─────────────────────────────────────────────────────────────────

export type ClientType = 'pf' | 'pj'

export interface Client {
  id: string
  organization_id: string
  type: ClientType
  name: string
  document?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  notes?: string
  portal_token?: string
  portal_token_expires_at?: string
  created_at: string
}

// ─── Projetos ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  organization_id: string
  client_id: string
  name: string
  license_type: LicenseType
  status: ProjectStatus
  agency?: string
  protocol_number?: string
  license_number?: string
  license_issued_at?: string
  license_expires_at?: string
  license_validity_years?: number
  description?: string
  progress_pct: number
  created_by: string
  created_at: string
  updated_at: string
  // joins
  client?: Client
}

export interface Condicionante {
  id: string
  project_id: string
  organization_id: string
  title: string
  description?: string
  due_date?: string
  status: CondicionanteStatus
  alert_days_before: number
  fulfilled_at?: string
  created_at: string
}

// ─── Tarefas ─────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  organization_id: string
  project_id?: string
  parent_task_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Documentos ───────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'report'
  | 'license'
  | 'study'
  | 'map'
  | 'photo'
  | 'contract'
  | 'official_letter'
  | 'other'

export type DocumentStatus = 'pending_upload' | 'uploaded' | 'processing' | 'error'

export interface Document {
  id: string
  organization_id: string
  project_id?: string
  uploaded_by: string
  name: string
  filename: string
  mime_type: string
  size_bytes: number
  storage_path: string
  category: DocumentCategory
  status: DocumentStatus
  is_visible_to_client: boolean
  created_at: string
}

// ─── CRM ──────────────────────────────────────────────────────────────────────

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'

export interface Lead {
  id: string
  organization_id: string
  name: string
  company?: string
  email?: string
  phone?: string
  document?: string
  source?: string
  stage: LeadStage
  estimated_value?: number
  notes?: string
  assigned_to?: string
  converted_to_client_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'condicionante_due'
  | 'task_due'
  | 'license_expiring'
  | 'project_status_changed'
  | 'document_uploaded'
  | 'mention'

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  link?: string
  created_at: string
}

// ─── Paginação ────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}
