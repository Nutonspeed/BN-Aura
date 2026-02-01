import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - List all announcements
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

    // Get announcements
    const { data: announcements, error: announcementsError } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announcementsError) {
      throw announcementsError;
    }

    // Get read counts for each announcement
    const announcementsWithCounts = await Promise.all(
      announcements.map(async (announcement) => {
        const { count } = await supabaseAdmin
          .from('announcement_reads')
          .select('*', { count: 'exact', head: true })
          .eq('announcement_id', announcement.id);

        return {
          ...announcement,
          read_count: count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: announcementsWithCounts
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

    // Create announcement
    const { data: announcement, error: createError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: body.title,
        content: body.content,
        target_audience: body.target_audience,
        display_location: body.display_location,
        priority: body.priority,
        start_date: body.start_date,
        end_date: body.end_date || null,
        is_active: body.is_active,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // TODO: Send notifications to target audience
    // This would involve:
    // 1. Query users based on target_audience
    // 2. Create notifications for each user
    // 3. Send emails if needed

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
