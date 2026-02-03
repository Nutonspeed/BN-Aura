import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Achievement System
 * GET - Fetch achievements and customer progress
 * POST - Check and unlock achievements
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const clinicId = searchParams.get('clinic_id');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    // Fetch all active achievements for clinic
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('category');

    if (achievementsError) throw achievementsError;

    // If customer_id provided, fetch their progress
    let customerProgress = null;
    if (customerId) {
      const { data: profile, error: profileError } = await supabase
        .from('loyalty_profiles')
        .select('unlocked_achievements, total_achievements')
        .eq('customer_id', customerId)
        .eq('clinic_id', clinicId)
        .single();

      if (!profileError && profile) {
        customerProgress = {
          unlocked: profile.unlocked_achievements || [],
          total: profile.total_achievements || 0
        };
      }
    }

    return successResponse({ 
      achievements,
      customerProgress 
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, clinic_id, achievement_id } = body;

    if (!customer_id || !clinic_id || !achievement_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, clinic_id, achievement_id' 
      }, { status: 400 });
    }

    // Fetch achievement details
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievement_id)
      .eq('clinic_id', clinic_id)
      .single();

    if (achievementError || !achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Fetch customer loyalty profile
    const { data: profile, error: profileError } = await supabase
      .from('loyalty_profiles')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('clinic_id', clinic_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer loyalty profile not found' }, { status: 404 });
    }

    // Check if already unlocked
    const unlockedAchievements = profile.unlocked_achievements || [];
    if (unlockedAchievements.includes(achievement_id)) {
      return NextResponse.json({ 
        error: 'Achievement already unlocked' 
      }, { status: 400 });
    }

    // Unlock achievement
    const { error: updateError } = await supabase
      .from('loyalty_profiles')
      .update({
        unlocked_achievements: [...unlockedAchievements, achievement_id],
        total_achievements: (profile.total_achievements || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customer_id)
      .eq('clinic_id', clinic_id);

    if (updateError) throw updateError;

    // Award points if specified
    if (achievement.points_reward && achievement.points_reward > 0) {
      const { error: pointsError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id,
          clinic_id,
          type: 'earned',
          amount: achievement.points_reward,
          description: `Achievement unlocked: ${achievement.name}`,
          achievement_id: achievement_id
        });

      if (pointsError) throw pointsError;

      // Update available points
      await supabase
        .from('loyalty_profiles')
        .update({
          total_points: profile.total_points + achievement.points_reward,
          available_points: profile.available_points + achievement.points_reward
        })
        .eq('customer_id', customer_id)
        .eq('clinic_id', clinic_id);
    }

    return successResponse({ 
      achievement,
      points_awarded: achievement.points_reward || 0,
      message: 'Achievement unlocked successfully!' 
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
