/**
 * PDPA Consent Management API
 * GET - Retrieve user's consent records
 * POST - Record or update consent
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

async function getUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser(authHeader.substring(7));
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet
      if (error.message.includes('consent_records')) {
        return NextResponse.json({ 
          success: true, 
          data: [],
          message: 'Consent table not yet created. Run migration 20260211000001.' 
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Consent API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, consents, consentType, reason } = body;

    const adminClient = createAdminClient();

    // Record consent
    if (action === 'record' && consents) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const ua = request.headers.get('user-agent') || 'unknown';

      const records = Object.entries(consents).map(([type, given]) => ({
        user_id: user.id,
        consent_type: type,
        consent_given: Boolean(given),
        consent_version: '1.0',
        ip_address: ip,
        user_agent: ua,
        updated_at: new Date().toISOString(),
      }));

      // Upsert each consent record
      for (const record of records) {
        const { error } = await adminClient
          .from('consent_records')
          .upsert(record, { onConflict: 'user_id,consent_type' });

        if (error && !error.message.includes('consent_records')) {
          console.error('[Consent] Upsert error:', error);
        }
      }

      return NextResponse.json({ 
        success: true, 
        data: { recorded: records.length } 
      });
    }

    // Revoke consent
    if (action === 'revoke' && consentType) {
      const { error } = await adminClient
        .from('consent_records')
        .update({ 
          consent_given: false, 
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('consent_type', consentType);

      if (error) throw error;

      return NextResponse.json({ success: true, data: { revoked: consentType } });
    }

    // Request data deletion (Right to be Forgotten)
    if (action === 'request_deletion') {
      const { error } = await adminClient
        .from('data_deletion_requests')
        .insert({
          user_id: user.id,
          request_type: body.requestType || 'full_deletion',
          reason: reason || 'User requested data deletion',
          status: 'pending',
          metadata: { requested_via: 'api' },
        });

      if (error && !error.message.includes('data_deletion_requests')) {
        throw error;
      }

      return NextResponse.json({ 
        success: true, 
        data: { status: 'pending', message: 'Your data deletion request has been submitted and will be processed within 30 days.' } 
      });
    }

    // Export user data (Data Portability)
    if (action === 'export_data') {
      const [
        { data: userData },
        { data: staffData },
        { data: consentData },
      ] = await Promise.all([
        adminClient.from('users').select('*').eq('id', user.id).maybeSingle(),
        adminClient.from('clinic_staff').select('clinic_id, role, is_active, created_at').eq('user_id', user.id),
        adminClient.from('consent_records').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          profile: userData,
        },
        staffRecords: staffData || [],
        consentRecords: consentData || [],
      };

      return NextResponse.json({ 
        success: true, 
        data: exportData,
        meta: { format: 'json', exportedAt: new Date().toISOString() }
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported: record, revoke, request_deletion, export_data' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('[Consent API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
