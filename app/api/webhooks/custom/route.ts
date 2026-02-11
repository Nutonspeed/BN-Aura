/**
 * Custom Webhook System API
 * GET  - List registered webhooks for a clinic
 * POST - Register a new webhook endpoint
 * PATCH - Update webhook (enable/disable)
 * DELETE - Remove a webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const SUPPORTED_EVENTS = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
  'customer.created',
  'customer.updated',
  'transaction.completed',
  'transaction.refunded',
  'treatment.completed',
  'analysis.completed',
  'staff.created',
  'inventory.low_stock',
  'commission.approved',
];

// GET: List webhooks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Owner/admin only' }, { status: 403 });
    }

    const { data: webhooks } = await adminClient
      .from('custom_webhooks')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        webhooks: webhooks || [],
        supportedEvents: SUPPORTED_EVENTS,
      },
    });
  } catch (error: any) {
    console.error('[Webhooks] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Register webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url, events, description } = await request.json();

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'url and events[] are required' }, { status: 400 });
    }

    // Validate URL
    try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

    // Validate events
    const invalid = events.filter((e: string) => !SUPPORTED_EVENTS.includes(e));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Unsupported events: ${invalid.join(', ')}` }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Owner/admin only' }, { status: 403 });
    }

    // Generate signing secret
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const { data: webhook, error } = await adminClient
      .from('custom_webhooks')
      .insert({
        clinic_id: staff.clinic_id,
        url,
        events,
        description: description || null,
        secret,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Webhooks] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret,
        message: 'Webhook registered. Use the secret to verify signatures (HMAC-SHA256).',
      },
    });
  } catch (error: any) {
    console.error('[Webhooks] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Enable/disable webhook
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { webhookId, isActive, events } = await request.json();
    if (!webhookId) return NextResponse.json({ error: 'webhookId required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Owner/admin only' }, { status: 403 });
    }

    const updates: any = {};
    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (events && Array.isArray(events)) updates.events = events;

    const { data: webhook, error } = await adminClient
      .from('custom_webhooks')
      .update(updates)
      .eq('id', webhookId)
      .eq('clinic_id', staff.clinic_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: webhook });
  } catch (error: any) {
    console.error('[Webhooks] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove webhook
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');
    if (!webhookId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Owner/admin only' }, { status: 403 });
    }

    const { error } = await adminClient
      .from('custom_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('clinic_id', staff.clinic_id);

    if (error) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Webhook deleted' });
  } catch (error: any) {
    console.error('[Webhooks] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
