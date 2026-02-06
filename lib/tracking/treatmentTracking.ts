/**
 * Treatment Tracking & Follow-up System
 * Track customer progress after treatments
 * Compare before/after with AI analysis
 */

interface TreatmentRecord {
  recordId: string;
  customerId: string;
  salesRepId: string;
  clinicId: string;
  treatmentName: string;
  treatmentDate: string;
  beforeAnalysisId: string;
  afterAnalysisId?: string;
  targetConditions: string[];
  status: 'scheduled' | 'completed' | 'followup_pending' | 'followup_done';
  improvementScore?: number;
}

interface ProgressComparison {
  customerId: string;
  treatmentId: string;
  before: { skinScore: number; conditions: any[]; date: string };
  after: { skinScore: number; conditions: any[]; date: string };
  improvement: { overall: number; byCondition: any[] };
  recommendation: string;
}

interface FollowupSchedule {
  followupId: string;
  customerId: string;
  customerName: string;
  salesRepId: string;
  treatmentRecordId: string;
  scheduledDate: string;
  daysSinceTreatment: number;
  purpose: 'check_results' | 'upsell' | 'maintenance';
  status: 'pending' | 'completed' | 'rescheduled';
}

class TreatmentTracking {
  
  static getTreatmentRecords(customerId: string): TreatmentRecord[] {
    return [
      { recordId: 'TR-001', customerId: 'CUST-001', salesRepId: 'SALES-001', clinicId: 'CLINIC-001', treatmentName: 'Laser Toning', treatmentDate: '2025-01-15', beforeAnalysisId: 'ANL-100', afterAnalysisId: 'ANL-105', targetConditions: ['Melasma', 'Pigmentation'], status: 'followup_done', improvementScore: 65 },
      { recordId: 'TR-002', customerId: 'CUST-001', salesRepId: 'SALES-001', clinicId: 'CLINIC-001', treatmentName: 'Hydrafacial', treatmentDate: '2025-01-22', beforeAnalysisId: 'ANL-105', afterAnalysisId: 'ANL-108', targetConditions: ['Dehydration', 'Dullness'], status: 'followup_done', improvementScore: 82 },
      { recordId: 'TR-003', customerId: 'CUST-001', salesRepId: 'SALES-001', clinicId: 'CLINIC-001', treatmentName: 'Carbon Peel', treatmentDate: '2025-02-01', beforeAnalysisId: 'ANL-108', targetConditions: ['Large Pores', 'Oiliness'], status: 'followup_pending' }
    ];
  }

  static getProgressComparison(treatmentRecordId: string): ProgressComparison {
    return {
      customerId: 'CUST-001',
      treatmentId: 'TR-001',
      before: { skinScore: 62, conditions: [{ name: 'Melasma', severity: 55 }, { name: 'Pigmentation', severity: 45 }], date: '2025-01-15' },
      after: { skinScore: 78, conditions: [{ name: 'Melasma', severity: 25 }, { name: 'Pigmentation', severity: 18 }], date: '2025-01-29' },
      improvement: { overall: 26, byCondition: [{ name: 'Melasma', improvement: 55 }, { name: 'Pigmentation', improvement: 60 }] },
      recommendation: 'ดีมาก! แนะนำทำ Laser Toning ต่ออีก 2 ครั้งเพื่อผลลัพธ์ถาวร'
    };
  }

  static getFollowupSchedule(salesRepId: string): FollowupSchedule[] {
    return [
      { followupId: 'FU-001', customerId: 'CUST-001', customerName: 'คุณปิยะดา', salesRepId: 'SALES-001', treatmentRecordId: 'TR-003', scheduledDate: '2025-02-08', daysSinceTreatment: 7, purpose: 'check_results', status: 'pending' },
      { followupId: 'FU-002', customerId: 'CUST-002', customerName: 'คุณอารยา', salesRepId: 'SALES-001', treatmentRecordId: 'TR-010', scheduledDate: '2025-02-10', daysSinceTreatment: 14, purpose: 'upsell', status: 'pending' },
      { followupId: 'FU-003', customerId: 'CUST-005', customerName: 'คุณวิภาวี', salesRepId: 'SALES-001', treatmentRecordId: 'TR-008', scheduledDate: '2025-02-15', daysSinceTreatment: 30, purpose: 'maintenance', status: 'pending' }
    ];
  }

  static getFollowupProtocol(): any {
    return {
      timeline: [
        { day: 3, action: 'ส่งข้อความสอบถามอาการ', channel: 'Line' },
        { day: 7, action: 'วิเคราะห์ผิวหลังทำ (ครั้งที่ 1)', type: 'analysis' },
        { day: 14, action: 'นัดตรวจผลลัพธ์ + แนะนำ Treatment ต่อ', type: 'meeting' },
        { day: 30, action: 'วิเคราะห์ผิวหลังทำ (ครั้งที่ 2)', type: 'analysis' },
        { day: 60, action: 'เสนอ Maintenance Program', type: 'upsell' }
      ],
      automations: ['แจ้งเตือนเซลอัตโนมัติ', 'ส่ง Line ลูกค้าอัตโนมัติ', 'สร้างรายงานเปรียบเทียบอัตโนมัติ']
    };
  }

  static getTrackingMetrics(): any {
    return {
      totalTreatments: 245,
      completedFollowups: 198,
      followupRate: 81,
      avgImprovement: 58,
      repeatTreatmentRate: 72,
      customerSatisfaction: 4.6
    };
  }
}

export { TreatmentTracking, type TreatmentRecord, type ProgressComparison, type FollowupSchedule };
