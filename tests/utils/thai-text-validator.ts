/**
 * Thai Language Text Validation Utilities
 * ตัวช่วยสำหรับตรวจสอบความถูกต้องของข้อความภาษาไทยใน BN-Aura Platform
 */

export interface ThaiTextValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ThaiTextValidator {
  
  /**
   * ตรวจสอบว่าข้อความมีตัวอักษรไทยอยู่หรือไม่
   */
  static hasThaiCharacters(text: string): boolean {
    const thaiRegex = /[\u0E00-\u0E7F]/;
    return thaiRegex.test(text);
  }

  /**
   * ตรวจสอบการใช้วรรณยุกต์ภาษาไทยที่ถูกต้อง
   */
  static validateThaiToneMarks(text: string): ThaiTextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // ตรวจสอบการใช้วรรณยุกต์ที่ผิด
    const invalidToneMarks = /[\u0E48-\u0E4C][\u0E48-\u0E4C]/g;
    if (invalidToneMarks.test(text)) {
      errors.push('พบการใช้วรรณยุกต์ซ้ำซ้อน');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * ตรวจสอบการใช้เครื่องหมายวรรคตอนภาษาไทย
   */
  static validateThaiPunctuation(text: string): ThaiTextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // ตรวจสอบการใช้เครื่องหมายจุลภาคและมหัพภาคที่ถูกต้อง
    const invalidSpacing = /[ก-๙]\s+[,.]/g;
    if (invalidSpacing.test(text)) {
      warnings.push('พบการใช้ช่องว่างก่อนเครื่องหมายวรรคตอน');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * ตรวจสอบความถูกต้องของการแสดงผลตัวเลขและสกุลเงินภาษาไทย
   */
  static validateThaiCurrencyFormat(text: string): ThaiTextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // ตรวจสอบรูปแบบสกุลเงินไทย
    const currencyRegex = /฿[\d,]+(?:\.[\d]{1,2})?/g;
    const matches = text.match(/฿/g);
    
    if (matches) {
      const validCurrencyMatches = text.match(currencyRegex);
      if (!validCurrencyMatches || matches.length !== validCurrencyMatches.length) {
        errors.push('รูปแบบการแสดงสกุลเงินไทยไม่ถูกต้อง');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * ตรวจสอบความถูกต้องของชื่อและคำศัพท์ทางการแพทย์ภาษาไทย
   */
  static validateMedicalTerms(text: string): ThaiTextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // รายการคำศัพท์ทางการแพทย์ที่ใช้บ่อยใน BN-Aura
    const commonMedicalTerms = [
      'ผิวหนัง', 'การรักษา', 'นักเสริมสวย', 'คลินิก', 'แพทย์',
      'เลเซอร์', 'โบท็อกซ์', 'ฟิลเลอร์', 'เพียลิง', 'ไฮฟู',
      'ดูแลผิวหนัง', 'วิเคราะห์ผิว', 'แผนการรักษา'
    ];
    
    // ตรวจสอบการสะกดคำที่อาจผิด (เบื้องต้น)
    for (const term of commonMedicalTerms) {
      const misspelledPattern = new RegExp(
        term.replace(/./g, (char, index) => 
          index === 0 ? `[${char}${this.getSimilarThaiChars(char)}]` : char
        ), 'gi'
      );
      
      if (misspelledPattern.test(text) && !text.includes(term)) {
        warnings.push(`อาจมีการสะกดคำที่คล้ายกับ "${term}" ไม่ถูกต้อง`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * ช่วยหาตัวอักษรไทยที่คล้ายกัน
   */
  private static getSimilarThaiChars(char: string): string {
    const similarChars: { [key: string]: string } = {
      'ท': 'ธ',
      'ธ': 'ท',
      'ส': 'ศษ',
      'ศ': 'สษ',
      'ษ': 'สศ',
      'ข': 'ฃ',
      'ฃ': 'ข'
    };
    
    return similarChars[char] || '';
  }

  /**
   * ตรวจสอบความถูกต้องของข้อความไทยแบบครอบคลุม
   */
  static validateComprehensive(text: string): ThaiTextValidationResult {
    const results: ThaiTextValidationResult[] = [
      this.validateThaiToneMarks(text),
      this.validateThaiPunctuation(text),
      this.validateThaiCurrencyFormat(text),
      this.validateMedicalTerms(text)
    ];
    
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * ตรวจสอบว่าฟอนต์สามารถแสดงผลภาษาไทยได้ถูกต้อง
   */
  static async validateThaiRendering(page: any, selector: string): Promise<boolean> {
    try {
      // ตัวอย่างข้อความทดสอบการแสดงผลภาษาไทย
      const testText = 'การรักษาผิวหนังด้วยเทคโนโลยีทันสมัย ราคา ฿1,500 บาท';
      
      await page.fill(selector, testText);
      const renderedText = await page.inputValue(selector);
      
      return renderedText === testText;
    } catch (error) {
      console.error('Thai rendering validation failed:', error);
      return false;
    }
  }

  /**
   * เช็คลิสต์การตรวจสอบ UI ภาษาไทย
   */
  static getUIValidationChecklist() {
    return [
      'หน้าเข้าสู่ระบบ: ข้อความภาษาไทยแสดงผลถูกต้อง',
      'Dashboard ทุกระดับ: เมนู และ ป้ายกำกับเป็นภาษาไทย',
      'ฟอร์มต่างๆ: รับข้อมูลภาษาไทยได้ถูกต้อง',
      'การแจ้งเตือน: ข้อความแจ้งเตือนเป็นภาษาไทย',
      'รายงาน: รายงานและตารางแสดงผลภาษาไทย',
      'ข้อผิดพลาด: ข้อความ error เป็นภาษาไทยที่เข้าใจง่าย'
    ];
  }

  /**
   * เช็คลิสต์การทดสอบ Integration
   */
  static getIntegrationTestChecklist() {
    return [
      'POS → Loyalty: การซื้อสินค้าได้รับคะแนนอัตโนมัติ',
      'AI Sales Coach: แนะนำการขายแสดงผลใน Dashboard',
      'Commission Tracking: คอมมิชชั่นแสดงผล real-time',
      'Workflow Automation: นัดหมาย → Task → Complete workflow',
      'Analytics Integration: ข้อมูลจาก Analytics แสดงใน Dashboard',
      'Cross-system Sync: ข้อมูลซิงค์ระหว่างระบบถูกต้อง'
    ];
  }

  /**
   * เช็คลิสต์การทดสอบประสิทธิภาพ
   */
  static getPerformanceTestChecklist() {
    return [
      'Page Load Time: หน้าเว็บโหลดเสร็จภายใน 3 วินาที',
      'API Response Time: API ตอบสนองภายใน 1 วินาที',
      'Database Query: คิวรี่ฐานข้อมูลไม่เกิน 500ms',
      'Real-time Updates: ข้อมูล real-time อัปเดตภายใน 2 วินาที',
      'Concurrent Users: รองรับผู้ใช้พร้อมกัน 100+ คน',
      'Memory Usage: การใช้ memory ไม่เกิน 80% capacity'
    ];
  }
}
