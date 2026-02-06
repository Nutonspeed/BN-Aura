import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST: Create a before/after comparison
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
      beforePhotoId,
      afterPhotoId,
      treatmentId,
      treatmentName,
      title,
      description,
      isPublic = false,
      featured = false
    } = body;

    if (!clinicId || !customerId || !beforePhotoId || !afterPhotoId) {
      return NextResponse.json(
        { error: 'clinicId, customerId, beforePhotoId, and afterPhotoId are required' },
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

    // Verify photos belong to the same customer
    const { data: photos } = await adminClient
      .from('treatment_photos')
      .select('id, customer_id, type, public_gallery_consent')
      .in('id', [beforePhotoId, afterPhotoId]);

    if (!photos || photos.length !== 2) {
      return NextResponse.json({ error: 'Photos not found' }, { status: 404 });
    }

    const beforePhoto = photos.find(p => p.id === beforePhotoId);
    const afterPhoto = photos.find(p => p.id === afterPhotoId);

    if (beforePhoto?.customer_id !== customerId || afterPhoto?.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Photos must belong to the same customer' },
        { status: 400 }
      );
    }

    // Check public consent if making public
    if (isPublic) {
      if (!beforePhoto?.public_gallery_consent || !afterPhoto?.public_gallery_consent) {
        return NextResponse.json(
          { error: 'Customer consent required for public gallery' },
          { status: 400 }
        );
      }
    }

    const { data: comparison, error } = await adminClient
      .from('photo_comparisons')
      .insert({
        clinic_id: clinicId,
        customer_id: customerId,
        before_photo_id: beforePhotoId,
        after_photo_id: afterPhotoId,
        treatment_id: treatmentId,
        treatment_name: treatmentName,
        title,
        description,
        is_public: isPublic,
        featured
      })
      .select()
      .single();

    if (error) {
      console.error('Comparison creation error:', error);
      return NextResponse.json({ error: 'Failed to create comparison' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Comparison creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
