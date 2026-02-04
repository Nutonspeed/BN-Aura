import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List reviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const platform = searchParams.get('platform');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('customer_reviews')
      .select('*, customer:customers(full_name)')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (rating) query = query.eq('rating', parseInt(rating));
    if (platform) query = query.eq('platform', platform);

    const { data: reviews } = await query.limit(100);

    // Calculate stats
    const totalReviews = reviews?.length || 0;
    const avgRating = totalReviews > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews?.forEach(r => { ratingCounts[r.rating as keyof typeof ratingCounts]++; });

    return NextResponse.json({ reviews: reviews || [], totalReviews, avgRating, ratingCounts });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add review or respond
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { reviewId, responseText, customerId, rating, reviewText, staffId, appointmentId, platform = 'internal' } = body;

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Respond to existing review
    if (reviewId && responseText) {
      const { data: review, error } = await adminClient
        .from('customer_reviews')
        .update({
          response_text: responseText,
          responded_by: user.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
      return NextResponse.json({ success: true, review });
    }

    // Create new review
    if (!rating) return NextResponse.json({ error: 'rating required' }, { status: 400 });

    const { data: review, error } = await adminClient
      .from('customer_reviews')
      .insert({
        clinic_id: staff.clinic_id,
        customer_id: customerId,
        rating,
        review_text: reviewText,
        staff_id: staffId,
        appointment_id: appointmentId,
        platform,
        is_verified: !!customerId
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
