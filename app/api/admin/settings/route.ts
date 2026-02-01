import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get system settings from database (we'll store in a system_settings table)
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .single();

    let settings;
    if (settingsError || !settingsData) {
      // If no settings exist, create default settings
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          id: 'system',
          settings: DEFAULT_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .select('*')
        .single();

      if (createError) {
        throw createError;
      }
      settings = newSettings.settings;
    } else {
      settings = settingsData.settings;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        updated_at: settingsData?.updated_at,
        updated_by: settingsData?.updated_by
      }
    });

  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// Default system settings
const DEFAULT_SETTINGS = {
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
    provider: 'supabase' as const,
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
  }
};

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get current settings
    const { data: currentSettings, error: fetchError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('id', 'system')
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Merge updates with current settings
    const updatedSettings = {
      ...currentSettings.settings,
      ...body,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    // Update settings in database
    const { data: newSettings, error: updateError } = await supabaseAdmin
      .from('system_settings')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', 'system')
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: newSettings.settings
    });

  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
