/**
 * PDF Exporter for Skin Analysis Reports
 * Uses jsPDF + html2canvas to convert HTML reports to downloadable PDFs
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportGenerator, type ReportData } from './reportGenerator';

export class PDFExporter {

  /**
   * Generate and download a PDF report from analysis data
   */
  static async downloadReport(reportData: ReportData): Promise<void> {
    const html = ReportGenerator.generateHTML(reportData);

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);

    try {
      // Render HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        windowWidth: 800,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page content
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download
      const filename = `BN-Aura_SkinAnalysis_${reportData.customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Generate Before/After comparison PDF
   */
  static async downloadComparisonReport(
    before: ReportData,
    after: ReportData,
    daysBetween: number
  ): Promise<void> {
    const comparisonHtml = this.generateComparisonHTML(before, after, daysBetween);

    const container = document.createElement('div');
    container.innerHTML = comparisonHtml;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `BN-Aura_Comparison_${after.customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Generate comparison HTML for Before/After PDF
   */
  private static generateComparisonHTML(before: ReportData, after: ReportData, daysBetween: number): string {
    const getColor = (score: number) => score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
    const getChangeColor = (change: number) => change > 0 ? '#22c55e' : change < 0 ? '#ef4444' : '#64748b';
    const changeIcon = (change: number) => change > 0 ? '▲' : change < 0 ? '▼' : '—';

    const metrics = before.metrics.map((bm, i) => {
      const am = after.metrics[i];
      const change = am.score - bm.score;
      return { name: bm.name, nameThai: bm.nameThai, before: bm.score, after: am.score, change };
    });

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header .sub { opacity: 0.9; font-size: 14px; }
    .info { background: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .info .item { text-align: center; }
    .info .label { font-size: 11px; color: #64748b; }
    .info .value { font-size: 15px; font-weight: 600; }
    .compare-grid { display: grid; grid-template-columns: 1fr 80px 1fr; gap: 16px; margin-bottom: 24px; }
    .compare-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .compare-card .period { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .compare-card .score { font-size: 36px; font-weight: 700; }
    .compare-card .sub { font-size: 11px; color: #94a3b8; }
    .arrow-col { display: flex; align-items: center; justify-content: center; font-size: 28px; }
    .section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .section h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .metric-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .metric-row:last-child { border-bottom: none; }
    .metric-name { width: 120px; }
    .metric-name .en { font-size: 12px; color: #64748b; }
    .metric-name .th { font-size: 13px; font-weight: 500; }
    .metric-scores { flex: 1; display: flex; align-items: center; gap: 8px; }
    .metric-scores .val { width: 40px; text-align: center; font-weight: 600; }
    .metric-scores .bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; position: relative; }
    .metric-scores .bar-fill { height: 100%; border-radius: 4px; }
    .metric-change { width: 70px; text-align: right; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; }
    .footer .brand { font-weight: 600; color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 36px; margin-bottom: 8px;">📊</div>
      <h1>Before / After Comparison Report</h1>
      <p class="sub">${after.customerName} • ${daysBetween} วันระหว่างการวิเคราะห์</p>
    </div>

    <div class="info">
      <div class="item"><div class="label">ชื่อ</div><div class="value">${after.customerName}</div></div>
      <div class="item"><div class="label">อายุ</div><div class="value">${after.customerAge} ปี</div></div>
      <div class="item"><div class="label">Before</div><div class="value">${new Date(before.analyzedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</div></div>
      <div class="item"><div class="label">After</div><div class="value">${new Date(after.analyzedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</div></div>
    </div>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="period">Before</div>
        <div class="score" style="color: ${getColor(before.overallScore)}">${before.overallScore}</div>
        <div class="sub">Overall Score</div>
      </div>
      <div class="arrow-col" style="color: ${getChangeColor(after.overallScore - before.overallScore)}">
        ${changeIcon(after.overallScore - before.overallScore)}
      </div>
      <div class="compare-card">
        <div class="period">After</div>
        <div class="score" style="color: ${getColor(after.overallScore)}">${after.overallScore}</div>
        <div class="sub">${after.overallScore - before.overallScore > 0 ? '+' : ''}${after.overallScore - before.overallScore} points</div>
      </div>
    </div>

    <div class="section">
      <h3>📊 8 Metrics Comparison</h3>
      ${metrics.map(m => `
        <div class="metric-row">
          <div class="metric-name">
            <div class="en">${m.name}</div>
            <div class="th">${m.nameThai}</div>
          </div>
          <div class="metric-scores">
            <div class="val" style="color: ${getColor(m.before)}">${m.before}</div>
            <div class="bar">
              <div class="bar-fill" style="width: ${m.before}%; background: ${getColor(m.before)}; opacity: 0.4;"></div>
              <div class="bar-fill" style="width: ${m.after}%; background: ${getColor(m.after)}; position: absolute; top: 0;"></div>
            </div>
            <div class="val" style="color: ${getColor(m.after)}">${m.after}</div>
          </div>
          <div class="metric-change" style="color: ${getChangeColor(m.change)}">
            ${changeIcon(m.change)} ${m.change > 0 ? '+' : ''}${m.change}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p><span class="brand">BN-Aura AI</span> • Before/After Comparison Report</p>
      <p>Powered by HuggingFace • Gemini • Vercel AI Gateway</p>
    </div>
  </div>
</body>
</html>`;
  }
}
