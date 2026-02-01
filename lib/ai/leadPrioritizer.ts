import { createClient } from '@/lib/supabase/client';
import { callGemini } from '@/lib/ai';

/**
 * Smart Lead Prioritization Engine
 * จัดลำดับความสำคัญของ Leads ด้วย AI
 */

export interface LeadData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skinAnalysis?: {
    urgencyScore: number;
    concerns: string[];
    ageEstimate: number;
  };
  lastContact?: Date;
  responseRate?: number;
  budget?: string;
  source?: string;
}

export interface PrioritizedLead extends LeadData {
  priorityScore: number;
  priorityLevel: 'hot' | 'warm' | 'cold';
  bestContactTime?: string;
  recommendedAction: string;
  reasoning: string[];
}

/**
 * คำนวณ Priority Score จากหลายปัจจัย
 */
export function calculateLeadPriority(lead: LeadData): {
  score: number;
  level: 'hot' | 'warm' | 'cold';
  factors: Array<{ name: string; score: number; weight: number }>;
} {
  const factors: Array<{ name: string; score: number; weight: number }> = [];
  let totalScore = 0;
  let totalWeight = 0;

  // 1. Urgency Score (น้ำหนัก 35%)
  if (lead.skinAnalysis?.urgencyScore) {
    const urgencyScore = lead.skinAnalysis.urgencyScore;
    factors.push({ name: 'ความเร่งด่วนของปัญหา', score: urgencyScore, weight: 35 });
    totalScore += urgencyScore * 0.35;
    totalWeight += 35;
  }

  // 2. Recency (น้ำหนัก 25%)
  if (lead.lastContact) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24)
    );
    let recencyScore = 100;
    if (daysSinceContact > 7) recencyScore = 50;
    if (daysSinceContact > 14) recencyScore = 20;
    if (daysSinceContact > 30) recencyScore = 10;
    
    factors.push({ name: 'ความใหม่ของการติดต่อ', score: recencyScore, weight: 25 });
    totalScore += recencyScore * 0.25;
    totalWeight += 25;
  }

  // 3. Response Rate (น้ำหนัก 20%)
  if (lead.responseRate !== undefined) {
    const responseScore = lead.responseRate * 100;
    factors.push({ name: 'อัตราการตอบกลับ', score: responseScore, weight: 20 });
    totalScore += responseScore * 0.20;
    totalWeight += 20;
  }

  // 4. Budget Clarity (น้ำหนัก 10%)
  if (lead.budget && lead.budget !== 'ไม่ระบุ') {
    factors.push({ name: 'ระบุงบประมาณชัดเจน', score: 100, weight: 10 });
    totalScore += 100 * 0.10;
    totalWeight += 10;
  }

  // 5. Contact Info Completeness (น้ำหนัก 10%)
  let contactScore = 0;
  if (lead.email) contactScore += 50;
  if (lead.phone) contactScore += 50;
  factors.push({ name: 'ความครบถ้วนของข้อมูลติดต่อ', score: contactScore, weight: 10 });
  totalScore += contactScore * 0.10;
  totalWeight += 10;

  // Normalize score
  const finalScore = totalWeight > 0 ? Math.round(totalScore) : 0;

  // Determine level
  let level: 'hot' | 'warm' | 'cold' = 'cold';
  if (finalScore >= 70) level = 'hot';
  else if (finalScore >= 40) level = 'warm';

  return { score: finalScore, level, factors };
}

/**
 * AI-powered Best Contact Time Prediction
 */
export async function predictBestContactTime(
  lead: LeadData,
  clinicId: string
): Promise<string> {
  const prompt = `วิเคราะห์เวลาที่เหมาะสมในการติดต่อลูกค้า

ข้อมูลลูกค้า:
- ชื่อ: ${lead.name}
- อายุประมาณ: ${lead.skinAnalysis?.ageEstimate || 'ไม่ระบุ'} ปี
- ปัญหาผิว: ${lead.skinAnalysis?.concerns.join(', ') || 'ไม่ระบุ'}
- แหล่งที่มา: ${lead.source || 'ไม่ระบุ'}
${lead.lastContact ? `- ติดต่อล่าสุด: ${new Date(lead.lastContact).toLocaleDateString('th-TH')}` : ''}

โปรดแนะนำเวลาที่เหมาะสมในการติดต่อ (วัน + ช่วงเวลา) พร้อมเหตุผล
ตอบแบบสั้นกระชับ เช่น "วันจันทร์-ศุกร์ 10:00-12:00 น. (เวลาทำงาน หลังเช้า)"`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: true
    });
    return response.trim();
  } catch (error) {
    console.error('Best Contact Time Prediction Error:', error);
    return 'วันจันทร์-ศุกร์ 10:00-16:00 น.';
  }
}

/**
 * Generate Personalized Action Recommendation
 */
export async function generateActionRecommendation(
  lead: LeadData,
  priorityScore: number,
  clinicId: string
): Promise<string> {
  const prompt = `คุณคือผู้เชี่ยวชาญด้าน Sales Strategy

ข้อมูล Lead:
- Priority Score: ${priorityScore}/100
- ปัญหาผิว: ${lead.skinAnalysis?.concerns.join(', ') || 'ไม่ระบุ'}
- ความเร่งด่วน: ${lead.skinAnalysis?.urgencyScore || 0}/100
${lead.lastContact ? `- ติดต่อล่าสุด: ${Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24))} วันที่แล้ว` : ''}

แนะนำ Action ที่เหมาะสมในการติดตาม Lead นี้ (1 ประโยคสั้นๆ)
เช่น "โทรติดตามทันที พร้อมเสนอโปรโมชั่นพิเศษ" หรือ "ส่ง LINE message พร้อมผลสแกนผิว"`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: true
    });
    return response.trim();
  } catch (error) {
    console.error('Action Recommendation Error:', error);
    return 'ติดตามผ่านช่องทางที่ลูกค้าสะดวก';
  }
}

/**
 * Prioritize Multiple Leads
 */
export async function prioritizeLeads(
  leads: LeadData[],
  clinicId: string
): Promise<PrioritizedLead[]> {
  const prioritizedLeads: PrioritizedLead[] = [];

  for (const lead of leads) {
    const { score, level, factors } = calculateLeadPriority(lead);
    
    // Generate AI recommendations
    const [bestContactTime, recommendedAction] = await Promise.all([
      predictBestContactTime(lead, clinicId),
      generateActionRecommendation(lead, score, clinicId)
    ]);

    prioritizedLeads.push({
      ...lead,
      priorityScore: score,
      priorityLevel: level,
      bestContactTime,
      recommendedAction,
      reasoning: factors.map(f => `${f.name}: ${f.score}/${f.weight}`)
    });
  }

  // Sort by priority score (highest first)
  return prioritizedLeads.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get Hot Leads Alert
 */
export async function getHotLeadsAlert(clinicId: string): Promise<{
  count: number;
  leads: PrioritizedLead[];
  message: string;
}> {
  const supabase = createClient();

  // ดึง leads ที่ยังไม่ได้ติดตาม
  const { data: leadsData } = await supabase
    .from('lead_scoring_data')
    .select('*')
    .eq('clinic_id', clinicId)
    .gte('overall_score', 70)
    .order('overall_score', { ascending: false })
    .limit(10);

  if (!leadsData || leadsData.length === 0) {
    return {
      count: 0,
      leads: [],
      message: 'ไม่มี Hot Leads ในขณะนี้'
    };
  }

  // Convert to LeadData format
  const leads: LeadData[] = leadsData.map(l => ({
    id: l.id,
    name: l.customer_name,
    email: l.customer_email,
    phone: l.customer_phone,
    skinAnalysis: {
      urgencyScore: l.overall_score,
      concerns: l.metadata?.concerns || [],
      ageEstimate: l.metadata?.ageEstimate || 0
    },
    lastContact: l.created_at ? new Date(l.created_at) : undefined
  }));

  const prioritized = await prioritizeLeads(leads, clinicId);
  const hotLeads = prioritized.filter(l => l.priorityLevel === 'hot');

  return {
    count: hotLeads.length,
    leads: hotLeads,
    message: `🔥 มี ${hotLeads.length} Hot Leads ที่ควรติดตามทันที!`
  };
}

/**
 * Auto-assign Leads to Sales Staff
 */
export async function autoAssignLeads(
  leads: LeadData[],
  clinicId: string
): Promise<Map<string, LeadData[]>> {
  const supabase = createClient();

  // ดึงข้อมูล sales staff
  const { data: salesStaff } = await supabase
    .from('users')
    .select('id, full_name, metadata')
    .eq('clinic_id', clinicId)
    .eq('role', 'premium_customer')
    .eq('metadata->>role', 'sales_staff');

  if (!salesStaff || salesStaff.length === 0) {
    return new Map();
  }

  // จัดลำดับ leads
  const prioritized = await prioritizeLeads(leads, clinicId);

  // Round-robin assignment (แบบง่าย)
  const assignments = new Map<string, LeadData[]>();
  
  prioritized.forEach((lead, index) => {
    const staffIndex = index % salesStaff.length;
    const staffId = salesStaff[staffIndex].id;
    
    if (!assignments.has(staffId)) {
      assignments.set(staffId, []);
    }
    assignments.get(staffId)!.push(lead);
  });

  return assignments;
}
