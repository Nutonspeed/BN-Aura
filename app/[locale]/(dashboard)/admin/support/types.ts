export interface SupportTicket {
  id: string;
  clinic_id: string;
  user_id: string | null;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  assigned_to: string | null;
  resolved_at: string | null;
  first_response_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  clinic?: {
    id: string;
    name: string;
    email: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  attachments: any[];
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface SupportStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  high_priority: number;
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: SupportStats;
}

export interface SupportContextType {
  tickets: SupportTicket[];
  stats: SupportStats | null;
  loading: boolean;
  selectedTicket: SupportTicket | null;
  filters: {
    status: string;
    priority: string;
    search: string;
    page: number;
  };
  setTickets: (tickets: SupportTicket[]) => void;
  setStats: (stats: SupportStats) => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  updateFilters: (filters: Partial<SupportContextType['filters']>) => void;
  refreshTickets: () => Promise<void>;
}
