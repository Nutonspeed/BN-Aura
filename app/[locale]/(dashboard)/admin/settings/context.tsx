'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SettingsContextType, SystemSettings } from './types';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'BN-Aura',
  contact_email: 'support@bnaura.com',
  contact_phone: '+66-2-xxx-xxxx',
  support_email: 'support@bnaura.com',
  default_language: 'th',
  default_timezone: 'Asia/Bangkok',
  default_currency: 'THB',
  tax_rate: 7.0,
  features: {
    ai_analysis_enabled: true,
    subscription_billing: true,
    multi_branch_support: true,
    appointment_booking: true,
    inventory_management: true,
    analytics_dashboard: true,
    support_tickets: true,
    audit_logs: true
  },
  ai_config: {
    default_model: 'gpt-4-vision',
    max_requests_per_day: 1000,
    confidence_threshold: 0.85,
    enabled_models: ['gpt-4-vision', 'claude-3-sonnet']
  },
  email_config: {
    from_email: 'noreply@bnaura.com',
    from_name: 'BN-Aura System'
  },
  storage_config: {
    provider: 'supabase',
    max_file_size_mb: 10,
    allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  },
  security: {
    max_login_attempts: 5,
    session_timeout_minutes: 480,
    password_min_length: 8,
    require_2fa_for_admin: false,
    allowed_domains: []
  },
  subscription_plans: {
    starter: {
      name: 'Starter',
      price_monthly: 2900,
      price_yearly: 29000,
      features: ['Basic POS', 'Customer Management', 'Basic Reports'],
      limits: {
        max_users: 3,
        max_branches: 1,
        max_ai_requests: 100,
        storage_gb: 5
      },
      is_active: true
    },
    professional: {
      name: 'Professional',
      price_monthly: 4900,
      price_yearly: 49000,
      features: ['Advanced POS', 'Inventory Management', 'AI Analysis', 'Advanced Reports'],
      limits: {
        max_users: 10,
        max_branches: 3,
        max_ai_requests: 500,
        storage_gb: 20
      },
      is_active: true
    },
    premium: {
      name: 'Premium',
      price_monthly: 7900,
      price_yearly: 79000,
      features: ['Multi-branch Support', 'Advanced AI', 'Custom Reports', 'API Access'],
      limits: {
        max_users: 25,
        max_branches: 10,
        max_ai_requests: 1000,
        storage_gb: 50
      },
      is_active: true
    },
    enterprise: {
      name: 'Enterprise',
      price_monthly: 12900,
      price_yearly: 129000,
      features: ['Unlimited Users', 'White-label', 'Custom Integrations', 'Priority Support'],
      limits: {
        max_users: -1,
        max_branches: -1,
        max_ai_requests: 5000,
        storage_gb: 200
      },
      is_active: true
    }
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  updated_by: 'system'
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('company');

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (response.status === 401) {
        console.warn('User not authenticated for settings');
        // Optionally redirect to login or show message
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        console.error('Settings API error:', data.error);
        // Don't throw error, just log it
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    loading,
    activeSection,
    setActiveSection,
    updateSettings,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
