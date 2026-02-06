import { NextRequest, NextResponse } from 'next/server';
import { ProductCompatibilityScanner } from '@/lib/analysis/productCompatibilityScanner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'products') {
      const products = ProductCompatibilityScanner.getAllProducts();
      return NextResponse.json({ success: true, data: products });
    }

    const result = ProductCompatibilityScanner.getSampleResult();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Product scan error:', error);
    return NextResponse.json({ success: false, error: 'Scan failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, skinType, concerns, allergies } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const result = ProductCompatibilityScanner.scanProduct(
      productId,
      skinType || 'combination',
      concerns || [],
      allergies
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Product scan POST error:', error);
    return NextResponse.json({ success: false, error: 'Scan failed' }, { status: 500 });
  }
}
