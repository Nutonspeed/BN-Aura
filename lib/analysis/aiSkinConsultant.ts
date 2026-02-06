/**
 * AI Skin Consultant 24/7
 * Chatbot powered by Gemini AI for skin consultation
 * Provides personalized advice based on customer's analysis history
 */

interface ConsultantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    suggestedActions?: string[];
    relatedTreatments?: string[];
  };
}

interface ConsultantSession {
  sessionId: string;
  customerId: string;
  messages: ConsultantMessage[];
  context: {
    skinScore?: number;
    skinAge?: number;
    concerns?: string[];
    recentAnalysis?: any;
    treatmentHistory?: string[];
  };
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface ConsultantResponse {
  message: ConsultantMessage;
  suggestedQuestions: string[];
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  labelThai: string;
  action: 'book_appointment' | 'view_treatments' | 'view_analysis' | 'ask_question';
  data?: any;
}

// Pre-defined responses for common questions (fallback when AI is unavailable)
const KNOWLEDGE_BASE: Record<string, { response: string; treatments?: string[] }> = {
  'สิว': {
    response: `สิวเกิดจากหลายสาเหตุค่ะ:
• รูขุมขนอุดตัน - จากความมัน และเซลล์ผิวที่ตายแล้ว
• แบคทีเรีย - P. acnes ที่ก่อให้เกิดการอักเสบ
• ฮอร์โมน - โดยเฉพาะช่วงมีประจำเดือน หรือความเครียด

คำแนะนำเบื้องต้น:
1. ล้างหน้าวันละ 2 ครั้ง ด้วยผลิตภัณฑ์ที่มี Salicylic Acid
2. หลีกเลี่ยงการบีบสิวเอง เพราะอาจทำให้เกิดแผลเป็น
3. ใช้ครีมกันแดดทุกวัน แม้อยู่ในบ้าน`,
    treatments: ['Carbon Peel', 'Blue Light Therapy', 'Extraction Facial'],
  },
  'ฝ้า': {
    response: `ฝ้าเกิดจากการสร้างเม็ดสี melanin มากเกินไป สาเหตุหลักคือ:
• แสงแดด UV - ตัวกระตุ้นหลักของฝ้า
• ฮอร์โมน - โดยเฉพาะช่วงตั้งครรภ์หรือใช้ยาคุม
• พันธุกรรม - บางคนมีแนวโน้มเป็นฝ้ามากกว่า

คำแนะนำ:
1. ใช้ครีมกันแดด SPF50+ PA++++ ทุกวัน ทาซ้ำทุก 2-3 ชม.
2. ใช้ผลิตภัณฑ์ที่มี Vitamin C, Niacinamide หรือ Arbutin
3. หลีกเลี่ยงแสงแดดช่วง 10.00-16.00 น.`,
    treatments: ['Laser Toning', 'Pico Laser', 'Chemical Peel'],
  },
  'ริ้วรอย': {
    response: `ริ้วรอยเกิดจากการเสื่อมสภาพของคอลลาเจนและอีลาสติน:
• อายุที่เพิ่มขึ้น - หลัง 25 ปี คอลลาเจนลดลง 1% ต่อปี
• แสงแดด - UV เป็นตัวทำลายคอลลาเจนอันดับ 1
• การแสดงออกทางสีหน้า - ขมวดคิ้ว ยิ้ม ทำให้เกิดริ้วรอย

คำแนะนำ:
1. ใช้ Retinol/Retinoid ตอนกลางคืน (เริ่มจาก 0.25-0.5%)
2. ใช้ครีมกันแดดทุกวัน
3. ใช้ผลิตภัณฑ์ที่มี Peptides และ Hyaluronic Acid`,
    treatments: ['Botox', 'Filler', 'Fractional Laser', 'Thread Lift'],
  },
  'รูขุมขน': {
    response: `รูขุมขนกว้างเกิดจาก:
• ผิวมัน - ต่อมไขมันทำงานมาก ทำให้รูขุมขนขยาย
• อายุ - ผิวหย่อนคล้อยทำให้รูขุมขนดูใหญ่ขึ้น
• การบีบสิวไม่ถูกวิธี - ทำให้รูขุมขนเสียรูป

คำแนะนำ:
1. ใช้ Niacinamide 10% ช่วยลดขนาดรูขุมขน
2. ใช้ BHA (Salicylic Acid) ช่วยทำความสะอาดรูขุมขน
3. ใช้ Retinol ช่วยกระตุ้นคอลลาเจน`,
    treatments: ['Carbon Peel', 'Fractional Laser', 'Microneedling'],
  },
  'ผิวแห้ง': {
    response: `ผิวแห้งเกิดจากการขาดความชุ่มชื้น:
• อากาศแห้ง หรือแอร์เย็นจัด
• ล้างหน้าบ่อยเกินไป หรือใช้ผลิตภัณฑ์ที่แรงเกินไป
• อายุที่เพิ่มขึ้น - ต่อมไขมันทำงานน้อยลง

คำแนะนำ:
1. ใช้ Hyaluronic Acid Serum เช้า-เย็น
2. ใช้ Moisturizer ที่มี Ceramides
3. ดื่มน้ำ 2-3 ลิตรต่อวัน
4. หลีกเลี่ยงน้ำร้อนจัดเวลาล้างหน้า`,
    treatments: ['HydraFacial', 'Moisture Infusion', 'LED Light Therapy'],
  },
};

class AISkinConsultant {
  
  /**
   * Start a new consultation session
   */
  static startSession(customerId: string, context?: ConsultantSession['context']): ConsultantSession {
    const sessionId = `CONSULT-${Date.now()}`;
    
    const welcomeMessage: ConsultantMessage = {
      id: `MSG-${Date.now()}`,
      role: 'assistant',
      content: this.generateWelcomeMessage(context),
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'greeting',
        suggestedActions: ['ถามเกี่ยวกับปัญหาผิว', 'ดูผลวิเคราะห์', 'นัดหมาย'],
      },
    };

    return {
      sessionId,
      customerId,
      messages: [welcomeMessage],
      context: context || {},
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate welcome message based on context
   */
  private static generateWelcomeMessage(context?: ConsultantSession['context']): string {
    if (context?.skinScore) {
      return `สวัสดีค่ะ ฉันคือ Aura AI ผู้ช่วยด้านการดูแลผิว 🌟

จากผลวิเคราะห์ล่าสุดของคุณ:
• Skin Score: ${context.skinScore}/100
• Skin Age: ${context.skinAge || 'ยังไม่ได้วิเคราะห์'} ปี
${context.concerns?.length ? `• ปัญหาที่พบ: ${context.concerns.join(', ')}` : ''}

มีอะไรให้ช่วยเหลือไหมคะ? 💬`;
    }

    return `สวัสดีค่ะ ฉันคือ Aura AI ผู้ช่วยด้านการดูแลผิว 🌟

ฉันพร้อมให้คำปรึกษาเกี่ยวกับ:
• ปัญหาผิวและวิธีดูแล
• การเลือก Treatment ที่เหมาะสม
• คำแนะนำผลิตภัณฑ์ดูแลผิว
• การนัดหมายกับคลินิก

มีอะไรให้ช่วยเหลือไหมคะ? 💬`;
  }

  /**
   * Process user message and generate response
   */
  static async chat(
    session: ConsultantSession,
    userMessage: string
  ): Promise<ConsultantResponse> {
    // Add user message to session
    const userMsg: ConsultantMessage = {
      id: `MSG-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // Detect intent and generate response
    const intent = this.detectIntent(userMessage);
    const response = await this.generateResponse(userMessage, intent, session.context);

    // Add assistant response
    const assistantMsg: ConsultantMessage = {
      id: `MSG-${Date.now() + 1}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: {
        intent,
        relatedTreatments: response.treatments,
      },
    };
    session.messages.push(assistantMsg);
    session.updatedAt = new Date().toISOString();

    return {
      message: assistantMsg,
      suggestedQuestions: this.getSuggestedQuestions(intent),
      quickActions: this.getQuickActions(intent, response.treatments),
    };
  }

  /**
   * Detect user intent from message
   */
  private static detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('นัด') || lowerMessage.includes('จอง') || lowerMessage.includes('appointment')) {
      return 'booking';
    }
    if (lowerMessage.includes('ราคา') || lowerMessage.includes('ค่าใช้จ่าย') || lowerMessage.includes('เท่าไหร่')) {
      return 'pricing';
    }
    if (lowerMessage.includes('สิว')) return 'acne';
    if (lowerMessage.includes('ฝ้า') || lowerMessage.includes('กระ')) return 'melasma';
    if (lowerMessage.includes('ริ้วรอย') || lowerMessage.includes('รอยเหี่ยว')) return 'wrinkles';
    if (lowerMessage.includes('รูขุมขน')) return 'pores';
    if (lowerMessage.includes('แห้ง') || lowerMessage.includes('ชุ่มชื้น')) return 'dryness';
    if (lowerMessage.includes('มัน')) return 'oily';
    if (lowerMessage.includes('แพ้') || lowerMessage.includes('ระคายเคือง')) return 'sensitive';
    
    return 'general';
  }

  /**
   * Generate response based on intent
   */
  private static async generateResponse(
    message: string,
    intent: string,
    context: ConsultantSession['context']
  ): Promise<{ content: string; treatments?: string[] }> {
    // Check knowledge base first
    const knowledgeKey = Object.keys(KNOWLEDGE_BASE).find(key => 
      message.includes(key)
    );

    if (knowledgeKey) {
      const kb = KNOWLEDGE_BASE[knowledgeKey];
      return {
        content: kb.response + (kb.treatments?.length 
          ? `\n\n💊 Treatment ที่แนะนำ: ${kb.treatments.join(', ')}\n\nต้องการนัดปรึกษาผู้เชี่ยวชาญไหมคะ?`
          : ''),
        treatments: kb.treatments,
      };
    }

    // Handle booking intent
    if (intent === 'booking') {
      return {
        content: `เพื่อนัดหมาย กรุณาเลือกค่ะ:

1️⃣ นัดปรึกษาฟรี - พบผู้เชี่ยวชาญ 15 นาที
2️⃣ นัดทำ Treatment - ระบุ Treatment ที่สนใจ
3️⃣ นัดตรวจผิวละเอียด - AI Skin Analysis

หรือจะให้ช่วยแนะนำ Treatment ที่เหมาะกับคุณก่อนไหมคะ?`,
      };
    }

    // Handle pricing intent
    if (intent === 'pricing') {
      return {
        content: `ราคาขึ้นอยู่กับ Treatment ค่ะ เบื้องต้น:

💉 Botox: ฿8,000 - ฿15,000
💉 Filler: ฿12,000 - ฿35,000
✨ Laser Toning: ฿3,500 - ฿5,500/ครั้ง
🧖 HydraFacial: ฿2,500 - ฿4,000/ครั้ง
⚡ Carbon Peel: ฿2,500 - ฿3,500/ครั้ง

สนใจ Treatment ไหนเป็นพิเศษไหมคะ? จะได้ให้รายละเอียดเพิ่มเติมค่ะ`,
      };
    }

    // Default response
    return {
      content: `ขอบคุณสำหรับคำถามค่ะ 

${context?.concerns?.length 
  ? `จากปัญหาผิวของคุณ (${context.concerns.join(', ')}) ฉันแนะนำให้:`
  : 'ฉันแนะนำให้:'}

1. ทำ AI Skin Analysis เพื่อวิเคราะห์ผิวอย่างละเอียด
2. ปรึกษาผู้เชี่ยวชาญเพื่อวางแผนการดูแล
3. เริ่มดูแลผิวตามคำแนะนำ

ต้องการให้ช่วยอะไรเพิ่มเติมไหมคะ?`,
    };
  }

  /**
   * Get suggested follow-up questions
   */
  private static getSuggestedQuestions(intent: string): string[] {
    const suggestions: Record<string, string[]> = {
      acne: ['สิวอักเสบรักษายังไง?', 'Carbon Peel ดีไหม?', 'ราคาเท่าไหร่?'],
      melasma: ['ฝ้าลึกรักษาได้ไหม?', 'Laser Toning กี่ครั้ง?', 'ต้องพักฟื้นไหม?'],
      wrinkles: ['Botox อยู่ได้นานไหม?', 'ฟิลเลอร์ปลอดภัยไหม?', 'ราคา Botox เท่าไหร่?'],
      pores: ['รูขุมขนเล็กลงได้จริงไหม?', 'ต้องทำกี่ครั้ง?', 'ผลลัพธ์อยู่นานไหม?'],
      booking: ['มีโปรโมชั่นอะไรบ้าง?', 'นัดวันไหนได้บ้าง?', 'ปรึกษาฟรีไหม?'],
      default: ['อยากปรึกษาเรื่องผิว', 'ดูผลวิเคราะห์ล่าสุด', 'นัดหมายทำ Treatment'],
    };

    return suggestions[intent] || suggestions.default;
  }

  /**
   * Get quick action buttons
   */
  private static getQuickActions(intent: string, treatments?: string[]): QuickAction[] {
    const actions: QuickAction[] = [
      {
        id: 'book',
        label: 'Book Appointment',
        labelThai: 'นัดหมาย',
        action: 'book_appointment',
      },
      {
        id: 'analysis',
        label: 'View Analysis',
        labelThai: 'ดูผลวิเคราะห์',
        action: 'view_analysis',
      },
    ];

    if (treatments?.length) {
      actions.unshift({
        id: 'treatments',
        label: 'View Treatments',
        labelThai: 'ดู Treatment ที่แนะนำ',
        action: 'view_treatments',
        data: { treatments },
      });
    }

    return actions;
  }

  /**
   * Get sample session for testing
   */
  static getSampleSession(): ConsultantSession {
    return this.startSession('SAMPLE-CUSTOMER', {
      skinScore: 72,
      skinAge: 38,
      concerns: ['ฝ้า', 'รูขุมขนกว้าง', 'ริ้วรอย'],
    });
  }
}

export { AISkinConsultant };
export type { ConsultantSession, ConsultantMessage, ConsultantResponse };
