// Dynamic Proposal Templates with Auto-pricing System

export interface TreatmentItem {
  id: string;
  name: string;
  category: 'filler' | 'laser' | 'facial' | 'skincare';
  basePrice: number;
  sessionsRequired: number;
  duration: string; // e.g., "45 minutes"
  description: string;
  benefits: string[];
  aftercare: string[];
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  targetAudience: string[];
  discountPercentage: number;
  validityDays: number;
  includedServices: string[];
  template: string;
}

export interface ProposalData {
  customer: {
    name: string;
    age: number;
    skinConcerns: string[];
    analysisScore: number;
  };
  treatments: TreatmentItem[];
  clinicInfo: {
    name: string;
    phone: string;
    address: string;
    doctor: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    packageDiscount?: number;
  };
  timeline: string;
  validity: string;
}

// Treatment Database with Dynamic Pricing
export const TREATMENT_DATABASE: TreatmentItem[] = [
  {
    id: 'filler-ha-basic',
    name: 'Hyaluronic Acid Filler',
    category: 'filler',
    basePrice: 18000,
    sessionsRequired: 1,
    duration: '60 minutes',
    description: 'เติมเต็มร่องลึก ปรับรูปหน้าให้สมส่วน',
    benefits: ['เติมเต็มร่องลึกใต้ตา', 'ปรับแก้มให้อิ่มเอิบ', 'ผลลัพธ์ทันที', 'ธรรมชาติ'],
    aftercare: ['หลีกเลี่ยงการนวด 24 ชั่วโมง', 'ไม่ควรออกกำลังกายหนัก 2 วัน']
  },
  {
    id: 'laser-pico',
    name: 'Pico Genesis Laser',
    category: 'laser',
    basePrice: 12000,
    sessionsRequired: 3,
    duration: '30 minutes',
    description: 'กำจัดจุดด่างดำ ปรับสีผิวให้สม่ำเสมอ',
    benefits: ['ลดจุดด่างดำ', 'กระชับรูขุมขน', 'ผิวขาวใส', 'ลดริ้วรอยเล็กน้อย'],
    aftercare: ['ใช้ครีมกันแดด SPF 50+', 'หลีกเลี่ยงแสงแดดจัด']
  },
  {
    id: 'facial-hydra',
    name: 'HydraFacial MD',
    category: 'facial',
    basePrice: 4500,
    sessionsRequired: 4,
    duration: '45 minutes',
    description: 'ทำความสะอาดลึก ฟื้นฟูผิวครบวงจร',
    benefits: ['ทำความสะอาดลึก', 'เพิ่มความชุ่มชื้น', 'ลดรูขุมขน', 'ผิวเรียบเนียน'],
    aftercare: ['ดื่มน้ำเยอะ', 'ใช้ครีมบำรุงอย่างสม่ำเสมอ']
  }
];

// Proposal Templates
export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'premium-complete',
    name: 'Premium Complete Package',
    description: 'แพ็กเกจครบวงจร สำหรับลูกค้าที่ต้องการการรักษาแบบเบ็ดเสร็จ',
    targetAudience: ['high-budget', 'multiple-concerns', 'immediate-results'],
    discountPercentage: 15,
    validityDays: 30,
    includedServices: ['ปรึกษาแพทย์ฟรี', 'ติดตามผลหลังรักษา', 'ครีมบำรุงพิเศษ'],
    template: 'premium'
  },
  {
    id: 'gradual-treatment',
    name: 'Gradual Enhancement Plan',
    description: 'แผนการรักษาแบบค่อยเป็นค่อยไป เหมาะสำหรับผู้เริ่มต้น',
    targetAudience: ['budget-conscious', 'first-time', 'gradual-improvement'],
    discountPercentage: 8,
    validityDays: 45,
    includedServices: ['คำปรึกษาฟรี', 'ติดตามผล 1 ครั้ง'],
    template: 'gradual'
  },
  {
    id: 'maintenance-plan',
    name: 'Skin Maintenance Plan',
    description: 'แผนดูแลผิวระยะยาว เพื่อรักษาผลลัพธ์',
    targetAudience: ['maintenance', 'prevention', 'long-term'],
    discountPercentage: 12,
    validityDays: 60,
    includedServices: ['ตรวจสอบผิวฟรีทุก 3 เดือน', 'ส่วนลดครีมบำรุง 20%'],
    template: 'maintenance'
  }
];

export function calculateDynamicPricing(
  treatments: TreatmentItem[],
  leadScore: number,
  urgency: 'high' | 'medium' | 'low',
  packageType: 'single' | 'package' | 'premium'
): ProposalData['pricing'] {
  
  const baseTotal = treatments.reduce((sum, t) => sum + (t.basePrice * t.sessionsRequired), 0);
  
  // Dynamic discount based on lead score
  let discountPercentage = 0;
  if (leadScore >= 80) discountPercentage = 15; // Hot leads get best discount
  else if (leadScore >= 60) discountPercentage = 10; // Warm leads
  else discountPercentage = 5; // Cold leads get small discount to encourage
  
  // Urgency multiplier
  const urgencyMultiplier = urgency === 'high' ? 1.05 : urgency === 'medium' ? 1.0 : 0.95;
  
  // Package discount
  let packageDiscount = 0;
  if (packageType === 'package') packageDiscount = 0.08;
  else if (packageType === 'premium') packageDiscount = 0.12;
  
  const subtotal = Math.round(baseTotal * urgencyMultiplier);
  const discount = Math.round(subtotal * (discountPercentage / 100));
  const packageDiscountAmount = Math.round(subtotal * packageDiscount);
  const total = subtotal - discount - packageDiscountAmount;
  
  return {
    subtotal,
    discount: discount + packageDiscountAmount,
    total,
    packageDiscount: packageDiscountAmount
  };
}

export function generateProposal(data: ProposalData, templateType: string = 'premium'): string {
  const template = PROPOSAL_TEMPLATES.find(t => t.template === templateType) || PROPOSAL_TEMPLATES[0];
  
  return `
<div class="proposal-document">
  <header class="proposal-header">
    <div class="clinic-branding">
      <h1>${data.clinicInfo.name}</h1>
      <p>แพทย์ผู้เชี่ยวชาญ: ${data.clinicInfo.doctor}</p>
      <p>${data.clinicInfo.address} | โทร: ${data.clinicInfo.phone}</p>
    </div>
  </header>

  <section class="customer-info">
    <h2>ข้อเสนอการรักษาสำหรับ</h2>
    <h3>คุณ${data.customer.name}</h3>
    <p class="analysis-summary">
      ผลการวิเคราะห์ผิวด้วย AI: <strong>${data.customer.analysisScore}/100</strong>
    </p>
    <div class="concerns">
      <h4>ปัญหาผิวที่พบ:</h4>
      <ul>
        ${data.customer.skinConcerns.map(concern => `<li>${concern}</li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="treatment-plan">
    <h2>แผนการรักษาที่แนะนำ</h2>
    ${data.treatments.map((treatment, index) => `
      <div class="treatment-item">
        <h3>${index + 1}. ${treatment.name}</h3>
        <div class="treatment-details">
          <p class="description">${treatment.description}</p>
          <div class="treatment-specs">
            <span class="duration">ระยะเวลา: ${treatment.duration}</span>
            <span class="sessions">จำนวนครั้ง: ${treatment.sessionsRequired}</span>
          </div>
          
          <div class="benefits">
            <h4>ประโยชน์ที่ได้รับ:</h4>
            <ul>
              ${treatment.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>

          <div class="aftercare">
            <h4>การดูแลหลังรักษา:</h4>
            <ul>
              ${treatment.aftercare.map(care => `<li>${care}</li>`).join('')}
            </ul>
          </div>
          
          <div class="pricing">
            <span class="price">฿${treatment.basePrice.toLocaleString()} x ${treatment.sessionsRequired} = ฿${(treatment.basePrice * treatment.sessionsRequired).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).join('')}
  </section>

  <section class="pricing-summary">
    <h2>สรุปค่าใช้จ่าย</h2>
    <div class="pricing-breakdown">
      <div class="line-item">
        <span>ค่ารักษารวม</span>
        <span>฿${data.pricing.subtotal.toLocaleString()}</span>
      </div>
      ${data.pricing.discount > 0 ? `
      <div class="line-item discount">
        <span>ส่วนลดพิเศษ</span>
        <span>-฿${data.pricing.discount.toLocaleString()}</span>
      </div>
      ` : ''}
      <div class="line-item total">
        <span><strong>ยอดรวมสุทธิ</strong></span>
        <span><strong>฿${data.pricing.total.toLocaleString()}</strong></span>
      </div>
    </div>
    
    <div class="payment-options">
      <h3>ตัวเลือกการชำระเงิน</h3>
      <ul>
        <li>💳 ชำระเต็มจำนวน (ได้ส่วนลดเพิ่ม 3%)</li>
        <li>📅 ผ่อนชำระ 0% (สำหรับยอดเกิน 15,000 บาท)</li>
        <li>🏦 โอนธนาคาร / พร้อมเพย์</li>
      </ul>
    </div>
  </section>

  <section class="included-services">
    <h2>บริการที่รวมในแพ็กเกจ</h2>
    <ul class="services-list">
      ${template.includedServices.map(service => `<li>✓ ${service}</li>`).join('')}
    </ul>
  </section>

  <section class="timeline">
    <h2>กำหนดเวลาการรักษา</h2>
    <p>${data.timeline}</p>
    <div class="booking-cta">
      <h3>📅 พร้อมเริ่มต้นแล้วใช่ไหม?</h3>
      <p>โทรจองคิวได้ทันทีที่ <strong>${data.clinicInfo.phone}</strong></p>
      <p class="urgency">⏰ ข้อเสนอพิเศษนี้มีอายุถึง <strong>${data.validity}</strong></p>
    </div>
  </section>

  <footer class="proposal-footer">
    <div class="guarantees">
      <h3>การันตีจากเรา</h3>
      <ul>
        <li>🏥 แพทย์ผู้เชี่ยวชาญรับรอง</li>
        <li>🔬 เทคโนโลยี AI ล่าสุด</li>
        <li>📞 ติดตามผลหลังรักษา</li>
        <li>🛡️ มาตรฐานความปลอดภัยสูง</li>
      </ul>
    </div>
    
    <div class="contact-info">
      <p>สอบถามเพิ่มเติม: ${data.clinicInfo.phone}</p>
      <p>หรือแชทผ่าน Line: @bn-aura</p>
    </div>
  </footer>
</div>
  `;
}

// Auto-select appropriate template based on customer profile
export function selectOptimalTemplate(
  customerProfile: Record<string, unknown>,
  leadScore: number,
  treatmentCount: number
): ProposalTemplate {
  
  if (leadScore >= 80 && treatmentCount >= 3) {
    return PROPOSAL_TEMPLATES.find(t => t.id === 'premium-complete') || PROPOSAL_TEMPLATES[0];
  }
  
  if (leadScore >= 50 && treatmentCount <= 2) {
    return PROPOSAL_TEMPLATES.find(t => t.id === 'gradual-treatment') || PROPOSAL_TEMPLATES[1];
  }
  
  return PROPOSAL_TEMPLATES.find(t => t.id === 'maintenance-plan') || PROPOSAL_TEMPLATES[2];
}
