export type Role = 'SUPER_ADMIN' | 'IT_MANAGER' | 'IT_SUPPORT' | 'USER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssetType = 'SERVER' | 'NETWORK_DEVICE' | 'SOFTWARE' | 'LICENSE' | 'OTHER';
export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  isMfaEnabled: boolean;
  department?: string;
  phone?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: TicketCategory[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
}

export interface KnowledgeArticleSuggestion {
  id: string;
  title: string;
  summary?: string;
  slug: string;
  category?: KnowledgeCategory | null;
}

export interface SLAPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: TicketCategory;
  requester: Pick<User, 'id' | 'username' | 'email' | 'avatar'>;
  assignee?: Pick<User, 'id' | 'username' | 'email' | 'avatar'>;
  slaPolicy?: SLAPolicy;
  dueAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  firstResponseAt?: string;
  slaBreached: boolean;
  slaResponseBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  author: Pick<User, 'id' | 'username' | 'avatar' | 'role'>;
  attachments: TicketAttachment[];
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploader?: Pick<User, 'id' | 'username'>;
  createdAt: string;
}

export interface TicketTimeline {
  id: string;
  action: string;
  fromValue?: string;
  toValue?: string;
  metadata?: any;
  actor: Pick<User, 'id' | 'username' | 'avatar'>;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  slaBreached: number;
  resolvedToday: number;
  slaCompliance: number;
  topAssignee?: {
    id: string;
    username: string;
    email: string;
    avatar?: string | null;
    count: number;
  } | null;
}

export type AssignableUser = Pick<User, 'id' | 'username' | 'email' | 'avatar' | 'role'>;