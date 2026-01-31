'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalysisRedirect() {
  const router = useRouter();

  useEffect(() => {
    // นำทางไปยังหน้า Sales Dashboard พร้อมข้อความแจ้งเตือน
    router.replace('/sales?message=analysis_moved');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">กำลังนำทางไปยังหน้าวิเคราะห์ผิว...</p>
        <p className="text-sm text-muted-foreground">ระบบวิเคราะห์ผิวได้ย้ายไปยัง Sales Dashboard</p>
      </div>
    </div>
  );
}
