/**
 * BN-Aura Email Templates System
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}

// Base template wrapper
const baseWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 32px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #ffffff; margin: 16px 0 0; font-size: 24px; }
    .content { padding: 32px; }
    .footer { background: #f4f4f5; padding: 24px; text-align: center; font-size: 12px; color: #71717a; }
    .button { display: inline-block; background: #8B5CF6; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .metric { background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 8px 0; }
    .metric-value { font-size: 32px; font-weight: bold; color: #8B5CF6; }
    .metric-label { font-size: 14px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BN-Aura</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 BN-Aura. All rights reserved.</p>
      <p>Premium Aesthetic Intelligence</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'ยินดีต้อนรับสู่ BN-Aura! 🎉',
    html: baseWrapper(`
      <h2>สวัสดีคุณ {{name}}!</h2>
      <p>ขอบคุณที่เลือกใช้บริการ BN-Aura - ระบบวิเคราะห์ผิวด้วย AI อัจฉริยะสำหรับคลินิกความงามชั้นนำ</p>
      <p>คุณสามารถเริ่มต้นใช้งานได้ทันที:</p>
      <ul>
        <li>วิเคราะห์ผิวด้วย AI 8 ตัวชี้วัด</li>
        <li>ดู AR Preview ก่อน Treatment</li>
        <li>รับคำแนะนำเฉพาะบุคคล</li>
      </ul>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{{dashboardUrl}}" class="button">เข้าสู่ระบบ</a>
      </p>
    `),
  },

  analysisReport: {
    id: 'analysis-report',
    name: 'Skin Analysis Report',
    subject: 'รายงานผลวิเคราะห์ผิวของคุณ 📊',
    html: baseWrapper(`
      <h2>รายงานผลวิเคราะห์ผิว</h2>
      <p>เรียน คุณ{{name}},</p>
      <p>ผลการวิเคราะห์ผิวของคุณเสร็จสมบูรณ์แล้ว:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
        <div class="metric">
          <div class="metric-value">{{overallScore}}</div>
          <div class="metric-label">คะแนนรวม</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{skinAge}}</div>
          <div class="metric-label">อายุผิว</div>
        </div>
      </div>
      <h3>Treatment แนะนำ:</h3>
      <ul>{{treatments}}</ul>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{{reportUrl}}" class="button">ดูรายงานฉบับเต็ม</a>
      </p>
    `),
  },

  bookingConfirmation: {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    subject: 'ยืนยันการนัดหมาย ✅',
    html: baseWrapper(`
      <h2>ยืนยันการนัดหมายเรียบร้อย</h2>
      <p>เรียน คุณ{{name}},</p>
      <p>การนัดหมายของคุณได้รับการยืนยันแล้ว:</p>
      <div class="metric">
        <div class="metric-value">{{treatmentName}}</div>
        <div class="metric-label">{{date}} เวลา {{time}}</div>
      </div>
      <p><strong>คลินิก:</strong> {{clinicName}}</p>
      <p><strong>ที่อยู่:</strong> {{clinicAddress}}</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{{calendarUrl}}" class="button">เพิ่มในปฏิทิน</a>
      </p>
    `),
  },

  quotaWarning: {
    id: 'quota-warning',
    name: 'Quota Warning',
    subject: '⚠️ โควต้าใกล้หมด',
    html: baseWrapper(`
      <h2>แจ้งเตือนโควต้าใกล้หมด</h2>
      <p>เรียน ผู้ดูแลคลินิก {{clinicName}},</p>
      <div class="metric">
        <div class="metric-value">{{remaining}} / {{limit}}</div>
        <div class="metric-label">โควต้าคงเหลือ</div>
      </div>
      <p>โควต้าการสแกน AI ของคลินิกเหลือน้อยกว่า {{percentage}}%</p>
      <p>เพื่อไม่ให้บริการหยุดชะงัก กรุณาเติมโควต้าหรืออัพเกรดแพ็กเกจ</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{{upgradeUrl}}" class="button">อัพเกรดแพ็กเกจ</a>
      </p>
    `),
  },

  monthlyReport: {
    id: 'monthly-report',
    name: 'Monthly Report',
    subject: '📈 รายงานประจำเดือน {{month}}',
    html: baseWrapper(`
      <h2>รายงานประจำเดือน {{month}}</h2>
      <p>เรียน ผู้ดูแลคลินิก {{clinicName}},</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
        <div class="metric">
          <div class="metric-value">{{totalScans}}</div>
          <div class="metric-label">การสแกนทั้งหมด</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{totalBookings}}</div>
          <div class="metric-label">การจองทั้งหมด</div>
        </div>
        <div class="metric">
          <div class="metric-value">฿{{revenue}}</div>
          <div class="metric-label">รายได้</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{conversionRate}}%</div>
          <div class="metric-label">Conversion Rate</div>
        </div>
      </div>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{{reportUrl}}" class="button">ดูรายงานฉบับเต็ม</a>
      </p>
    `),
  },
};

// Render template with variables
export function renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; html: string } | null {
  const template = emailTemplates[templateId];
  if (!template) return null;

  let subject = template.subject;
  let html = template.html;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
  });

  return { subject, html };
}

export default { emailTemplates, renderTemplate };
