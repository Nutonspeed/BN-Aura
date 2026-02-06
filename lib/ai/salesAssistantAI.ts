/**
 * Sales Assistant AI Integration System
 */

interface CustomerConsultation {
  consultationId: string;
  customerId: string;
  skinAnalysis: {
    skinType: string;
    concerns: string[];
    severity: string;
  };
  recommendations: {
    treatments: string[];
    products: string[];
    totalPrice: number;
  };
  salesScript: {
    opening: string;
    keyPoints: string[];
    closing: string;
  };
  followUpPlan: string;
}

interface AIConversation {
  conversationId: string;
  customerId: string;
  messages: { role: string; message: string; timestamp: string }[];
  leadQuality: 'hot' | 'warm' | 'cold';
  nextAction: string;
}

class SalesAssistantAI {
  private static consultations: Map<string, CustomerConsultation> = new Map();
  private static conversations: Map<string, AIConversation> = new Map();

  static generateConsultation(customerId: string, skinData: any): CustomerConsultation {
    const consultationId = `consult_${Date.now()}`;
    const recommendations = this.getRecommendations(skinData);
    const salesScript = this.generateSalesScript(skinData, recommendations);

    const consultation: CustomerConsultation = {
      consultationId,
      customerId,
      skinAnalysis: skinData,
      recommendations,
      salesScript,
      followUpPlan: 'Follow up in 3 days with special offer'
    };

    this.consultations.set(consultationId, consultation);
    return consultation;
  }

  static startConversation(customerId: string, message: string): AIConversation {
    const conversationId = `conv_${Date.now()}`;
    const aiResponse = this.generateAIResponse(message);

    const conversation: AIConversation = {
      conversationId,
      customerId,
      messages: [
        { role: 'customer', message, timestamp: new Date().toISOString() },
        { role: 'ai', message: aiResponse, timestamp: new Date().toISOString() }
      ],
      leadQuality: 'warm',
      nextAction: 'Continue conversation or transfer to sales'
    };

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  static getProductRecommendations(skinType: string): any[] {
    const products = [
      { name: 'Vitamin C Serum', price: 2800, match: 85 },
      { name: 'Hyaluronic Moisturizer', price: 3200, match: 90 },
      { name: 'Retinol Treatment', price: 4500, match: 75 }
    ];

    return products.filter(p => p.match > 70);
  }

  private static getRecommendations(skinData: any) {
    return {
      treatments: ['Laser Treatment', 'Chemical Peel', 'Microdermabrasion'],
      products: ['Vitamin C Serum', 'Moisturizer', 'Sunscreen'],
      totalPrice: 25000
    };
  }

  private static generateSalesScript(skinData: any, recommendations: any) {
    return {
      opening: `สำหรับผิว${skinData.skinType}ของคุณ เรามีโซลูชั่นที่เหมาะสมมากค่ะ`,
      keyPoints: ['ผลลัพธ์เห็นได้ใน 2 สัปดาห์', 'รักษาแบบ non-invasive', 'โปรโมชั่นพิเศษ 20% off'],
      closing: 'วันนี้จองได้เลยค่ะ รับส่วนลดพิเศษ!'
    };
  }

  private static generateAIResponse(message: string): string {
    if (message.toLowerCase().includes('ปรึกษา')) {
      return 'ยินดีให้คำปรึกษาค่ะ! คุณมีปัญหาผิวอะไรที่อยากปรับปรุงไหมคะ?';
    }
    if (message.toLowerCase().includes('ราคา')) {
      return 'เรามีแพ็คเกจหลากหลายค่ะ ตั้งแต่ 5,000 - 50,000 บาท ขึ้นอยู่กับการรักษา';
    }
    return 'ขอบคุณที่ติดต่อมาค่ะ! ช่วยบอกความต้องการของคุณได้ไหมคะ?';
  }
}

export { SalesAssistantAI, type CustomerConsultation, type AIConversation };
