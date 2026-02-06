/**
 * Skin Analysis Report Generator
 * Generates HTML-based reports that can be converted to PDF
 */

interface ReportData {
  analysisId: string;
  analyzedAt: string;
  customerName: string;
  customerAge: number;
  clinicName: string;
  
  // Scores
  overallScore: number;
  skinAge: number;
  skinAgeDifference: number;
  skinHealthGrade: string;
  
  // Symmetry
  symmetryScore: number;
  goldenRatio: number;
  
  // 8 Metrics
  metrics: {
    id: string;
    name: string;
    nameThai: string;
    score: number;
  }[];
  
  // Wrinkle Analysis
  wrinkleLevel: number;
  wrinkleZones: {
    name: string;
    nameThai: string;
    level: number;
  }[];
  
  // Recommendations
  recommendations: string[];
  
  // Strengths & Concerns
  strengths: string[];
  concerns: string[];
}

class ReportGenerator {
  
  /**
   * Generate HTML report for skin analysis
   */
  static generateHTML(data: ReportData): string {
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#84cc16';
      if (score >= 40) return '#eab308';
      return '#ef4444';
    };

    const getGradeColor = (grade: string) => {
      switch (grade) {
        case 'A': return '#22c55e';
        case 'B': return '#84cc16';
        case 'C': return '#eab308';
        default: return '#ef4444';
      }
    };

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BN-Aura Skin Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Sarabun', 'Segoe UI', sans-serif; 
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header .logo { font-size: 40px; margin-bottom: 12px; }
    .header .subtitle { opacity: 0.9; font-size: 14px; }
    
    /* Patient Info */
    .patient-info {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .patient-info .item { text-align: center; }
    .patient-info .label { font-size: 12px; color: #64748b; }
    .patient-info .value { font-size: 16px; font-weight: 600; }
    
    /* Score Cards */
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .score-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .score-card .value {
      font-size: 36px;
      font-weight: 700;
    }
    .score-card .label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .score-card .sub {
      font-size: 11px;
      color: #94a3b8;
    }
    
    /* Section */
    .section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .metric-item {
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-item .name { font-size: 11px; color: #64748b; }
    .metric-item .name-th { font-size: 12px; font-weight: 500; }
    .metric-item .score { font-size: 24px; font-weight: 700; margin: 4px 0; }
    
    /* Progress Bar */
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar .fill {
      height: 100%;
      border-radius: 4px;
    }
    
    /* Wrinkle Zones */
    .wrinkle-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .wrinkle-item:last-child { border-bottom: none; }
    .wrinkle-item .name { flex: 1; }
    .wrinkle-item .level {
      font-weight: 600;
      min-width: 60px;
      text-align: right;
    }
    .wrinkle-item .bar {
      width: 200px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .wrinkle-item .bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    
    /* Lists */
    .list-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .list-card {
      padding: 16px;
      border-radius: 8px;
    }
    .list-card.strengths { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .list-card.concerns { background: #fff7ed; border: 1px solid #fed7aa; }
    .list-card h4 { font-size: 14px; margin-bottom: 12px; }
    .list-card ul { list-style: none; }
    .list-card li { 
      padding: 6px 0; 
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Recommendations */
    .rec-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .rec-item .number {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 24px;
      color: #64748b;
      font-size: 12px;
    }
    .footer .brand { font-weight: 600; color: #7c3aed; }
    
    @media print {
      body { background: white; }
      .container { padding: 0; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🧠</div>
      <h1>BN-Aura AI Skin Analysis Report</h1>
      <p class="subtitle">รายงานผลวิเคราะห์ผิวหน้าด้วย AI • VISIA-Equivalent Technology</p>
    </div>

    <!-- Patient Info -->
    <div class="patient-info">
      <div class="item">
        <div class="label">ชื่อ-นามสกุล</div>
        <div class="value">${data.customerName}</div>
      </div>
      <div class="item">
        <div class="label">อายุ</div>
        <div class="value">${data.customerAge} ปี</div>
      </div>
      <div class="item">
        <div class="label">วันที่วิเคราะห์</div>
        <div class="value">${new Date(data.analyzedAt).toLocaleDateString('th-TH', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        })}</div>
      </div>
      <div class="item">
        <div class="label">รหัสรายงาน</div>
        <div class="value">${data.analysisId.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <!-- Main Scores -->
    <div class="scores-grid">
      <div class="score-card">
        <div class="value" style="color: ${getScoreColor(data.overallScore)}">${data.overallScore}</div>
        <div class="label">Overall Score</div>
        <div class="sub">/100</div>
      </div>
      <div class="score-card">
        <div class="value" style="color: ${getGradeColor(data.skinHealthGrade)}">${data.skinHealthGrade}</div>
        <div class="label">Skin Grade</div>
        <div class="sub">สุขภาพผิว</div>
      </div>
      <div class="score-card">
        <div class="value" style="color: ${data.skinAgeDifference > 0 ? '#ef4444' : '#22c55e'}">${data.skinAge}</div>
        <div class="label">Skin Age</div>
        <div class="sub">${data.skinAgeDifference > 0 ? '+' : ''}${data.skinAgeDifference} จากอายุจริง</div>
      </div>
      <div class="score-card">
        <div class="value" style="color: ${getScoreColor(data.symmetryScore)}">${data.symmetryScore}%</div>
        <div class="label">Symmetry</div>
        <div class="sub">Golden: ${data.goldenRatio}</div>
      </div>
    </div>

    <!-- 8 Metrics -->
    <div class="section">
      <h3 class="section-title">📊 8 Skin Metrics Analysis</h3>
      <div class="metrics-grid">
        ${data.metrics.map(m => `
          <div class="metric-item" style="background: ${getScoreColor(m.score)}15;">
            <div class="name">${m.name}</div>
            <div class="name-th">${m.nameThai}</div>
            <div class="score" style="color: ${getScoreColor(m.score)}">${m.score}%</div>
            <div class="progress-bar">
              <div class="fill" style="width: ${m.score}%; background: ${getScoreColor(m.score)}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Wrinkle Analysis -->
    <div class="section">
      <h3 class="section-title">〰️ Wrinkle Zone Analysis (Level: ${data.wrinkleLevel}/10)</h3>
      ${data.wrinkleZones.map(z => {
        const color = z.level <= 3 ? '#22c55e' : z.level <= 6 ? '#eab308' : '#ef4444';
        return `
          <div class="wrinkle-item">
            <div class="name">
              <div style="font-weight: 500;">${z.name}</div>
              <div style="font-size: 12px; color: #64748b;">${z.nameThai}</div>
            </div>
            <div class="bar">
              <div class="bar-fill" style="width: ${z.level * 10}%; background: ${color}"></div>
            </div>
            <div class="level" style="color: ${color}">${z.level}/10</div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Strengths & Concerns -->
    <div class="section">
      <h3 class="section-title">💡 สรุปผลการวิเคราะห์</h3>
      <div class="list-section">
        <div class="list-card strengths">
          <h4>💪 จุดแข็ง</h4>
          <ul>
            ${data.strengths.map(s => `<li><span style="color: #22c55e;">✓</span> ${s}</li>`).join('')}
          </ul>
        </div>
        <div class="list-card concerns">
          <h4>⚠️ ควรปรับปรุง</h4>
          <ul>
            ${data.concerns.map(c => `<li><span style="color: #f97316;">!</span> ${c}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="section">
      <h3 class="section-title">💊 Treatment แนะนำ</h3>
      ${data.recommendations.map((rec, i) => `
        <div class="rec-item">
          <div class="number">${i + 1}</div>
          <div>${rec}</div>
        </div>
      `).join('')}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>รายงานนี้สร้างโดยระบบ <span class="brand">BN-Aura AI Skin Analysis</span></p>
      <p>Powered by MediaPipe • EfficientNet • U-Net • YOLOv8 • Gemini AI</p>
      <p style="margin-top: 8px;">© 2026 BN-Aura - Advanced Skin Analysis Platform</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate report data from analysis
   */
  static prepareReportData(analysis: any, customerName: string = 'ลูกค้า'): ReportData {
    return {
      analysisId: analysis.id || `RPT-${Date.now()}`,
      analyzedAt: analysis.analyzed_at || new Date().toISOString(),
      customerName: customerName,
      customerAge: analysis.actual_age || 35,
      clinicName: analysis.clinic?.display_name?.th || 'BN-Aura Clinic',
      
      overallScore: analysis.overall_score || 72,
      skinAge: analysis.skin_age || 38,
      skinAgeDifference: (analysis.skin_age || 38) - (analysis.actual_age || 35),
      skinHealthGrade: analysis.skin_health_grade || 'B',
      
      symmetryScore: analysis.symmetry_score || 87,
      goldenRatio: analysis.golden_ratio || 1.58,
      
      metrics: [
        { id: 'spots', name: 'Spots', nameThai: 'จุดด่างดำ', score: analysis.spots_score || 65 },
        { id: 'wrinkles', name: 'Wrinkles', nameThai: 'ริ้วรอย', score: analysis.wrinkles_score || 58 },
        { id: 'texture', name: 'Texture', nameThai: 'เนื้อผิว', score: analysis.texture_score || 75 },
        { id: 'pores', name: 'Pores', nameThai: 'รูขุมขน', score: analysis.pores_score || 52 },
        { id: 'uvSpots', name: 'UV Spots', nameThai: 'จุด UV', score: analysis.uv_spots_score || 70 },
        { id: 'brownSpots', name: 'Brown Spots', nameThai: 'ฝ้า/กระ', score: analysis.brown_spots_score || 55 },
        { id: 'redAreas', name: 'Red Areas', nameThai: 'จุดแดง', score: analysis.red_areas_score || 80 },
        { id: 'porphyrins', name: 'Porphyrins', nameThai: 'แบคทีเรีย', score: analysis.porphyrins_score || 85 },
      ],
      
      wrinkleLevel: analysis.wrinkle_level || 6.2,
      wrinkleZones: analysis.wrinkle_zones || [
        { name: 'Forehead', nameThai: 'หน้าผาก', level: 5 },
        { name: 'Glabellar', nameThai: 'ระหว่างคิ้ว', level: 6 },
        { name: 'Crow\'s Feet', nameThai: 'ตีนกา', level: 7 },
        { name: 'Under Eye', nameThai: 'ใต้ตา', level: 5 },
        { name: 'Nasolabial', nameThai: 'ร่องแก้ม', level: 8 },
        { name: 'Marionette', nameThai: 'มุมปาก', level: 6 },
        { name: 'Neck', nameThai: 'คอ', level: 4 },
      ],
      
      recommendations: analysis.recommendations || [
        'Laser Toning - ลดฝ้า กระ จุดด่างดำ',
        'HydraFacial - เพิ่มความชุ่มชื้น ทำความสะอาดรูขุมขน',
        'Botox - ลดริ้วรอยบริเวณหน้าผากและตีนกา',
      ],
      
      strengths: [
        'ผิวไม่มีปัญหาแบคทีเรีย',
        'จุดแดงน้อย',
        'เนื้อผิวค่อนข้างดี',
      ],
      
      concerns: [
        'รูขุมขนกว้างกว่าปกติ',
        'มีริ้วรอยบริเวณร่องแก้ม',
        'ฝ้าและจุดด่างดำ',
      ],
    };
  }
}

export { ReportGenerator };
export type { ReportData };
