import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { apiCache, APICache } from '@/lib/api/cache';

/**
 * Super Admin Billing API
 * Provides subscription and billing management data
 * พร้อม caching เพื่อเพิ่มประสิทธิภาพ
 */

export async function GET(request: Request) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    // สร้าง cache key
    const cacheKey = '/admin/billing';
    
    // ตรวจสอบ cache
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return successResponse({
        ...cachedData,
        _meta: { cached: true }
      });
    }

    const subscriptionPricing = {
      'starter': 2900,
      'professional': 4900,
      'premium': 7900,
      'enterprise': 12900
    };

    // Fetch all active clinics with their subscription info
    const { data: clinics } = await adminClient
      .from('clinics')
      .select('id, display_name, subscription_tier, is_active, created_at');

    const subscriptions = clinics?.map(clinic => {
      const planPrice = subscriptionPricing[clinic.subscription_tier as keyof typeof subscriptionPricing] || 0;
      const createdDate = new Date(clinic.created_at);
      const nextBilling = new Date(createdDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      return {
        id: `sub_${clinic.id.slice(0, 8)}`,
        clinic_id: clinic.id,
        clinic_name: typeof clinic.display_name === 'object' 
          ? clinic.display_name.th || clinic.display_name.en 
          : clinic.display_name,
        plan: clinic.subscription_tier,
        status: clinic.is_active ? 'active' : 'canceled',
        current_period_start: clinic.created_at,
        current_period_end: nextBilling.toISOString(),
        amount: planPrice,
        currency: 'THB',
        payment_method: 'bank_transfer',
        next_billing_date: nextBilling.toISOString(),
        auto_renew: clinic.is_active
      };
    }) || [];

    // Calculate billing statistics
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const pastDueSubscriptions = subscriptions.filter(sub => sub.status === 'past_due');
    const canceledSubscriptions = subscriptions.filter(sub => sub.status === 'canceled');

    const monthlyRevenue = activeSubscriptions.reduce((total, sub) => total + sub.amount, 0);
    const totalRevenue = monthlyRevenue; // For now, same as monthly
    const churnRate = clinics && clinics.length > 0 ? 
      (canceledSubscriptions.length / clinics.length) * 100 : 0;

    const stats = {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: activeSubscriptions.length,
      pastDueCount: pastDueSubscriptions.length,
      churnRate,
      mrr: monthlyRevenue // Monthly Recurring Revenue
    };

    // สร้าง response data
    const responseData = {
      subscriptions,
      stats
    };

    // บันทึกข้อมูลลง cache (TTL = 5 นาที)
    apiCache.set(cacheKey, responseData);

    return successResponse({
      ...responseData,
      _meta: { cached: false }
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, clinicId, subscriptionId, newPlan, status } = body;

    if (action === 'updateSubscription' && clinicId) {
      const updateData: any = {
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      if (newPlan) {
        updateData.subscription_tier = newPlan;
      }

      if (status !== undefined) {
        updateData.is_active = status === 'active';
      }

      const { error } = await adminClient
        .from('clinics')
        .update(updateData)
        .eq('id', clinicId);

      if (error) throw error;

      // ลบ cache เมื่อมีการอัพเดทข้อมูล
      apiCache.invalidate('/admin/billing');

      return successResponse({ 
        message: 'Subscription updated successfully' 
      });
    }

    if (action === 'cancelSubscription' && clinicId) {
      const { error } = await adminClient
        .from('clinics')
        .update({
          is_active: false,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId);

      if (error) throw error;

      // ลบ cache เมื่อมีการยกเลิก subscription
      apiCache.invalidate('/admin/billing');

      return successResponse({ 
        message: 'Subscription canceled successfully' 
      });
    }

    if (action === 'reactivateSubscription' && clinicId) {
      const { error } = await adminClient
        .from('clinics')
        .update({
          is_active: true,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId);

      if (error) throw error;

      // ลบ cache เมื่อมีการเปิดใช้งาน subscription อีกครั้ง
      apiCache.invalidate('/admin/billing');

      return successResponse({ 
        message: 'Subscription reactivated successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return handleAPIError(error);
  }
}
