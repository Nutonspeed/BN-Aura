/**
 * Customer Segmentation API (RFM Analysis)
 * GET - Segment customers by Recency, Frequency, Monetary value
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RFMScore {
  customerId: string;
  fullName: string;
  phone: string | null;
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: string;
  segment: string;
  lastVisit: string | null;
  totalSpent: number;
  visitCount: number;
}

function getSegment(r: number, f: number, m: number): string {
  const score = r + f + m;
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  if (r >= 3 && f >= 3 && m >= 3) return 'loyal_customers';
  if (r >= 4 && f <= 2) return 'new_customers';
  if (r >= 3 && f >= 2 && m >= 2) return 'potential_loyalists';
  if (r <= 2 && f >= 3 && m >= 3) return 'at_risk';
  if (r <= 2 && f >= 4 && m >= 4) return 'cant_lose_them';
  if (r <= 2 && f <= 2 && m <= 2) return 'lost';
  if (r >= 3 && f <= 2 && m <= 2) return 'promising';
  return 'need_attention';
}

const SEGMENT_LABELS: Record<string, { th: string; en: string; color: string }> = {
  champions: { th: 'แชมเปี้ยน', en: 'Champions', color: '#10B981' },
  loyal_customers: { th: 'ลูกค้าประจำ', en: 'Loyal Customers', color: '#3B82F6' },
  new_customers: { th: 'ลูกค้าใหม่', en: 'New Customers', color: '#8B5CF6' },
  potential_loyalists: { th: 'มีศักยภาพ', en: 'Potential Loyalists', color: '#06B6D4' },
  at_risk: { th: 'เสี่ยงหาย', en: 'At Risk', color: '#F59E0B' },
  cant_lose_them: { th: 'ห้ามเสีย', en: "Can't Lose Them", color: '#EF4444' },
  lost: { th: 'สูญหาย', en: 'Lost', color: '#6B7280' },
  promising: { th: 'น่าจับตา', en: 'Promising', color: '#A855F7' },
  need_attention: { th: 'ต้องดูแล', en: 'Need Attention', color: '#F97316' },
};

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

    // Fetch customers with their transaction data
    const { data: customers } = await adminClient
      .from('customers')
      .select('id, full_name, phone, created_at')
      .eq('clinic_id', staff.clinic_id);

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        data: { segments: {}, customers: [], summary: { total: 0 } },
      });
    }

    // Fetch transactions for these customers
    const customerIds = customers.map(c => c.id);
    const { data: transactions } = await adminClient
      .from('pos_transactions')
      .select('customer_id, total_amount, created_at')
      .in('customer_id', customerIds)
      .eq('payment_status', 'paid');

    // Build customer transaction map
    const txMap: Record<string, { amounts: number[]; dates: string[] }> = {};
    (transactions || []).forEach((tx: any) => {
      if (!txMap[tx.customer_id]) txMap[tx.customer_id] = { amounts: [], dates: [] };
      txMap[tx.customer_id].amounts.push(tx.total_amount || 0);
      txMap[tx.customer_id].dates.push(tx.created_at);
    });

    const now = Date.now();

    // Calculate RFM values
    const rfmData: { recencyDays: number; frequency: number; monetary: number; customer: any }[] = [];

    customers.forEach((c: any) => {
      const tx = txMap[c.id];
      const dates = tx?.dates || [];
      const amounts = tx?.amounts || [];

      const lastDate = dates.length > 0
        ? Math.max(...dates.map(d => new Date(d).getTime()))
        : new Date(c.created_at).getTime();

      rfmData.push({
        recencyDays: Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)),
        frequency: dates.length,
        monetary: amounts.reduce((s, a) => s + a, 0),
        customer: c,
      });
    });

    // Calculate quintiles for scoring (1-5)
    const recencies = rfmData.map(r => r.recencyDays).sort((a, b) => a - b);
    const frequencies = rfmData.map(r => r.frequency).sort((a, b) => a - b);
    const monetaries = rfmData.map(r => r.monetary).sort((a, b) => a - b);

    function quintile(arr: number[], val: number, inverse = false): number {
      if (arr.length === 0) return 3;
      const idx = arr.indexOf(val);
      const pct = idx / Math.max(arr.length - 1, 1);
      const score = Math.ceil(pct * 5) || 1;
      return inverse ? 6 - score : score;
    }

    const results: RFMScore[] = rfmData.map(r => {
      const rScore = quintile(recencies, r.recencyDays, true); // lower recency = higher score
      const fScore = quintile(frequencies, r.frequency);
      const mScore = quintile(monetaries, r.monetary);
      const segment = getSegment(rScore, fScore, mScore);

      return {
        customerId: r.customer.id,
        fullName: r.customer.full_name,
        phone: r.customer.phone,
        recency: rScore,
        frequency: fScore,
        monetary: mScore,
        rfmScore: `${rScore}${fScore}${mScore}`,
        segment,
        lastVisit: r.recencyDays < 36500 ? new Date(now - r.recencyDays * 86400000).toISOString() : null,
        totalSpent: r.monetary,
        visitCount: r.frequency,
      };
    });

    // Group by segment
    const segments: Record<string, { label: any; count: number; customers: RFMScore[] }> = {};
    results.forEach(r => {
      if (!segments[r.segment]) {
        segments[r.segment] = {
          label: SEGMENT_LABELS[r.segment] || { th: r.segment, en: r.segment, color: '#999' },
          count: 0,
          customers: [],
        };
      }
      segments[r.segment].count++;
      segments[r.segment].customers.push(r);
    });

    return NextResponse.json({
      success: true,
      data: {
        segments,
        summary: {
          total: results.length,
          segmentCounts: Object.entries(segments).map(([k, v]) => ({
            segment: k,
            ...v.label,
            count: v.count,
            percentage: Math.round((v.count / results.length) * 100),
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('[CRM Segmentation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
