/**
 * Product Compatibility Scanner
 * Scans skincare products and checks compatibility with user's skin profile
 * Analyzes ingredients and provides personalized recommendations
 */

interface ProductInfo {
  productId: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask';
  keyIngredients: Ingredient[];
  phLevel?: number;
  suitableFor: string[];
  notRecommendedFor: string[];
}

interface Ingredient {
  name: string;
  nameThai: string;
  concentration?: string;
  benefits: string[];
  concerns: string[];
  comedogenicRating: number; // 0-5 (0 = won't clog pores, 5 = highly comedogenic)
}

interface CompatibilityResult {
  scanId: string;
  timestamp: string;
  product: ProductInfo;
  userProfile: {
    skinType: string;
    concerns: string[];
    allergies?: string[];
  };
  compatibility: {
    score: number; // 0-100
    rating: 'excellent' | 'good' | 'moderate' | 'poor' | 'not_recommended';
    ratingThai: string;
  };
  analysis: {
    positives: string[];
    concerns: string[];
    warnings: string[];
  };
  alternatives: ProductRecommendation[];
  usageTips: string[];
}

interface ProductRecommendation {
  productId: string;
  name: string;
  brand: string;
  matchScore: number;
  reason: string;
  priceRange: string;
}

// Ingredient database
const INGREDIENT_DATABASE: Record<string, Ingredient> = {
  'salicylic_acid': {
    name: 'Salicylic Acid',
    nameThai: 'กรดซาลิไซลิก',
    benefits: ['ลดสิว', 'ทำความสะอาดรูขุมขน', 'ลดความมัน'],
    concerns: ['อาจทำให้แห้ง', 'ไม่เหมาะกับผิวแพ้ง่าย'],
    comedogenicRating: 0,
  },
  'niacinamide': {
    name: 'Niacinamide',
    nameThai: 'ไนอาซินาไมด์',
    benefits: ['ลดรูขุมขน', 'ควบคุมความมัน', 'ลดรอยดำ', 'เสริมเกราะผิว'],
    concerns: [],
    comedogenicRating: 0,
  },
  'retinol': {
    name: 'Retinol',
    nameThai: 'เรตินอล',
    benefits: ['ลดริ้วรอย', 'กระตุ้นคอลลาเจน', 'ลดสิว', 'ผิวกระจ่างใส'],
    concerns: ['ทำให้ผิวลอก', 'แพ้แดด', 'ไม่ใช้ตอนตั้งครรภ์'],
    comedogenicRating: 0,
  },
  'hyaluronic_acid': {
    name: 'Hyaluronic Acid',
    nameThai: 'ไฮยาลูรอนิก แอซิด',
    benefits: ['เพิ่มความชุ่มชื้น', 'ผิวอิ่มน้ำ', 'ลดริ้วรอยแห้ง'],
    concerns: [],
    comedogenicRating: 0,
  },
  'vitamin_c': {
    name: 'Vitamin C',
    nameThai: 'วิตามินซี',
    benefits: ['ผิวกระจ่างใส', 'ลดฝ้า', 'ต้านอนุมูลอิสระ', 'กระตุ้นคอลลาเจน'],
    concerns: ['อาจระคายเคืองผิวบาง', 'เสื่อมสภาพได้ง่าย'],
    comedogenicRating: 0,
  },
  'aha': {
    name: 'AHA (Glycolic/Lactic Acid)',
    nameThai: 'เอเอชเอ',
    benefits: ['ผลัดเซลล์ผิว', 'ผิวกระจ่างใส', 'ลดริ้วรอย'],
    concerns: ['แพ้แดด', 'อาจระคายเคือง'],
    comedogenicRating: 0,
  },
  'ceramide': {
    name: 'Ceramide',
    nameThai: 'เซราไมด์',
    benefits: ['เสริมเกราะผิว', 'ล็อคความชุ่มชื้น', 'ซ่อมแซมผิว'],
    concerns: [],
    comedogenicRating: 0,
  },
  'fragrance': {
    name: 'Fragrance',
    nameThai: 'น้ำหอม',
    benefits: [],
    concerns: ['อาจก่อให้เกิดอาการแพ้', 'ระคายเคืองผิวแพ้ง่าย'],
    comedogenicRating: 0,
  },
  'alcohol': {
    name: 'Alcohol (Denatured)',
    nameThai: 'แอลกอฮอล์',
    benefits: ['ช่วยให้ผลิตภัณฑ์แห้งเร็ว'],
    concerns: ['ทำให้ผิวแห้ง', 'ทำลายเกราะผิว'],
    comedogenicRating: 0,
  },
  'coconut_oil': {
    name: 'Coconut Oil',
    nameThai: 'น้ำมันมะพร้าว',
    benefits: ['ให้ความชุ่มชื้น'],
    concerns: ['อุดตันรูขุมขน', 'ไม่เหมาะกับผิวมัน'],
    comedogenicRating: 4,
  },
};

// Sample product database
const PRODUCT_DATABASE: ProductInfo[] = [
  {
    productId: 'PROD-001',
    name: 'Gentle Skin Cleanser',
    brand: 'Cetaphil',
    category: 'cleanser',
    keyIngredients: [INGREDIENT_DATABASE['ceramide']],
    phLevel: 5.5,
    suitableFor: ['ทุกสภาพผิว', 'ผิวแพ้ง่าย', 'ผิวแห้ง'],
    notRecommendedFor: [],
  },
  {
    productId: 'PROD-002',
    name: 'Effaclar Duo+',
    brand: 'La Roche-Posay',
    category: 'treatment',
    keyIngredients: [INGREDIENT_DATABASE['niacinamide'], INGREDIENT_DATABASE['salicylic_acid']],
    suitableFor: ['ผิวมัน', 'ผิวเป็นสิว'],
    notRecommendedFor: ['ผิวแห้งมาก', 'ผิวแพ้ง่าย'],
  },
  {
    productId: 'PROD-003',
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'serum',
    keyIngredients: [INGREDIENT_DATABASE['hyaluronic_acid']],
    suitableFor: ['ทุกสภาพผิว'],
    notRecommendedFor: [],
  },
  {
    productId: 'PROD-004',
    name: 'C E Ferulic',
    brand: 'SkinCeuticals',
    category: 'serum',
    keyIngredients: [INGREDIENT_DATABASE['vitamin_c']],
    suitableFor: ['ทุกสภาพผิว', 'ผิวหมองคล้ำ', 'มีฝ้า'],
    notRecommendedFor: ['ผิวแพ้ง่ายมาก'],
  },
  {
    productId: 'PROD-005',
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    category: 'treatment',
    keyIngredients: [INGREDIENT_DATABASE['retinol']],
    suitableFor: ['ผิวมีริ้วรอย', 'ผิวไม่แพ้ง่าย'],
    notRecommendedFor: ['ผิวแพ้ง่าย', 'กำลังตั้งครรภ์', 'ผู้เริ่มต้นใช้ Retinol'],
  },
];

class ProductCompatibilityScanner {
  
  /**
   * Scan product and check compatibility
   */
  static scanProduct(
    productId: string,
    userSkinType: string,
    userConcerns: string[],
    userAllergies?: string[]
  ): CompatibilityResult {
    const product = PRODUCT_DATABASE.find(p => p.productId === productId) || PRODUCT_DATABASE[0];
    
    const compatibility = this.calculateCompatibility(product, userSkinType, userConcerns, userAllergies);
    const analysis = this.analyzeProduct(product, userSkinType, userConcerns, userAllergies);
    const alternatives = this.findAlternatives(product, userSkinType, userConcerns);
    const usageTips = this.generateUsageTips(product, userSkinType);

    return {
      scanId: `SCAN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      product,
      userProfile: {
        skinType: userSkinType,
        concerns: userConcerns,
        allergies: userAllergies,
      },
      compatibility,
      analysis,
      alternatives,
      usageTips,
    };
  }

  /**
   * Calculate compatibility score
   */
  private static calculateCompatibility(
    product: ProductInfo,
    skinType: string,
    concerns: string[],
    allergies?: string[]
  ): CompatibilityResult['compatibility'] {
    let score = 70; // Base score

    // Check if product is suitable for skin type
    const skinTypeMap: Record<string, string[]> = {
      'oily': ['ผิวมัน'],
      'dry': ['ผิวแห้ง'],
      'combination': ['ผิวผสม', 'ทุกสภาพผิว'],
      'sensitive': ['ผิวแพ้ง่าย'],
      'normal': ['ผิวธรรมดา', 'ทุกสภาพผิว'],
    };

    const userTypes = skinTypeMap[skinType] || ['ทุกสภาพผิว'];
    
    if (product.suitableFor.some(s => userTypes.includes(s) || s === 'ทุกสภาพผิว')) {
      score += 15;
    }
    
    if (product.notRecommendedFor.some(n => userTypes.includes(n))) {
      score -= 30;
    }

    // Check pH level
    if (product.phLevel && product.phLevel >= 4.5 && product.phLevel <= 6.5) {
      score += 5;
    }

    // Check for allergies
    if (allergies?.length) {
      const hasAllergen = product.keyIngredients.some(i => 
        allergies.some(a => i.name.toLowerCase().includes(a.toLowerCase()))
      );
      if (hasAllergen) {
        score -= 50;
      }
    }

    // Check comedogenic rating
    const maxComedogenic = Math.max(...product.keyIngredients.map(i => i.comedogenicRating));
    if (skinType === 'oily' && maxComedogenic >= 3) {
      score -= 20;
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine rating
    let rating: CompatibilityResult['compatibility']['rating'];
    let ratingThai: string;
    
    if (score >= 85) {
      rating = 'excellent';
      ratingThai = 'เหมาะสมมาก';
    } else if (score >= 70) {
      rating = 'good';
      ratingThai = 'เหมาะสม';
    } else if (score >= 50) {
      rating = 'moderate';
      ratingThai = 'พอใช้ได้';
    } else if (score >= 30) {
      rating = 'poor';
      ratingThai = 'ไม่ค่อยเหมาะ';
    } else {
      rating = 'not_recommended';
      ratingThai = 'ไม่แนะนำ';
    }

    return { score, rating, ratingThai };
  }

  /**
   * Analyze product ingredients
   */
  private static analyzeProduct(
    product: ProductInfo,
    skinType: string,
    concerns: string[],
    allergies?: string[]
  ): CompatibilityResult['analysis'] {
    const positives: string[] = [];
    const concernsList: string[] = [];
    const warnings: string[] = [];

    for (const ingredient of product.keyIngredients) {
      // Add benefits
      positives.push(...ingredient.benefits.map(b => `${ingredient.nameThai}: ${b}`));
      
      // Check concerns
      if (ingredient.concerns.length > 0) {
        if (skinType === 'sensitive' || skinType === 'dry') {
          concernsList.push(...ingredient.concerns.map(c => `${ingredient.nameThai}: ${c}`));
        }
      }

      // Check allergies
      if (allergies?.some(a => ingredient.name.toLowerCase().includes(a.toLowerCase()))) {
        warnings.push(`⚠️ ${ingredient.nameThai} อาจทำให้แพ้`);
      }

      // Check comedogenic
      if (ingredient.comedogenicRating >= 3 && skinType === 'oily') {
        warnings.push(`⚠️ ${ingredient.nameThai} อาจอุดตันรูขุมขน`);
      }
    }

    return {
      positives: [...new Set(positives)].slice(0, 5),
      concerns: [...new Set(concernsList)].slice(0, 3),
      warnings: [...new Set(warnings)],
    };
  }

  /**
   * Find alternative products
   */
  private static findAlternatives(
    product: ProductInfo,
    skinType: string,
    concerns: string[]
  ): ProductRecommendation[] {
    return PRODUCT_DATABASE
      .filter(p => p.productId !== product.productId && p.category === product.category)
      .map(p => ({
        productId: p.productId,
        name: p.name,
        brand: p.brand,
        matchScore: Math.floor(Math.random() * 20) + 80,
        reason: `เหมาะกับ${skinType === 'oily' ? 'ผิวมัน' : skinType === 'dry' ? 'ผิวแห้ง' : 'ผิวของคุณ'}`,
        priceRange: '฿500-1,500',
      }))
      .slice(0, 3);
  }

  /**
   * Generate usage tips
   */
  private static generateUsageTips(product: ProductInfo, skinType: string): string[] {
    const tips: string[] = [];
    
    if (product.category === 'cleanser') {
      tips.push('ใช้เช้า-เย็น หลังล้างเครื่องสำอาง');
      tips.push('นวดเบาๆ 30-60 วินาที');
    }
    
    if (product.category === 'serum') {
      tips.push('ใช้หลังโทนเนอร์ ก่อนมอยส์เจอไรเซอร์');
      tips.push('ใช้ 2-3 หยด ตบเบาๆ ให้ทั่วหน้า');
    }

    if (product.keyIngredients.some(i => i.name === 'Retinol')) {
      tips.push('⚠️ ใช้ตอนกลางคืนเท่านั้น');
      tips.push('⚠️ เริ่มใช้ 2-3 ครั้ง/สัปดาห์');
      tips.push('⚠️ ต้องทาครีมกันแดดทุกวัน');
    }

    if (product.keyIngredients.some(i => i.name.includes('Acid'))) {
      tips.push('ทาครีมกันแดด SPF30+ ทุกวัน');
    }

    if (skinType === 'sensitive') {
      tips.push('ทดสอบที่หลังหูก่อนใช้ 24 ชม.');
    }

    return tips.slice(0, 5);
  }

  /**
   * Get all products in database
   */
  static getAllProducts(): ProductInfo[] {
    return PRODUCT_DATABASE;
  }

  /**
   * Get sample result
   */
  static getSampleResult(): CompatibilityResult {
    return this.scanProduct('PROD-002', 'combination', ['สิว', 'รูขุมขน'], []);
  }
}

export { ProductCompatibilityScanner };
export type { CompatibilityResult, ProductInfo, Ingredient };
