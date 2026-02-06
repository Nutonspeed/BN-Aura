/**
 * BN-Aura Custom Report Builder
 */

export type ReportType = 'sales' | 'analysis' | 'booking' | 'revenue' | 'staff' | 'customer';
export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface ReportConfig {
  type: ReportType;
  title: string;
  dateRange: DateRange;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, unknown>;
  columns: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportData {
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, number>;
  generatedAt: string;
}

// Report templates
export const reportTemplates: Record<ReportType, ReportConfig> = {
  sales: {
    type: 'sales',
    title: 'รายงานยอดขาย',
    dateRange: '30d',
    columns: ['วันที่', 'ลูกค้า', 'Treatment', 'ยอดเงิน', 'พนักงาน', 'สถานะ'],
    groupBy: 'date',
    sortBy: 'date',
    sortOrder: 'desc',
  },
  analysis: {
    type: 'analysis',
    title: 'รายงานการวิเคราะห์ผิว',
    dateRange: '30d',
    columns: ['วันที่', 'ลูกค้า', 'คะแนนรวม', 'อายุผิว', 'ประเภทผิว', 'Treatment แนะนำ'],
    sortBy: 'date',
    sortOrder: 'desc',
  },
  booking: {
    type: 'booking',
    title: 'รายงานการจอง',
    dateRange: '30d',
    columns: ['วันที่', 'เวลา', 'ลูกค้า', 'Treatment', 'ผู้ให้บริการ', 'สถานะ'],
    sortBy: 'date',
    sortOrder: 'asc',
  },
  revenue: {
    type: 'revenue',
    title: 'รายงานรายได้',
    dateRange: '30d',
    columns: ['วันที่', 'รายได้รวม', 'จำนวนรายการ', 'ค่าเฉลี่ย', 'เทียบเดือนก่อน'],
    groupBy: 'date',
    sortBy: 'date',
    sortOrder: 'desc',
  },
  staff: {
    type: 'staff',
    title: 'รายงานประสิทธิภาพพนักงาน',
    dateRange: '30d',
    columns: ['พนักงาน', 'ยอดขาย', 'จำนวนลูกค้า', 'คะแนนความพึงพอใจ', 'Commission'],
    sortBy: 'ยอดขาย',
    sortOrder: 'desc',
  },
  customer: {
    type: 'customer',
    title: 'รายงานลูกค้า',
    dateRange: '30d',
    columns: ['ลูกค้า', 'วันที่สมัคร', 'Treatment ล่าสุด', 'ยอดใช้จ่ายรวม', 'คะแนนผิว'],
    sortBy: 'ยอดใช้จ่ายรวม',
    sortOrder: 'desc',
  },
};

// Generate report
export async function generateReport(
  config: ReportConfig,
  clinicId: string
): Promise<ReportData> {
  const response = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, clinicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return await response.json();
}

// Export report to format
export async function exportReport(
  data: ReportData,
  format: ReportFormat,
  filename: string
): Promise<void> {
  if (format === 'csv') {
    const csv = [
      data.headers.join(','),
      ...data.rows.map(row => row.join(',')),
    ].join('\n');
    
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  } else if (format === 'excel') {
    // For Excel, we'd use a library like xlsx
    const response = await fetch('/api/reports/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename }),
    });
    
    if (response.ok) {
      const blob = await response.blob();
      downloadBlob(blob, `${filename}.xlsx`);
    }
  }
}

// Schedule recurring report
export async function scheduleReport(
  config: ReportConfig,
  clinicId: string,
  schedule: { frequency: 'daily' | 'weekly' | 'monthly'; email: string }
): Promise<boolean> {
  const response = await fetch('/api/reports/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, clinicId, schedule }),
  });

  return response.ok;
}

// Helper functions
function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Calculate date range
export function getDateRange(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { start, end };
}

export default {
  reportTemplates,
  generateReport,
  exportReport,
  scheduleReport,
  getDateRange,
};
