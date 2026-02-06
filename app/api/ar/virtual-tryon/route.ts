import { NextRequest, NextResponse } from 'next/server';
import { VirtualTryOn } from '@/lib/ar/virtualTryOn';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'start';
    
    const body = await request.json();
    
    // Initialize product catalog
    VirtualTryOn.initializeProducts();

    switch (action) {
      case 'start':
        return startTryOnSession(body);
        
      case 'process-face':
        return processFaceImage(body);
        
      case 'apply-product':
        return applyProduct(body);
        
      case 'remove-product':
        return removeProduct(body);
        
      case 'get-result':
        return getTryOnResult(body);
        
      case 'get-cart':
        return getShoppingCart(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Virtual Try-on API error:', error);
    return NextResponse.json(
      { error: 'Virtual try-on failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'products';
    const category = searchParams.get('category');
    const sessionId = searchParams.get('sessionId');
    
    VirtualTryOn.initializeProducts();

    switch (action) {
      case 'products':
        return getProducts(category);
        
      case 'session':
        return getSession(sessionId);
        
      case 'recommendations':
        return getRecommendations(sessionId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function startTryOnSession(body: any) {
  const { customerId } = body;
  
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId' 
    }, { status: 400 });
  }
  
  try {
    const sessionId = await VirtualTryOn.startTryOnSession(customerId);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        customerId,
        startTime: new Date().toISOString()
      },
      availableCategories: [
        { id: 'foundation', name: 'Foundation', icon: '🧴' },
        { id: 'blush', name: 'Blush', icon: '🌹' },
        { id: 'lipstick', name: 'Lipstick', icon: '💄' },
        { id: 'eyeshadow', name: 'Eyeshadow', icon: '👁️' },
        { id: 'skincare', name: 'Skincare', icon: '✨' }
      ],
      instructions: [
        'Take a clear photo of your face',
        'Ensure good lighting conditions',
        'Face the camera directly',
        'Remove glasses if possible'
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to start try-on session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function processFaceImage(body: any) {
  const { sessionId, imageData } = body;
  
  if (!sessionId || !imageData) {
    return NextResponse.json({ 
      error: 'Missing sessionId or imageData' 
    }, { status: 400 });
  }
  
  try {
    const faceMapping = await VirtualTryOn.processFaceForTryOn(sessionId, imageData);
    
    if (!faceMapping) {
      return NextResponse.json({
        success: false,
        error: 'Face processing failed',
        suggestions: [
          'Ensure face is clearly visible and well-lit',
          'Face the camera directly',
          'Remove any obstructions like glasses or masks',
          'Try a different angle or lighting'
        ]
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        faceMapping,
        detectedAreas: Object.keys(faceMapping),
        processingTime: '0.8s'
      },
      readyForProducts: true,
      message: 'Face processed successfully! Ready to try products.'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Face processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function applyProduct(body: any) {
  const { sessionId, productId, area, intensity = 0.7, position } = body;
  
  if (!sessionId || !productId || !area) {
    return NextResponse.json({ 
      error: 'Missing required fields: sessionId, productId, area' 
    }, { status: 400 });
  }
  
  try {
    const success = VirtualTryOn.applyProduct(sessionId, productId, area, intensity, position);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to apply product',
        reasons: [
          'Session not found',
          'Product not found', 
          'Face mapping not available',
          'Invalid area specified'
        ]
      }, { status: 400 });
    }
    
    const session = VirtualTryOn.getSession(sessionId);
    const appliedProduct = session?.appliedProducts.find(p => p.area === area);
    
    return NextResponse.json({
      success: true,
      data: {
        appliedProduct: appliedProduct ? {
          productName: appliedProduct.product.name,
          brand: appliedProduct.product.brand,
          area: appliedProduct.area,
          intensity: appliedProduct.intensity,
          price: appliedProduct.product.price
        } : null,
        totalApplied: session?.appliedProducts.length || 0
      },
      message: `Product applied to ${area} successfully!`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Product application failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function removeProduct(body: any) {
  const { sessionId, area } = body;
  
  if (!sessionId || !area) {
    return NextResponse.json({ 
      error: 'Missing sessionId or area' 
    }, { status: 400 });
  }
  
  try {
    const success = VirtualTryOn.removeProduct(sessionId, area);
    
    return NextResponse.json({
      success,
      message: success ? `Product removed from ${area}` : 'No product found in specified area'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Product removal failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getTryOnResult(body: any) {
  const { sessionId } = body;
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId' 
    }, { status: 400 });
  }
  
  try {
    const result = VirtualTryOn.generateTryOnResult(sessionId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or no try-on data available'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      visualization: {
        available: true,
        modes: ['original', 'applied', 'comparison'],
        renderInstructions: result.renderInstructions
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get try-on result',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getShoppingCart(body: any) {
  const { sessionId } = body;
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId' 
    }, { status: 400 });
  }
  
  try {
    const cart = VirtualTryOn.calculateShoppingCart(sessionId);
    
    if (!cart) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: cart,
      checkout: {
        available: cart.items.length > 0,
        estimatedDelivery: '2-3 business days',
        freeShipping: cart.finalPrice > 2000,
        paymentMethods: ['credit_card', 'bank_transfer', 'digital_wallet']
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate cart',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getProducts(category?: string | null) {
  try {
    const products = category 
      ? VirtualTryOn.getProductsByCategory(category as any)
      : VirtualTryOn.getAllProducts();
    
    const categorizedProducts = {
      foundation: VirtualTryOn.getProductsByCategory('foundation'),
      blush: VirtualTryOn.getProductsByCategory('blush'),
      lipstick: VirtualTryOn.getProductsByCategory('lipstick'),
      eyeshadow: VirtualTryOn.getProductsByCategory('eyeshadow'),
      skincare: VirtualTryOn.getProductsByCategory('skincare')
    };

    return NextResponse.json({
      success: true,
      data: {
        products,
        categorized: categorizedProducts,
        totalProducts: products.length
      },
      filters: {
        categories: Object.keys(categorizedProducts),
        brands: [...new Set(VirtualTryOn.getAllProducts().map(p => p.brand))],
        priceRanges: [
          { min: 0, max: 1000, label: 'Under ฿1,000' },
          { min: 1000, max: 2000, label: '฿1,000 - ฿2,000' },
          { min: 2000, max: 5000, label: '฿2,000 - ฿5,000' },
          { min: 5000, max: 999999, label: 'Over ฿5,000' }
        ]
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getSession(sessionId?: string | null) {
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId' 
    }, { status: 400 });
  }

  try {
    const session = VirtualTryOn.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: session,
      statistics: {
        sessionDuration: new Date().getTime() - new Date(session.startTime).getTime(),
        productsTriedCount: session.appliedProducts.length,
        areasUsed: [...new Set(session.appliedProducts.map(p => p.area))],
        hasImage: !!session.currentImage,
        hasFaceMapping: !!session.faceMapping
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getRecommendations(sessionId?: string | null) {
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId' 
    }, { status: 400 });
  }

  try {
    const recommendations = VirtualTryOn.getRecommendations(sessionId);
    
    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        reason: 'Based on your current product selection',
        totalRecommendations: recommendations.length
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
