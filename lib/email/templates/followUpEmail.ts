// Email Templates for Follow-up Automation

export interface FollowUpEmailData {
  customerName: string;
  clinicName: string;
  subject: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  treatmentName?: string;
  appointmentDate?: string;
}

export function generateFollowUpEmail(data: FollowUpEmailData): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sarabun', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                ${data.clinicName}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                ดูแลความงามของคุณด้วยใจ
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; margin: 0 0 10px 0;">
                สวัสดีค่ะ คุณ${data.customerName}
              </p>
              
              <div style="color: #555; font-size: 15px; line-height: 1.8; margin: 20px 0;">
                ${data.message.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
              </div>

              ${data.treatmentName ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #667eea; font-weight: 600; font-size: 14px;">
                  การรักษาของคุณ
                </p>
                <p style="margin: 0; color: #333; font-size: 16px; font-weight: 500;">
                  ${data.treatmentName}
                </p>
                ${data.appointmentDate ? `
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                  📅 ${new Date(data.appointmentDate).toLocaleDateString('th-TH', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                ` : ''}
              </div>
              ` : ''}

              ${data.ctaUrl ? `
              <div style="text-align: center; margin: 35px 0;">
                <a href="${data.ctaUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                  ${data.ctaText || 'ดูรายละเอียด'}
                </a>
              </div>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อเราได้ทุกเมื่อ
                </p>
                <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                  ขอบคุณที่ไว้วางใจเรา ❤️
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #999; font-size: 13px; margin: 0 0 10px 0;">
                ${data.clinicName}
              </p>
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} BN-Aura. All rights reserved.
              </p>
              <div style="margin-top: 15px;">
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">นโยบายความเป็นส่วนตัว</a>
                <span style="color: #ccc;">|</span>
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">ยกเลิกการรับอีเมล</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Pre-defined email templates
export const emailTemplates = {
  // After Magic Scan
  postScan: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'ผลการสแกนผิวของคุณพร้อมแล้ว',
    message: `ขอบคุณที่ใช้บริการ Magic Scan ของเรา\n\nผลการวิเคราะห์ผิวของคุณพร้อมแล้ว รวมถึงคำแนะนำการดูแลผิวที่เหมาะสมสำหรับคุณโดยเฉพาะ\n\nแตะปุ่มด้านล่างเพื่อดูผลการวิเคราะห์และข้อเสนอแนะการรักษา`,
    ctaText: 'ดูผลการวิเคราะห์',
    ctaUrl: data.ctaUrl,
    ...data
  }),

  // Proposal sent
  proposalSent: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'ข้อเสนอการรักษาพิเศษสำหรับคุณ',
    message: `เราได้จัดทำข้อเสนอการรักษาที่เหมาะสมสำหรับคุณโดยเฉพาะ\n\nข้อเสนอนี้ออกแบบมาจากผลการวิเคราะห์ผิวของคุณ และความต้องการของคุณโดยเฉพาะ\n\nกรุณาตรวจสอบรายละเอียดและติดต่อกลับเราหากมีข้อสงสัย`,
    ctaText: 'ดูข้อเสนอ',
    ctaUrl: data.ctaUrl,
    treatmentName: data.treatmentName,
    ...data
  }),

  // Appointment reminder
  appointmentReminder: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'แจ้งเตือน: นัดหมายของคุณใกล้เข้ามาแล้ว',
    message: `นัดหมายของคุณใกล้เข้ามาแล้ว\n\nกรุณามาถึงก่อนเวลานัด 10 นาที เพื่อเตรียมตัวและกรอกเอกสาร\n\nหากต้องการเลื่อนนัดหมาย กรุณาแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง`,
    treatmentName: data.treatmentName,
    appointmentDate: data.appointmentDate,
    ctaText: 'ดูรายละเอียดนัดหมาย',
    ctaUrl: data.ctaUrl,
    ...data
  }),

  // Post treatment
  postTreatment: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'การดูแลหลังการรักษา',
    message: `ขอบคุณที่ใช้บริการของเรา\n\nนี่คือคำแนะนำในการดูแลหลังการรักษาเพื่อผลลัพธ์ที่ดีที่สุด:\n\n• หลีกเลี่ยงแสงแดดโดยตรงเป็นเวลา 2 สัปดาห์\n• ทาครีมกันแดด SPF 30+ ทุกวัน\n• ดื่มน้ำอย่างน้อย 2 ลิตรต่อวัน\n• หลีกเลี่ยงการขัดผิว 1 สัปดาห์\n\nหากมีอาการผิดปกติ กรุณาติดต่อเราทันที`,
    treatmentName: data.treatmentName,
    ...data
  }),

  // Follow-up check
  followUpCheck: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'ติดตามผลการรักษา',
    message: `สวัสดีค่ะ\n\nเราอยากทราบผลการรักษาของคุณ และความพึงพอใจในบริการของเรา\n\nหากคุณพึงพอใจ เราขอขอบคุณที่แบ่งปันประสบการณ์ดีๆ กับเพื่อนๆ\n\nหากมีอะไรที่เราสามารถปรับปรุงได้ กรุณาแจ้งเรา เราพร้อมฟังและพัฒนาให้ดีขึ้นเสมอ`,
    ctaText: 'ให้คะแนนบริการ',
    ctaUrl: data.ctaUrl,
    ...data
  }),

  // Special promotion
  promotion: (data: Partial<FollowUpEmailData>) => generateFollowUpEmail({
    customerName: data.customerName || '',
    clinicName: data.clinicName || '',
    subject: 'โปรโมชั่นพิเศษเฉพาะคุณ',
    message: data.message || 'เรามีโปรโมชั่นพิเศษสำหรับคุณโดยเฉพาะ',
    ctaText: 'ดูโปรโมชั่น',
    ctaUrl: data.ctaUrl,
    ...data
  })
};
