/**
 * Virtual Try-on System for Skincare Products
 */

interface SkinProduct {
  id: string;
  name: string;
  brand: string;
  category: 'foundation' | 'blush' | 'lipstick' | 'eyeshadow' | 'skincare';
  color?: string;
  texture: 'matte' | 'glossy' | 'satin' | 'cream' | 'liquid';
  coverage: 'light' | 'medium' | 'full';
  price: number;
  imageUrl: string;
  colorHex?: string;
  opacity: number; // 0-1
  blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light';
}

interface FaceMapping {
  cheeks: { x: number; y: number; radius: number }[];
  lips: { points: { x: number; y: number }[] };
  eyes: { left: { x: number; y: number }; right: { x: number; y: number } };
  forehead: { x: number; y: number; width: number; height: number };
  chin: { x: number; y: number; radius: number };
  jawline: { points: { x: number; y: number }[] };
}

interface TryOnSession {
  id: string;
  customerId: string;
  startTime: string;
  appliedProducts: AppliedProduct[];
  faceMapping: FaceMapping | null;
  currentImage: string | null;
}

interface AppliedProduct {
  product: SkinProduct;
  area: keyof FaceMapping;
  intensity: number; // 0-1
  position: { x: number; y: number };
  size: number;
  rotation: number;
  appliedAt: string;
}

class VirtualTryOn {
  private static sessions: Map<string, TryOnSession> = new Map();
  private static productCatalog: SkinProduct[] = [];

  /**
   * Initialize product catalog
   */
  static initializeProducts() {
    this.productCatalog = [
      // Foundations
      {
        id: 'found_001',
        name: 'Perfect Base Foundation',
        brand: 'BN Beauty',
        category: 'foundation',
        texture: 'liquid',
        coverage: 'medium',
        price: 1200,
        imageUrl: '/products/foundation-01.jpg',
        colorHex: '#F5DEB3',
        opacity: 0.7,
        blendMode: 'normal'
      },
      {
        id: 'found_002', 
        name: 'Natural Glow Foundation',
        brand: 'BN Beauty',
        category: 'foundation',
        texture: 'cream',
        coverage: 'light',
        price: 1500,
        imageUrl: '/products/foundation-02.jpg',
        colorHex: '#F4C2A1',
        opacity: 0.6,
        blendMode: 'soft-light'
      },

      // Blush
      {
        id: 'blush_001',
        name: 'Rose Petal Blush',
        brand: 'BN Beauty',
        category: 'blush',
        color: 'rose pink',
        texture: 'matte',
        coverage: 'light',
        price: 850,
        imageUrl: '/products/blush-01.jpg',
        colorHex: '#F8BBD9',
        opacity: 0.4,
        blendMode: 'overlay'
      },
      {
        id: 'blush_002',
        name: 'Coral Dreams Blush',
        brand: 'BN Beauty', 
        category: 'blush',
        color: 'coral',
        texture: 'satin',
        coverage: 'medium',
        price: 950,
        imageUrl: '/products/blush-02.jpg',
        colorHex: '#FF7F7F',
        opacity: 0.5,
        blendMode: 'multiply'
      },

      // Lipstick
      {
        id: 'lip_001',
        name: 'Velvet Red Lipstick',
        brand: 'BN Beauty',
        category: 'lipstick',
        color: 'red',
        texture: 'matte',
        coverage: 'full',
        price: 680,
        imageUrl: '/products/lipstick-01.jpg',
        colorHex: '#DC143C',
        opacity: 0.8,
        blendMode: 'normal'
      },
      {
        id: 'lip_002',
        name: 'Berry Gloss',
        brand: 'BN Beauty',
        category: 'lipstick',
        color: 'berry',
        texture: 'glossy',
        coverage: 'medium',
        price: 750,
        imageUrl: '/products/lipstick-02.jpg',
        colorHex: '#8B0A50',
        opacity: 0.6,
        blendMode: 'overlay'
      },

      // Skincare Products
      {
        id: 'skin_001',
        name: 'Vitamin C Serum',
        brand: 'BN Skincare',
        category: 'skincare',
        texture: 'liquid',
        coverage: 'light',
        price: 2200,
        imageUrl: '/products/serum-01.jpg',
        colorHex: '#FFF8DC',
        opacity: 0.3,
        blendMode: 'soft-light'
      }
    ];

    console.log(`💄 Product catalog initialized: ${this.productCatalog.length} products`);
  }

  /**
   * Start virtual try-on session
   */
  static async startTryOnSession(customerId: string): Promise<string> {
    const sessionId = `tryonon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: TryOnSession = {
      id: sessionId,
      customerId,
      startTime: new Date().toISOString(),
      appliedProducts: [],
      faceMapping: null,
      currentImage: null
    };

    this.sessions.set(sessionId, session);
    console.log(`👗 Virtual try-on session started: ${sessionId}`);
    
    return sessionId;
  }

  /**
   * Process face image and create face mapping
   */
  static async processFaceForTryOn(sessionId: string, imageData: string): Promise<FaceMapping | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    try {
      // Mock face landmark detection - in production would use MediaPipe or face-api.js
      const faceMapping: FaceMapping = {
        cheeks: [
          { x: 0.25, y: 0.45, radius: 0.08 }, // Left cheek
          { x: 0.75, y: 0.45, radius: 0.08 }  // Right cheek
        ],
        lips: {
          points: [
            { x: 0.45, y: 0.7 }, { x: 0.5, y: 0.68 }, { x: 0.55, y: 0.7 },
            { x: 0.55, y: 0.74 }, { x: 0.5, y: 0.76 }, { x: 0.45, y: 0.74 }
          ]
        },
        eyes: {
          left: { x: 0.35, y: 0.4 },
          right: { x: 0.65, y: 0.4 }
        },
        forehead: { x: 0.5, y: 0.2, width: 0.4, height: 0.2 },
        chin: { x: 0.5, y: 0.85, radius: 0.06 },
        jawline: {
          points: [
            { x: 0.15, y: 0.6 }, { x: 0.2, y: 0.75 }, { x: 0.35, y: 0.85 },
            { x: 0.5, y: 0.9 }, { x: 0.65, y: 0.85 }, { x: 0.8, y: 0.75 }, { x: 0.85, y: 0.6 }
          ]
        }
      };

      session.faceMapping = faceMapping;
      session.currentImage = imageData;
      
      console.log('🎯 Face mapping created for try-on');
      return faceMapping;

    } catch (error) {
      console.error('❌ Face processing failed:', error);
      return null;
    }
  }

  /**
   * Apply product to face
   */
  static applyProduct(
    sessionId: string, 
    productId: string, 
    area: keyof FaceMapping,
    intensity: number = 0.7,
    position?: { x: number; y: number }
  ): boolean {
    const session = this.sessions.get(sessionId);
    const product = this.productCatalog.find(p => p.id === productId);
    
    if (!session || !product || !session.faceMapping) return false;

    // Calculate position based on face mapping if not provided
    let finalPosition = position;
    if (!finalPosition) {
      finalPosition = this.calculateProductPosition(session.faceMapping, area);
    }

    const appliedProduct: AppliedProduct = {
      product,
      area,
      intensity,
      position: finalPosition,
      size: this.calculateProductSize(area),
      rotation: 0,
      appliedAt: new Date().toISOString()
    };

    // Remove existing product in same area
    session.appliedProducts = session.appliedProducts.filter(p => p.area !== area);
    
    // Add new product
    session.appliedProducts.push(appliedProduct);

    console.log(`💄 Applied ${product.name} to ${area} with ${intensity * 100}% intensity`);
    return true;
  }

  /**
   * Remove product from area
   */
  static removeProduct(sessionId: string, area: keyof FaceMapping): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const initialLength = session.appliedProducts.length;
    session.appliedProducts = session.appliedProducts.filter(p => p.area !== area);
    
    return session.appliedProducts.length < initialLength;
  }

  /**
   * Get products by category
   */
  static getProductsByCategory(category: SkinProduct['category']): SkinProduct[] {
    return this.productCatalog.filter(p => p.category === category);
  }

  /**
   * Get all products
   */
  static getAllProducts(): SkinProduct[] {
    return [...this.productCatalog];
  }

  /**
   * Get session data
   */
  static getSession(sessionId: string): TryOnSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Generate try-on result for rendering
   */
  static generateTryOnResult(sessionId: string): {
    originalImage: string | null;
    appliedProducts: AppliedProduct[];
    faceMapping: FaceMapping | null;
    renderInstructions: any[];
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const renderInstructions = session.appliedProducts.map(applied => ({
      productId: applied.product.id,
      area: applied.area,
      position: applied.position,
      size: applied.size,
      color: applied.product.colorHex,
      opacity: applied.product.opacity * applied.intensity,
      blendMode: applied.product.blendMode,
      texture: applied.product.texture
    }));

    return {
      originalImage: session.currentImage,
      appliedProducts: session.appliedProducts,
      faceMapping: session.faceMapping,
      renderInstructions
    };
  }

  /**
   * Get product recommendations based on applied products
   */
  static getRecommendations(sessionId: string): SkinProduct[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const appliedCategories = new Set(session.appliedProducts.map(p => p.product.category));
    
    // Recommend complementary products
    const recommendations = [];
    
    if (appliedCategories.has('foundation') && !appliedCategories.has('blush')) {
      recommendations.push(...this.getProductsByCategory('blush').slice(0, 2));
    }
    
    if (appliedCategories.has('blush') && !appliedCategories.has('lipstick')) {
      recommendations.push(...this.getProductsByCategory('lipstick').slice(0, 2));
    }
    
    if (!appliedCategories.has('skincare')) {
      recommendations.push(...this.getProductsByCategory('skincare').slice(0, 1));
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  /**
   * Calculate shopping cart from applied products
   */
  static calculateShoppingCart(sessionId: string): {
    items: { product: SkinProduct; quantity: number }[];
    totalPrice: number;
    discounts: { type: string; amount: number; description: string }[];
    finalPrice: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const items = session.appliedProducts.map(applied => ({
      product: applied.product,
      quantity: 1
    }));

    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Apply discounts
    const discounts = [];
    let finalPrice = totalPrice;

    // Bundle discount for 3+ items
    if (items.length >= 3) {
      const bundleDiscount = totalPrice * 0.15; // 15% off
      discounts.push({
        type: 'bundle',
        amount: bundleDiscount,
        description: 'Bundle discount (3+ items): 15% off'
      });
      finalPrice -= bundleDiscount;
    }

    // First-time customer discount
    const isFirstTime = true; // Mock - would check customer history
    if (isFirstTime) {
      const firstTimeDiscount = totalPrice * 0.10; // 10% off
      discounts.push({
        type: 'first_time',
        amount: firstTimeDiscount,
        description: 'First-time customer: 10% off'
      });
      finalPrice -= firstTimeDiscount;
    }

    return {
      items,
      totalPrice,
      discounts,
      finalPrice: Math.max(0, finalPrice)
    };
  }

  /**
   * End try-on session
   */
  static endTryOnSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    console.log(`🛍️ Try-on session ended: ${sessionId}`);
    console.log(`💄 Products tried: ${session.appliedProducts.length}`);
    
    // Keep session for potential purchase - don't delete immediately
    return true;
  }

  /**
   * Private helper methods
   */
  private static calculateProductPosition(faceMapping: FaceMapping, area: keyof FaceMapping): { x: number; y: number } {
    switch (area) {
      case 'cheeks':
        return faceMapping.cheeks[0]; // Default to left cheek
      case 'lips':
        const lipPoints = faceMapping.lips.points;
        return {
          x: lipPoints.reduce((sum, p) => sum + p.x, 0) / lipPoints.length,
          y: lipPoints.reduce((sum, p) => sum + p.y, 0) / lipPoints.length
        };
      case 'eyes':
        return faceMapping.eyes.left;
      case 'forehead':
        return { x: faceMapping.forehead.x, y: faceMapping.forehead.y };
      case 'chin':
        return faceMapping.chin;
      case 'jawline':
        const jawPoints = faceMapping.jawline.points;
        return {
          x: jawPoints.reduce((sum, p) => sum + p.x, 0) / jawPoints.length,
          y: jawPoints.reduce((sum, p) => sum + p.y, 0) / jawPoints.length
        };
      default:
        return { x: 0.5, y: 0.5 };
    }
  }

  private static calculateProductSize(area: keyof FaceMapping): number {
    const sizeMap = {
      cheeks: 0.15,
      lips: 0.08,
      eyes: 0.06,
      forehead: 0.25,
      chin: 0.10,
      jawline: 0.20
    };

    return sizeMap[area] || 0.10;
  }
}

export { VirtualTryOn, type SkinProduct, type TryOnSession, type FaceMapping };
