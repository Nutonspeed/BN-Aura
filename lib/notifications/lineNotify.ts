/**
 * LINE Notify Integration for BN-Aura
 * Send notifications to LINE users/groups
 */

interface LineNotifyConfig {
  accessToken: string;
}

interface LineMessageOptions {
  message: string;
  imageUrl?: string;
  imageThumbnail?: string;
  stickerPackageId?: number;
  stickerId?: number;
  notificationDisabled?: boolean;
}

interface LineNotifyResult {
  success: boolean;
  status: number;
  message: string;
}

class LineNotifyService {
  private accessToken: string;
  private apiUrl = 'https://notify-api.line.me/api/notify';

  constructor(config: LineNotifyConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Send a notification message
   */
  async sendNotification(options: LineMessageOptions): Promise<LineNotifyResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('message', options.message);

      if (options.imageUrl) {
        formData.append('imageThumbnail', options.imageThumbnail || options.imageUrl);
        formData.append('imageFullsize', options.imageUrl);
      }

      if (options.stickerPackageId && options.stickerId) {
        formData.append('stickerPackageId', options.stickerPackageId.toString());
        formData.append('stickerId', options.stickerId.toString());
      }

      if (options.notificationDisabled) {
        formData.append('notificationDisabled', 'true');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        message: data.message || 'OK',
      };
    } catch (error: any) {
      return {
        success: false,
        status: 500,
        message: error.message,
      };
    }
  }

  /**
   * Send skin analysis result notification
   */
  async sendAnalysisResult(data: {
    customerName: string;
    overallScore: number;
    skinAge: number;
    actualAge: number;
    topConcerns: string[];
    recommendations: string[];
  }): Promise<LineNotifyResult> {
    const ageDiff = data.skinAge - data.actualAge;
    const ageStatus = ageDiff > 0 ? `+${ageDiff}` : ageDiff.toString();
    
    const scoreEmoji = data.overallScore >= 80 ? '🌟' : 
                       data.overallScore >= 60 ? '✅' : 
                       data.overallScore >= 40 ? '⚠️' : '❗';

    const message = `
🧠 BN-Aura AI Skin Analysis
━━━━━━━━━━━━━━━━━━━━

👤 ลูกค้า: ${data.customerName}

📊 ผลวิเคราะห์:
${scoreEmoji} Overall Score: ${data.overallScore}/100
🎂 Skin Age: ${data.skinAge} ปี (${ageStatus})

⚠️ ปัญหาหลัก:
${data.topConcerns.map(c => `• ${c}`).join('\n')}

💊 แนะนำ Treatment:
${data.recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
🔗 ดูรายละเอียดเพิ่มเติมในระบบ BN-Aura`;

    return this.sendNotification({ message });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(data: {
    customerName: string;
    treatmentName: string;
    appointmentDate: string;
    appointmentTime: string;
    clinicName: string;
  }): Promise<LineNotifyResult> {
    const message = `
📅 แจ้งเตือนนัดหมาย
━━━━━━━━━━━━━━━━━━━━

👤 คุณ${data.customerName}

🏥 ${data.clinicName}
💆 Treatment: ${data.treatmentName}
📆 วันที่: ${data.appointmentDate}
⏰ เวลา: ${data.appointmentTime}

━━━━━━━━━━━━━━━━━━━━
กรุณามาถึงก่อนเวลานัด 15 นาที`;

    return this.sendNotification({ message });
  }

  /**
   * Send daily environment alert
   */
  async sendEnvironmentAlert(data: {
    location: string;
    uvIndex: number;
    pm25: number;
    temperature: number;
    humidity: number;
    alerts: string[];
    tips: string[];
  }): Promise<LineNotifyResult> {
    const uvLevel = data.uvIndex >= 8 ? '🔴 สูงมาก' :
                    data.uvIndex >= 6 ? '🟠 สูง' :
                    data.uvIndex >= 3 ? '🟡 ปานกลาง' : '🟢 ต่ำ';

    const aqiLevel = data.pm25 >= 150 ? '🔴 อันตราย' :
                     data.pm25 >= 100 ? '🟠 ไม่ดี' :
                     data.pm25 >= 50 ? '🟡 ปานกลาง' : '🟢 ดี';

    const message = `
🌤️ สภาพอากาศวันนี้
━━━━━━━━━━━━━━━━━━━━

📍 ${data.location}
🌡️ อุณหภูมิ: ${data.temperature}°C
💧 ความชื้น: ${data.humidity}%
☀️ UV Index: ${data.uvIndex} ${uvLevel}
🌫️ PM2.5: ${data.pm25} ${aqiLevel}

${data.alerts.length > 0 ? `⚠️ แจ้งเตือน:\n${data.alerts.map(a => `• ${a}`).join('\n')}\n` : ''}
💡 Tips วันนี้:
${data.tips.slice(0, 3).map(t => `• ${t}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
🧴 อย่าลืมทาครีมกันแดด!`;

    return this.sendNotification({ message });
  }

  /**
   * Send new customer notification to sales
   */
  async sendNewCustomerAlert(data: {
    customerName: string;
    phone: string;
    source: string;
    interests: string[];
    assignedTo: string;
  }): Promise<LineNotifyResult> {
    const message = `
🆕 ลูกค้าใหม่!
━━━━━━━━━━━━━━━━━━━━

👤 ชื่อ: ${data.customerName}
📱 เบอร์: ${data.phone}
📍 มาจาก: ${data.source}

💡 สนใจ:
${data.interests.map(i => `• ${i}`).join('\n')}

👨‍💼 มอบหมายให้: ${data.assignedTo}

━━━━━━━━━━━━━━━━━━━━
📞 โปรดติดต่อลูกค้าภายใน 30 นาที`;

    return this.sendNotification({ message });
  }

  /**
   * Send treatment completion notification
   */
  async sendTreatmentComplete(data: {
    customerName: string;
    treatmentName: string;
    completedDate: string;
    nextAppointment?: string;
    aftercareTips: string[];
  }): Promise<LineNotifyResult> {
    const message = `
✅ Treatment เสร็จสิ้น
━━━━━━━━━━━━━━━━━━━━

👤 คุณ${data.customerName}
💆 ${data.treatmentName}
📅 วันที่: ${data.completedDate}

🏠 การดูแลหลังทำ:
${data.aftercareTips.slice(0, 4).map(t => `• ${t}`).join('\n')}

${data.nextAppointment ? `📅 นัดครั้งถัดไป: ${data.nextAppointment}` : ''}

━━━━━━━━━━━━━━━━━━━━
ขอบคุณที่ใช้บริการ BN-Aura 💜`;

    return this.sendNotification({ message });
  }
}

// Factory function for creating LINE Notify service
function createLineNotifyService(accessToken?: string): LineNotifyService {
  const token = accessToken || process.env.LINE_NOTIFY_TOKEN || '';
  return new LineNotifyService({ accessToken: token });
}

export { LineNotifyService, createLineNotifyService };
export type { LineNotifyConfig, LineMessageOptions, LineNotifyResult };
