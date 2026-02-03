import { NextResponse } from 'next/server';
import { createClient, createClientWithAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * Super Admin Analytics API
 * Provides comprehensive business intelligence data
 * พร้อม caching เพื่อเพิ่มประสิทธิภาพ
 */

export async function GET(request: Request) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const adminClient = createAdminClient();

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    
    // TODO: Add caching when cache system is properly configured
    console.log('Analytics data fetched - cache system disabled for development');
    
    // Calculate date ranges based on period
    const now = new Date();
    let days = 30;
    
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }
    
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. Revenue Analytics
    const { data: clinics } = await adminClient
      .from('clinics')
      .select('subscription_tier, created_at, is_active');

    const subscriptionPricing = {
      'starter': 2900,
      'professional': 4900,
      'premium': 7900,
      'enterprise': 12900
    };

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    const revenueByPlan: { [key: string]: { amount: number; count: number } } = {};

    clinics?.forEach(clinic => {
      if (clinic.is_active) {
        const price = subscriptionPricing[clinic.subscription_tier as keyof typeof subscriptionPricing] || 0;
        totalRevenue += price;
        
        if (new Date(clinic.created_at) >= startDate) {
          monthlyRevenue += price;
        }

        if (!revenueByPlan[clinic.subscription_tier]) {
          revenueByPlan[clinic.subscription_tier] = { amount: 0, count: 0 };
        }
        revenueByPlan[clinic.subscription_tier].amount += price;
        revenueByPlan[clinic.subscription_tier].count += 1;
      }
    });

    // Calculate revenue growth
    let previousRevenue = 0;
    clinics?.forEach(clinic => {
      const createdAt = new Date(clinic.created_at);
      if (createdAt >= previousStartDate && createdAt < startDate && clinic.is_active) {
        const price = subscriptionPricing[clinic.subscription_tier as keyof typeof subscriptionPricing] || 0;
        previousRevenue += price;
      }
    });

    const revenueGrowth = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 100;

    // 2. Clinics Analytics
    const { count: totalClinics } = await adminClient
      .from('clinics')
      .select('id', { count: 'exact', head: true });

    const { count: activeClinics } = await adminClient
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: newClinics } = await adminClient
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    const { count: previousClinics } = await adminClient
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const clinicsGrowth = previousClinics && previousClinics > 0 ? 
      ((newClinics || 0) - previousClinics) / previousClinics * 100 : 100;

    // 3. Users Analytics
    const { count: totalUsers } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { count: newUsers } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    const { count: previousUsers } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const usersGrowth = previousUsers && previousUsers > 0 ? 
      ((newUsers || 0) - previousUsers) / previousUsers * 100 : 100;

    // Users by role
    const { data: usersByRole } = await adminClient
      .from('users')
      .select('role')
      .neq('role', null);

    const roleDistribution: { [key: string]: number } = {};
    usersByRole?.forEach(user => {
      roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
    });

    // 4. AI Usage Analytics
    const { count: totalScans } = await adminClient
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true });

    const { count: monthlyScans } = await adminClient
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    const { count: previousScans } = await adminClient
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const aiGrowth = previousScans && previousScans > 0 ? 
      ((monthlyScans || 0) - previousScans) / previousScans * 100 : 100;

    // Top clinics by AI usage
    const { data: topAIClinics } = await adminClient
      .from('skin_analyses')
      .select(`
        clinic_id,
        clinics!inner(display_name)
      `)
      .gte('created_at', startDate.toISOString());

    const clinicScanCounts: { [key: string]: { name: string; count: number } } = {};
    topAIClinics?.forEach((scan: any) => {
      const clinicId = scan.clinic_id;
      const clinicName = typeof scan.clinics.display_name === 'object' 
        ? scan.clinics.display_name.th || scan.clinics.display_name.en 
        : scan.clinics.display_name;
      
      if (!clinicScanCounts[clinicId]) {
        clinicScanCounts[clinicId] = { name: clinicName, count: 0 };
      }
      clinicScanCounts[clinicId].count += 1;
    });

    const topClinics = Object.values(clinicScanCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(clinic => ({
        clinic: clinic.name,
        scans: clinic.count
      }));

    // 5. System Performance (mock data for now)
    const performance = {
      avgResponseTime: 120,
      uptime: 99.9,
      errorRate: 0.01
    };

    // สร้าง response data
    const responseData = {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: revenueGrowth,
        byPlan: Object.entries(revenueByPlan).map(([plan, data]) => ({
          plan,
          amount: data.amount,
          count: data.count
        }))
      },
      clinics: {
        total: totalClinics || 0,
        active: activeClinics || 0,
        growth: clinicsGrowth,
        newThisMonth: newClinics || 0,
        churnRate: 0 // Can be calculated based on deactivated clinics
      },
      users: {
        total: totalUsers || 0,
        active: totalUsers || 0, // Assuming all users are active for now
        growth: usersGrowth,
        byRole: Object.entries(roleDistribution).map(([role, count]) => ({
          role,
          count
        }))
      },
      aiUsage: {
        totalScans: totalScans || 0,
        monthlyScans: monthlyScans || 0,
        growth: aiGrowth,
        avgPerClinic: activeClinics ? Math.round((monthlyScans || 0) / activeClinics) : 0,
        topClinics
      },
      performance
    };

    return successResponse({
      ...responseData,
      _meta: { cached: false }
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
