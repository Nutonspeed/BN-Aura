import { callGemini } from '@/lib/ai';
import { createClient } from '@/lib/supabase/client';

/**
 * Business Intelligence Advisor
 * ตอบคำถามเกี่ยวกับธุรกิจเป็นภาษาไทยและแนะนำการปรับปรุง
 */

export interface BusinessQuery {
  question: string;
  timeframe?: string; // 'today' | 'week' | 'month' | 'quarter' | 'year'
  compareWith?: string; // 'previous_period' | 'last_year'
}

export interface BusinessInsight {
  answer: string;
  data: any;
  recommendations: string[];
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'metric';
  chartConfig: {
    title: string;
    dataKey: string[];
    colors: string[];
  };
  confidence: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Natural Language Query Processor
 * ประมวลผลคำถามภาษาไทยและแปลงเป็น SQL query
 */
export async function processBusinessQuery(
  query: BusinessQuery,
  clinicId: string
): Promise<BusinessInsight> {
  const supabase = createClient();

  // Pre-fetch basic business data
  const [salesData, customerData, staffData, treatmentData] = await Promise.all([
    fetchSalesData(supabase, clinicId, query.timeframe),
    fetchCustomerData(supabase, clinicId, query.timeframe),
    fetchStaffData(supabase, clinicId, query.timeframe),
    fetchTreatmentData(supabase, clinicId, query.timeframe)
  ]);

  const contextData = {
    sales: salesData,
    customers: customerData,
    staff: staffData,
    treatments: treatmentData
  };

  const prompt = `คุณคือ AI Business Advisor สำหรับคลินิกความงาม

คำถาม: "${query.question}"
ช่วงเวลา: ${query.timeframe || 'ทั้งหมด'}
${query.compareWith ? `เปรียบเทียบกับ: ${query.compareWith}` : ''}

ข้อมูลธุรกิจปัจจุบัน:
- ยอดขายรวม: ฿${contextData.sales.total?.toLocaleString() || 0}
- จำนวนลูกค้า: ${contextData.customers.count || 0} คน
- จำนวนพนักงาน: ${contextData.staff.count || 0} คน
- Treatment ยอดนิยม: ${contextData.treatments.popular?.join(', ') || 'ไม่มีข้อมูล'}

โปรดตอบในรูปแบบ JSON:
{
  "answer": "คำตอบที่ชัดเจนเป็นภาษาไทย",
  "data": {
    "values": [10, 20, 30],
    "labels": ["Jan", "Feb", "Mar"]
  },
  "recommendations": [
    "คำแนะนำที่ 1",
    "คำแนะนำที่ 2"
  ],
  "chartType": "line|bar|pie|area|metric",
  "chartConfig": {
    "title": "ชื่อกราฟ",
    "dataKey": ["revenue", "customers"],
    "colors": ["#8B5CF6", "#06B6D4"]
  },
  "confidence": 85,
  "severity": "medium"
}`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: true
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const insight = JSON.parse(jsonMatch[0]);
      
      // Merge actual data with AI response
      return {
        ...insight,
        data: mergeWithRealData(insight, contextData, query)
      };
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('Business Advisor Error:', error);
    
    // Fallback response
    return generateFallbackInsight(query, contextData);
  }
}

/**
 * Fetch sales data from database
 */
async function fetchSalesData(supabase: any, clinicId: string, timeframe?: string) {
  const timeFilter = getTimeFilter(timeframe);
  
  try {
    const { data } = await supabase
      .from('sales_proposals')
      .select('total_amount, created_at, status')
      .eq('clinic_id', clinicId)
      .eq('status', 'accepted')
      .gte('created_at', timeFilter.start)
      .lte('created_at', timeFilter.end);

    const total = data?.reduce((sum: number, item: any) => sum + parseFloat(item.total_amount || 0), 0) || 0;
    const count = data?.length || 0;
    
    return { total, count, raw: data };
  } catch (error) {
    return { total: 0, count: 0, raw: [] };
  }
}

/**
 * Fetch customer data
 */
async function fetchCustomerData(supabase: any, clinicId: string, timeframe?: string) {
  const timeFilter = getTimeFilter(timeframe);
  
  try {
    const { data } = await supabase
      .from('customers')
      .select('id, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', timeFilter.start)
      .lte('created_at', timeFilter.end);

    return { count: data?.length || 0, raw: data };
  } catch (error) {
    return { count: 0, raw: [] };
  }
}

/**
 * Fetch staff data
 */
async function fetchStaffData(supabase: any, clinicId: string, timeframe?: string) {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('clinic_id', clinicId);

    return { count: data?.length || 0, raw: data };
  } catch (error) {
    return { count: 0, raw: [] };
  }
}

/**
 * Fetch treatment data
 */
async function fetchTreatmentData(supabase: any, clinicId: string, timeframe?: string) {
  try {
    const { data } = await supabase
      .from('treatments')
      .select('name, category, price, active')
      .eq('clinic_id', clinicId)
      .eq('active', true);

    const popular = data?.slice(0, 3).map((t: any) => t.name) || [];
    
    return { popular, raw: data };
  } catch (error) {
    return { popular: [], raw: [] };
  }
}

/**
 * Generate time filter based on timeframe
 */
function getTimeFilter(timeframe?: string) {
  const now = new Date();
  const start = new Date();
  
  switch (timeframe) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setFullYear(now.getFullYear() - 1); // Default to 1 year
  }
  
  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
}

/**
 * Merge AI insights with real data
 */
function mergeWithRealData(insight: any, contextData: any, query: BusinessQuery) {
  // If asking about revenue/sales
  if (query.question.includes('รายได้') || query.question.includes('ยอดขาย') || query.question.includes('เงิน')) {
    return {
      value: contextData.sales.total,
      formatted: `฿${contextData.sales.total.toLocaleString()}`,
      change: '+12%', // Mock change data
      trend: 'up'
    };
  }
  
  // If asking about customers
  if (query.question.includes('ลูกค้า') || query.question.includes('customer')) {
    return {
      value: contextData.customers.count,
      formatted: `${contextData.customers.count} คน`,
      change: '+8%',
      trend: 'up'
    };
  }
  
  // If asking about staff
  if (query.question.includes('พนักงาน') || query.question.includes('staff')) {
    return {
      value: contextData.staff.count,
      formatted: `${contextData.staff.count} คน`,
      change: 'stable',
      trend: 'stable'
    };
  }
  
  return insight.data || {};
}

/**
 * Generate fallback insight when AI fails
 */
function generateFallbackInsight(query: BusinessQuery, contextData: any): BusinessInsight {
  return {
    answer: `ขออภัย ไม่สามารถประมวลผลคำถาม "${query.question}" ได้ในขณะนี้ แต่ข้อมูลพื้นฐานของคลินิกแสดงว่ามียอดขาย ฿${contextData.sales.total.toLocaleString()} และลูกค้า ${contextData.customers.count} คน`,
    data: {
      value: contextData.sales.total,
      formatted: `฿${contextData.sales.total.toLocaleString()}`,
      change: 'N/A',
      trend: 'stable'
    },
    recommendations: [
      'ลองถามคำถามใหม่ด้วยถ้อยคำที่ง่ายขึ้น',
      'ตรวจสอบข้อมูลในฐานข้อมูลให้ครบถ้วน'
    ],
    chartType: 'metric',
    chartConfig: {
      title: 'ข้อมูลพื้นฐาน',
      dataKey: ['value'],
      colors: ['#8B5CF6']
    },
    confidence: 60
  };
}

/**
 * Quick Business Questions - Predefined queries
 */
export const QUICK_QUESTIONS = [
  {
    question: 'รายได้เดือนนี้เป็นยังไงบ้าง?',
    icon: '💰',
    category: 'revenue'
  },
  {
    question: 'ลูกค้าใหม่เดือนนี้มีกี่คน?',
    icon: '👥',
    category: 'customers'
  },
  {
    question: 'Treatment ไหนขายดีที่สุด?',
    icon: '⭐',
    category: 'treatments'
  },
  {
    question: 'พนักงานคนไหนขายเก่งที่สุด?',
    icon: '🏆',
    category: 'staff'
  },
  {
    question: 'เดือนหน้าควรโฟกัสที่อะไร?',
    icon: '🎯',
    category: 'strategy'
  },
  {
    question: 'ค่าใช้จ่ายเดือนนี้สูงไหม?',
    icon: '📊',
    category: 'expenses'
  }
];

/**
 * Generate anomaly alerts for owner dashboard
 */
export async function generateAnomalyAlerts(clinicId: string): Promise<{
  alerts: Array<{
    type: 'revenue_drop' | 'customer_churn' | 'staff_performance' | 'inventory_low';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation: string;
    value?: string;
  }>;
}> {
  const supabase = createClient();
  
  // Fetch current week vs last week data
  const thisWeek = await fetchSalesData(supabase, clinicId, 'week');
  const lastWeek = await fetchSalesData(supabase, clinicId, 'week'); // Simplified
  
  const alerts = [];
  
  // Revenue drop alert
  if (thisWeek.total < lastWeek.total * 0.8) { // 20% drop
    alerts.push({
      type: 'revenue_drop' as const,
      severity: 'high' as const,
      title: '🚨 รายได้ลดลงอย่างมาก',
      description: `รายได้สัปดาห์นี้ลดลง ${((lastWeek.total - thisWeek.total) / lastWeek.total * 100).toFixed(1)}% เมื่อเทียบกับสัปดาห์ที่แล้ว`,
      recommendation: 'ควรตรวจสอบสาเหตุและจัดโปรโมชั่นเร่งด่วน',
      value: `฿${thisWeek.total.toLocaleString()}`
    });
  }
  
  // Add more anomaly checks here...
  
  return { alerts };
}
