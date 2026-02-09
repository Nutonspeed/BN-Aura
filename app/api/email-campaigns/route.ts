import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List email campaigns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('email_campaigns')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: campaigns } = await query;

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create email campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, subject, previewText, contentHtml, contentText, fromName, fromEmail, replyTo, segmentRules = {}, scheduledAt } = body;

    if (!name || !subject || !contentHtml) {
      return NextResponse.json({ error: 'name, subject, and contentHtml required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    
    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: campaign, error } = await adminClient
      .from('email_campaigns')
      .insert({
        clinic_id: staff.clinic_id,
        name,
        subject,
        preview_text: previewText,
        content_html: contentHtml,
        content_text: contentText,
        from_name: fromName,
        from_email: fromEmail,
        reply_to: replyTo,
        segment_rules: segmentRules,
        scheduled_at: scheduledAt,
        status: scheduledAt ? 'scheduled' : 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update campaign status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { campaignId, action } = body;

    if (!campaignId || !action) {
      return NextResponse.json({ error: 'campaignId and action required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (action === 'send') {
      updateData.status = 'sending';
      updateData.sent_at = new Date().toISOString();
      // Email sending queued in background service
    } else if (action === 'cancel') {
      updateData.status = 'cancelled';
    }

    const { data: campaign, error } = await adminClient
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('Campaign update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
