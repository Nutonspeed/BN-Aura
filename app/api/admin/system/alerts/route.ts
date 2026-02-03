import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Get system alerts
export async function GET(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');

    // Get system alerts
    let query = supabaseAdmin
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }
    
    if (resolved !== null) {
      query = query.eq('is_resolved', resolved === 'true');
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new system alert
export async function POST(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    // Create system alert
    const { data: alert, error } = await supabaseAdmin
      .from('system_alerts')
      .insert({
        alert_type: body.alert_type,
        severity: body.severity,
        title: body.title,
        message: body.message,
        is_resolved: body.is_resolved || false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Error creating system alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create system alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH - Update system alert
export async function PATCH(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ success: false, error: 'Alert ID is required' }, { status: 400 });
    }

    // Update alert
    const updateData: any = {};
    
    if (body.is_resolved !== undefined) {
      updateData.is_resolved = body.is_resolved;
      if (body.is_resolved) {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    const { data: alert, error } = await supabaseAdmin
      .from('system_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Error updating system alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
