/**
 * Mobile Analysis Dashboard
 * Sales Rep dashboard for on-the-go skin analysis
 * Key differentiator vs VISIA: Mobility
 */

interface MobileDashboardStats {
  salesRepId: string;
  today: { analyses: number; leads: number; appointments: number; revenue: number };
  thisWeek: { analyses: number; leads: number; appointments: number; revenue: number };
  thisMonth: { analyses: number; leads: number; appointments: number; revenue: number };
  pendingFollowups: number;
  upcomingAppointments: number;
}

interface FieldVisit {
  visitId: string;
  customerId: string;
  customerName: string;
  location: string;
  scheduledTime: string;
  purpose: 'initial_analysis' | 'followup' | 'treatment_check' | 'sales_pitch';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  analysisId?: string;
  notes?: string;
}

interface QuickAction {
  actionId: string;
  icon: string;
  label: string;
  description: string;
}

class MobileAnalysisDashboard {
  
  static getDashboardStats(salesRepId: string): MobileDashboardStats {
    return {
      salesRepId,
      today: { analyses: 3, leads: 2, appointments: 4, revenue: 28500 },
      thisWeek: { analyses: 18, leads: 12, appointments: 22, revenue: 185000 },
      thisMonth: { analyses: 65, leads: 42, appointments: 78, revenue: 625000 },
      pendingFollowups: 8,
      upcomingAppointments: 5
    };
  }

  static getTodaySchedule(salesRepId: string): FieldVisit[] {
    return [
      { visitId: 'V-001', customerId: 'CUST-101', customerName: 'คุณมาลี ศรีสุข', location: 'Siam Paragon, Starbucks', scheduledTime: '10:00', purpose: 'initial_analysis', status: 'completed', analysisId: 'ANL-001' },
      { visitId: 'V-002', customerId: 'CUST-102', customerName: 'คุณนภา วงศ์สกุล', location: 'Central World, Floor 4', scheduledTime: '13:00', purpose: 'followup', status: 'in_progress' },
      { visitId: 'V-003', customerId: 'CUST-103', customerName: 'คุณพิมพ์ใจ อารีย์', location: 'EmQuartier, Café Amazon', scheduledTime: '15:30', purpose: 'treatment_check', status: 'scheduled' },
      { visitId: 'V-004', customerId: 'NEW', customerName: 'Lead จาก Line OA', location: 'Thonglor, TBC', scheduledTime: '17:00', purpose: 'sales_pitch', status: 'scheduled' }
    ];
  }

  static getQuickActions(): QuickAction[] {
    return [
      { actionId: 'QA-001', icon: '📸', label: 'วิเคราะห์ผิวหน้า', description: 'ถ่ายภาพและวิเคราะห์ด้วย AI' },
      { actionId: 'QA-002', icon: '👤', label: 'สร้างลูกค้าใหม่', description: 'ลงทะเบียนลูกค้าใหม่' },
      { actionId: 'QA-003', icon: '📅', label: 'นัดหมาย', description: 'นัด treatment ที่คลินิก' },
      { actionId: 'QA-004', icon: '📊', label: 'ประวัติการวิเคราะห์', description: 'ดูผลวิเคราะห์ย้อนหลัง' },
      { actionId: 'QA-005', icon: '💬', label: 'ส่งผลให้ลูกค้า', description: 'แชร์ผลผ่าน Line/Email' },
      { actionId: 'QA-006', icon: '💰', label: 'ค่าคอมมิชชั่น', description: 'ดูรายได้และสถานะ' }
    ];
  }

  static getAnalysisWorkflow(): any {
    return {
      steps: [
        { step: 1, action: 'ถ่ายภาพใบหน้าลูกค้า', tips: ['แสงธรรมชาติ', 'ไม่แต่งหน้า', '3 มุม: หน้าตรง, ซ้าย, ขวา'] },
        { step: 2, action: 'AI วิเคราะห์อัตโนมัติ', time: '~3 วินาที' },
        { step: 3, action: 'ตรวจสอบและปรับผล', tips: ['เพิ่มหมายเหตุ', 'เลือกปัญหาหลัก'] },
        { step: 4, action: 'แนะนำ Treatment', auto: 'ระบบแนะนำอัตโนมัติตามผลวิเคราะห์' },
        { step: 5, action: 'นัดหมายที่คลินิก', integration: 'เชื่อมต่อกับระบบจองอัตโนมัติ' },
        { step: 6, action: 'ส่งสรุปให้ลูกค้า', channels: ['Line', 'Email', 'SMS'] }
      ]
    };
  }

  static getMobilityAdvantage(): any {
    return {
      headline: 'ความได้เปรียบเหนือ VISIA',
      comparison: [
        { feature: 'สถานที่วิเคราะห์', visia: 'เฉพาะในคลินิก', bnAura: 'ทุกที่ที่มีมือถือ' },
        { feature: 'การเข้าถึงลูกค้า', visia: 'รอลูกค้ามา', bnAura: 'ไปหาลูกค้าได้' },
        { feature: 'ต้นทุนอุปกรณ์', visia: '500K-2M THB', bnAura: 'มือถือทั่วไป' },
        { feature: 'การติดตามผล', visia: 'ต้องกลับมาคลินิก', bnAura: 'ติดตามที่ไหนก็ได้' },
        { feature: 'การปิดการขาย', visia: 'หลังวิเคราะห์ที่คลินิก', bnAura: 'ปิดได้ทันทีนอกสถานที่' }
      ],
      salesBenefits: ['เพิ่ม Lead 3x', 'ปิดการขายเร็วขึ้น 2x', 'Follow-up ได้ทุกที่', 'ลูกค้าประทับใจบริการ']
    };
  }
}

export { MobileAnalysisDashboard, type MobileDashboardStats, type FieldVisit };
