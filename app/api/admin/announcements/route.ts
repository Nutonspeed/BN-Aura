import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - List all announcements
export async function GET(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Get announcements
    let query = supabaseAdmin
      .from('announcements')
      .select(`
        *,
        users!announcements_created_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status === 'published') {
      query = query.eq('is_published', true);
    } else if (status === 'draft') {
      query = query.eq('is_published', false);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: announcements, error: announcementsError } = await query;

    if (announcementsError) {
      throw announcementsError;
    }

    return NextResponse.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    // Create announcement
    const { data: announcement, error: createError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: body.title,
        content: body.content,
        type: body.type || 'info',
        target_audience: body.target_audience || 'all',
        scheduled_at: body.scheduled_at || null,
        published_at: body.is_published ? new Date().toISOString() : null,
        expires_at: body.expires_at || null,
        is_published: body.is_published || false,
        created_by: 'system'
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // If clinic targeting is specified, add clinic relationships
    if (body.clinic_ids && body.clinic_ids.length > 0) {
      const clinicRelations = body.clinic_ids.map((clinicId: string) => ({
        announcement_id: announcement.id,
        clinic_id: clinicId
      }));

      await supabaseAdmin
        .from('announcement_clinics')
        .insert(clinicRelations);
    }

    return NextResponse.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
