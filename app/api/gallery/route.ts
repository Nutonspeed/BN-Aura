import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List treatment photos / gallery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const customerId = searchParams.get('customer_id');
    const publicGallery = searchParams.get('public') === 'true';
    const type = searchParams.get('type'); // 'before', 'after', 'progress'

    const supabase = await createClient();
    const adminClient = createAdminClient();

    if (publicGallery && clinicId) {
      // Public gallery - only show consented comparisons
      const { data: comparisons, error } = await adminClient
        .from('photo_comparisons')
        .select(`
          id,
          title,
          description,
          treatment_name,
          view_count,
          featured,
          before_photo:treatment_photos!before_photo_id(
            id, photo_url, thumbnail_url, type
          ),
          after_photo:treatment_photos!after_photo_id(
            id, photo_url, thumbnail_url, type
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('is_public', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Public gallery fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
      }

      return NextResponse.json({ comparisons });
    }

    // Authenticated access
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = adminClient
      .from('treatment_photos')
      .select(`
        *,
        customer:customers(id, full_name),
        treatment:treatments(id, names)
      `)
      .order('taken_at', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: photos, error } = await query.limit(100);

    if (error) {
      console.error('Gallery fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Gallery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upload a treatment photo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinicId,
      customerId,
      treatmentId,
      appointmentId,
      type,
      photoUrl,
      thumbnailUrl,
      notes,
      internalNotes,
      tags = [],
      customerConsent = false,
      publicGalleryConsent = false
    } = body;

    if (!clinicId || !customerId || !type || !photoUrl) {
      return NextResponse.json(
        { error: 'clinicId, customerId, type, and photoUrl are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify staff access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true).limit(1).maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: photo, error } = await adminClient
      .from('treatment_photos')
      .insert({
        clinic_id: clinicId,
        customer_id: customerId,
        treatment_id: treatmentId,
        appointment_id: appointmentId,
        type,
        photo_url: photoUrl,
        thumbnail_url: thumbnailUrl,
        taken_by_staff_id: user.id,
        notes,
        internal_notes: internalNotes,
        tags,
        customer_consent: customerConsent,
        consent_date: customerConsent ? new Date().toISOString() : null,
        public_gallery_consent: publicGalleryConsent
      })
      .select()
      .single();

    if (error) {
      console.error('Photo upload error:', error);
      return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photo
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
