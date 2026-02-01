export interface SystemSettings {
  // Company Information
  company_name: string;
  company_logo_url?: string;
  contact_email: string;
  contact_phone: string;
  support_email: string;
  
  // Regional Settings
  default_language: string;
  default_timezone: string;
  default_currency: string;
  tax_rate: number;
  
  // Feature Flags
  features: {
    ai_analysis_enabled: boolean;
    subscription_billing: boolean;
    multi_branch_support: boolean;
    appointment_booking: boolean;
    inventory_management: boolean;
    analytics_dashboard: boolean;
    support_tickets: boolean;
    audit_logs: boolean;
  };
  
  // AI Configuration
  ai_config: {
    default_model: string;
    max_requests_per_day: number;
    confidence_threshold: number;
    enabled_models: string[];
  };
  
  // Email Configuration
  email_config: {
    smtp_host?: string;
    smtp_port?: number;
    smtp_username?: string;
    smtp_password?: string;
    from_email: string;
    from_name: string;
  };
  
  // Storage Configuration
  storage_config: {
    provider: 'supabase' | 'aws_s3' | 'google_cloud';
    max_file_size_mb: number;
    allowed_file_types: string[];
  };
  
  // Security Settings
  security: {
    max_login_attempts: number;
    session_timeout_minutes: number;
    password_min_length: number;
    require_2fa_for_admin: boolean;
    allowed_domains: string[];
  };
  
  // Subscription Plans
  subscription_plans: {
    starter: SubscriptionPlan;
    professional: SubscriptionPlan;
    premium: SubscriptionPlan;
    enterprise: SubscriptionPlan;
  };
  
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface SubscriptionPlan {
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_users: number;
    max_branches: number;
    max_ai_requests: number;
    storage_gb: number;
  };
  is_active: boolean;
}

export interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}
