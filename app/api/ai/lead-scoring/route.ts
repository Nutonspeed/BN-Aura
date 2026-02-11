/**
 * AI Lead Scoring API
 * GET  - Get prioritized leads for a clinic
 * POST - Score a specific lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface LeadScore {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  priorityScore: number;
  priorityLevel: 'hot' | 'warm' | 'cold';
  recommendedAction: string;
  factors: { name: string; score: number }[];
  lastActivity?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();

    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Get active leads
    const { data: leads } = await adminClient
      .from('sales_leads')
      .select('id, customer_id, status, priority, source, notes, last_contacted_at, created_at, customer:customers(id, full_name, email, phone)')
      .eq('clinic_id', staff.clinic_id)
      .in('status', ['new', 'contacted', 'qualified', 'negotiation'])
      .order('created_at', { ascending: false })
      .limit(50);

    // Get recent skin analyses for leads
    const customerIds = (leads || []).map((l: any) => l.customer_id).filter(Boolean);
    const { data: analyses } = customerIds.length > 0
      ? await adminClient
          .from('skin_analyses')
          .select('customer_id, overall_score, created_at')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Build analysis map (latest per customer)
    const analysisMap: Record<string, any> = {};
    (analyses || []).forEach((a: any) => {
      if (!analysisMap[a.customer_id]) {
        analysisMap[a.customer_id] = a;
      }
    });

    // Score each lead
    const scoredLeads: LeadScore[] = (leads || []).map((lead: any) => {
      const customer = lead.customer as any;
      const analysis = analysisMap[lead.customer_id];
      const factors: { name: string; score: number }[] = [];
      let totalScore = 0;

      // Factor 1: Recency (30%) — how recently they were contacted
      const daysSinceContact = lead.last_contacted_at
        ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const recencyScore = daysSinceContact <= 1 ? 100 : daysSinceContact <= 3 ? 80 : daysSinceContact <= 7 ? 60 : daysSinceContact <= 14 ? 40 : 20;
      factors.push({ name: 'ความใหม่ของการติดต่อ', score: recencyScore });
      totalScore += recencyScore * 0.3;

      // Factor 2: Pipeline stage (25%)
      const stageScores: Record<string, number> = { negotiation: 90, qualified: 70, contacted: 50, new: 30 };
      const stageScore = stageScores[lead.status] || 30;
      factors.push({ name: 'ขั้นตอนการขาย', score: stageScore });
      totalScore += stageScore * 0.25;

      // Factor 3: Skin analysis urgency (25%)
      const analysisScore = analysis ? Math.max(20, 100 - (analysis.overall_score || 50)) : 50;
      factors.push({ name: 'ความเร่งด่วนจาก AI', score: analysisScore });
      totalScore += analysisScore * 0.25;

      // Factor 4: Contact info completeness (20%)
      let completeness = 0;
      if (customer?.email) completeness += 40;
      if (customer?.phone) completeness += 40;
      if (lead.notes) completeness += 20;
      factors.push({ name: 'ข้อมูลครบถ้วน', score: completeness });
      totalScore += completeness * 0.2;

      const priorityScore = Math.round(totalScore);
      const priorityLevel = priorityScore >= 70 ? 'hot' : priorityScore >= 40 ? 'warm' : 'cold';

      // Recommended action
      let recommendedAction = 'ติดตามผล';
      if (priorityLevel === 'hot') {
        recommendedAction = lead.status === 'negotiation' ? 'ปิดการขาย — ส่ง proposal' : 'โทรติดตามทันที';
      } else if (priorityLevel === 'warm') {
        recommendedAction = analysis ? 'ส่งผลวิเคราะห์ผิว + โปรโมชั่น' : 'นัดวิเคราะห์ผิวฟรี';
      } else {
        recommendedAction = 'ส่ง LINE/SMS แจ้งโปรโมชั่น';
      }

      return {
        id: lead.id,
        name: customer?.full_name || 'Unknown',
        email: customer?.email,
        phone: customer?.phone,
        priorityScore,
        priorityLevel,
        recommendedAction,
        factors,
        lastActivity: lead.last_contacted_at || lead.created_at,
      };
    });

    // Sort by priority score descending
    scoredLeads.sort((a, b) => b.priorityScore - a.priorityScore);

    return NextResponse.json({
      success: true,
      data: {
        leads: scoredLeads,
        summary: {
          total: scoredLeads.length,
          hot: scoredLeads.filter(l => l.priorityLevel === 'hot').length,
          warm: scoredLeads.filter(l => l.priorityLevel === 'warm').length,
          cold: scoredLeads.filter(l => l.priorityLevel === 'cold').length,
        },
      },
    });
  } catch (error) {
    console.error('[Lead Scoring] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
