import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/analysis/reportGenerator';
import { SkinAnalysisService } from '@/lib/analysis/skinAnalysisService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const format = searchParams.get('format') || 'html';
    const customerName = searchParams.get('customerName') || 'ลูกค้า';

    // If analysisId provided, fetch from database
    let analysisData = null;
    if (analysisId) {
      analysisData = await SkinAnalysisService.getAnalysis(analysisId);
    }

    // Prepare report data
    const reportData = ReportGenerator.prepareReportData(
      analysisData || {},
      analysisData?.customer?.full_name || customerName
    );

    // Generate HTML report
    const html = ReportGenerator.generateHTML(reportData);

    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Return JSON with HTML
    return NextResponse.json({
      success: true,
      data: {
        html,
        reportData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisData, customerName, customerAge } = body;

    if (!analysisData) {
      return NextResponse.json(
        { error: 'analysisData is required' },
        { status: 400 }
      );
    }

    // Build report data from provided analysis
    const reportData = {
      analysisId: analysisData.id || `RPT-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      customerName: customerName || 'ลูกค้า',
      customerAge: customerAge || 35,
      clinicName: 'BN-Aura Clinic',
      
      overallScore: analysisData.skinMetrics?.overallScore || 72,
      skinAge: analysisData.skinMetrics?.skinAge || 38,
      skinAgeDifference: (analysisData.skinMetrics?.skinAge || 38) - (customerAge || 35),
      skinHealthGrade: analysisData.skinMetrics?.overallScore >= 80 ? 'A' :
                       analysisData.skinMetrics?.overallScore >= 60 ? 'B' :
                       analysisData.skinMetrics?.overallScore >= 40 ? 'C' : 'D',
      
      symmetryScore: analysisData.symmetry?.overallSymmetry || 87,
      goldenRatio: analysisData.symmetry?.goldenRatio || 1.58,
      
      metrics: analysisData.skinMetrics?.metrics || [
        { id: 'spots', name: 'Spots', nameThai: 'จุดด่างดำ', score: 65 },
        { id: 'wrinkles', name: 'Wrinkles', nameThai: 'ริ้วรอย', score: 58 },
        { id: 'texture', name: 'Texture', nameThai: 'เนื้อผิว', score: 75 },
        { id: 'pores', name: 'Pores', nameThai: 'รูขุมขน', score: 52 },
        { id: 'uvSpots', name: 'UV Spots', nameThai: 'จุด UV', score: 70 },
        { id: 'brownSpots', name: 'Brown Spots', nameThai: 'ฝ้า/กระ', score: 55 },
        { id: 'redAreas', name: 'Red Areas', nameThai: 'จุดแดง', score: 80 },
        { id: 'porphyrins', name: 'Porphyrins', nameThai: 'แบคทีเรีย', score: 85 },
      ],
      
      wrinkleLevel: analysisData.wrinkleAnalysis?.overallAgingLevel || 6.2,
      wrinkleZones: analysisData.wrinkleAnalysis?.zones?.map((z: any) => ({
        name: z.name,
        nameThai: z.nameThai,
        level: z.agingLevel,
      })) || [
        { name: 'Forehead', nameThai: 'หน้าผาก', level: 5 },
        { name: 'Glabellar', nameThai: 'ระหว่างคิ้ว', level: 6 },
        { name: 'Crow\'s Feet', nameThai: 'ตีนกา', level: 7 },
        { name: 'Under Eye', nameThai: 'ใต้ตา', level: 5 },
        { name: 'Nasolabial', nameThai: 'ร่องแก้ม', level: 8 },
        { name: 'Marionette', nameThai: 'มุมปาก', level: 6 },
        { name: 'Neck', nameThai: 'คอ', level: 4 },
      ],
      
      recommendations: analysisData.skinMetrics?.summary?.priorityTreatments || [
        'Laser Toning - ลดฝ้า กระ จุดด่างดำ',
        'HydraFacial - เพิ่มความชุ่มชื้น',
        'Botox - ลดริ้วรอย',
      ],
      
      strengths: analysisData.skinMetrics?.summary?.strengths || [
        'ผิวมีสุขภาพดี',
        'ไม่มีปัญหาแบคทีเรีย',
      ],
      
      concerns: analysisData.skinMetrics?.summary?.concerns || [
        'รูขุมขนกว้าง',
        'มีริ้วรอย',
      ],
    };

    const html = ReportGenerator.generateHTML(reportData);

    return NextResponse.json({
      success: true,
      data: {
        html,
        reportData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Report generation POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
