export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  message_type: 'notification' | 'email' | 'sms';
  target_type: 'all' | 'plan' | 'specific';
  target_plans?: string[];
  target_clinics?: string[];
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  delivery_stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  created_by: string;
  created_at: string;
  sent_at?: string;
}

export interface BroadcastFormData {
  title: string;
  content: string;
  message_type: 'notification' | 'email' | 'sms';
  target_type: 'all' | 'plan' | 'specific';
  target_plans: string[];
  target_clinics: string[];
  scheduled_at?: string;
}

export interface ClinicOption {
  id: string;
  name: string;
  plan: string;
  status: string;
  email: string;
  phone?: string;
}

export interface BroadcastContextType {
  messages: BroadcastMessage[];
  clinics: ClinicOption[];
  loading: boolean;
  creating: boolean;
  fetchMessages: () => Promise<void>;
  fetchClinics: () => Promise<void>;
  createMessage: (data: BroadcastFormData) => Promise<void>;
  sendTestMessage: (data: BroadcastFormData) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
}
