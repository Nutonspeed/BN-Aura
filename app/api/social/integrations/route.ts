import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List social integrations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { data: integrations } = await adminClient
      .from('social_integrations')
      .select('id, platform, account_name, is_active, connected_at, last_sync_at')
      .eq('clinic_id', staff.clinic_id);

    return NextResponse.json({ integrations: integrations || [] });
  } catch (error) {
    console.error('Social integrations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Connect social platform
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { platform, accountId, accountName, accessToken, pageId, settings = {} } = body;

    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: integration, error } = await adminClient
      .from('social_integrations')
      .upsert({
        clinic_id: staff.clinic_id,
        platform,
        account_id: accountId,
        account_name: accountName,
        access_token: accessToken,
        page_id: pageId,
        settings,
        is_active: true,
        connected_at: new Date().toISOString()
      }, { onConflict: 'clinic_id,platform' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });

    return NextResponse.json({ success: true, integration });
  } catch (error) {
    console.error('Connect social error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Disconnect social platform
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    await adminClient
      .from('social_integrations')
      .delete()
      .eq('clinic_id', staff.clinic_id)
      .eq('platform', platform);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect social error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
