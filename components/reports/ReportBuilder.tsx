'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Download, Calendar, Filter, BarChart3, 
  Users, DollarSign, Camera, ClipboardList, TrendingUp 
} from 'lucide-react';
import { reportTemplates, ReportType, DateRange, generateReport, exportReport } from '@/lib/reports/reportBuilder';

const reportIcons: Record<ReportType, React.ReactNode> = {
  sales: <DollarSign size={20} />,
  analysis: <Camera size={20} />,
  booking: <Calendar size={20} />,
  revenue: <TrendingUp size={20} />,
  staff: <Users size={20} />,
  customer: <ClipboardList size={20} />,
};

interface Props {
  clinicId: string;
}

export function ReportBuilder({ clinicId }: Props) {
  const [selectedType, setSelectedType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<{ headers: string[]; rows: (string | number)[][] } | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const config = { ...reportTemplates[selectedType], dateRange };
      const data = await generateReport(config, clinicId);
      setReportData(data);
    } catch (error) {
      console.error('Report error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!reportData) return;
    const filename = `${selectedType}-report-${Date.now()}`;
    // @ts-ignore
    await exportReport(reportData, format, filename);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.keys(reportTemplates) as ReportType[]).map((type) => (
          <Card
            key={type}
            className={`cursor-pointer transition-all ${
              selectedType === type ? 'ring-2 ring-primary' : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedType(type)}
          >
            <CardContent className="p-4 text-center">
              <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {reportIcons[type]}
              </div>
              <p className="text-sm font-medium">{reportTemplates[type].title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            ตัวกรอง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ช่วงเวลา</label>
              <div className="flex gap-2">
                {(['7d', '30d', '90d', '1y'] as DateRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={dateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange(range)}
                  >
                    {range === '7d' ? '7 วัน' : range === '30d' ? '30 วัน' : range === '90d' ? '90 วัน' : '1 ปี'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1" />
            <Button onClick={handleGenerate} disabled={isLoading}>
              <BarChart3 size={16} className="mr-2" />
              {isLoading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              {reportTemplates[selectedType].title}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download size={14} className="mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <Download size={14} className="mr-1" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {reportData.headers.map((header, i) => (
                      <th key={i} className="text-left p-3 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      {row.map((cell, j) => (
                        <td key={j} className="p-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReportBuilder;
