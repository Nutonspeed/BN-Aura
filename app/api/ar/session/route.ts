import { NextRequest, NextResponse } from 'next/server';
import { ARCore } from '@/lib/ar/arCore';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'start';
    
    const body = await request.json();
    
    await ARCore.initialize();

    switch (action) {
      case 'start':
        return startARSession(body);
        
      case 'capture':
        return captureImage(body);
        
      case 'simulate':
        return simulateTreatment(body);
        
      case 'end':
        return endARSession(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('AR API error:', error);
    return NextResponse.json(
      { error: 'AR operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    const session = ARCore.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: session,
      metadata: {
        captureCount: session.captures.length,
        sessionDuration: new Date().getTime() - new Date(session.startTime).getTime(),
        sessionType: session.sessionType
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function startARSession(body: any) {
  const { customerId, clinicId, sessionType } = body;
  
  if (!customerId || !sessionType) {
    return NextResponse.json({ 
      error: 'Missing required fields: customerId, sessionType' 
    }, { status: 400 });
  }
  
  try {
    const sessionId = await ARCore.startARSession(customerId, sessionType);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        sessionType,
        customerId,
        clinicId,
        startTime: new Date().toISOString()
      },
      instructions: {
        nextStep: 'capture',
        requirements: [
          'Good lighting conditions',
          'Face clearly visible',
          'Camera permissions enabled'
        ]
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to start AR session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function captureImage(body: any) {
  const { sessionId, imageData } = body;
  
  if (!sessionId || !imageData) {
    return NextResponse.json({ 
      error: 'Missing sessionId or imageData' 
    }, { status: 400 });
  }
  
  try {
    const capture = await ARCore.captureFaceGeometry(sessionId, imageData);
    
    if (!capture) {
      return NextResponse.json({
        success: false,
        error: 'Face capture failed',
        suggestions: [
          'Ensure face is clearly visible',
          'Improve lighting conditions',
          'Position face in center of frame'
        ]
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        captureId: capture.id,
        confidence: capture.confidence,
        landmarks: Object.keys(capture.faceGeometry.landmarks).length,
        timestamp: capture.timestamp
      },
      analysis: {
        quality: capture.confidence > 0.8 ? 'Excellent' : 
                capture.confidence > 0.6 ? 'Good' : 'Needs Improvement',
        recommendations: generateCaptureRecommendations(capture.confidence)
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Image capture failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function simulateTreatment(body: any) {
  const { sessionId, treatmentType, targetAreas, intensity } = body;
  
  if (!sessionId || !treatmentType) {
    return NextResponse.json({ 
      error: 'Missing sessionId or treatmentType' 
    }, { status: 400 });
  }
  
  try {
    const simulation = await ARCore.simulateTreatment(sessionId, treatmentType);
    
    if (!simulation) {
      return NextResponse.json({
        success: false,
        error: 'Treatment simulation failed',
        reason: 'No valid face captures found in session'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: simulation,
      visualization: {
        available: true,
        renderingOptions: ['3D Model', '2D Overlay', 'Before/After'],
        interactionModes: ['Rotate', 'Zoom', 'Compare']
      },
      treatmentInfo: generateTreatmentInfo(treatmentType, targetAreas, intensity)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Treatment simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function endARSession(body: any) {
  const { sessionId } = body;
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: 'Missing sessionId' 
    }, { status: 400 });
  }
  
  try {
    const session = ARCore.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }
    
    const sessionSummary = {
      sessionId,
      duration: new Date().getTime() - new Date(session.startTime).getTime(),
      totalCaptures: session.captures.length,
      sessionType: session.sessionType,
      customerId: session.customerId,
      endTime: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: sessionSummary,
      export: {
        available: true,
        formats: ['PDF Report', 'JSON Data', 'Image Gallery'],
        downloadUrl: `/api/ar/export/${sessionId}`
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to end session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCaptureRecommendations(confidence: number): string[] {
  const recommendations = [];
  
  if (confidence < 0.7) {
    recommendations.push('Improve lighting - use natural light or bright room lighting');
    recommendations.push('Ensure face is centered in frame');
    recommendations.push('Remove glasses or accessories that may interfere');
  } else if (confidence < 0.85) {
    recommendations.push('Good capture quality - consider taking additional angles');
    recommendations.push('Maintain steady position for consistent results');
  } else {
    recommendations.push('Excellent capture quality - ready for simulation');
    recommendations.push('Consider capturing different facial expressions');
  }
  
  return recommendations;
}

function generateTreatmentInfo(treatmentType: string, targetAreas?: string[], intensity?: number) {
  const treatmentData = {
    filler: {
      name: 'Dermal Filler Treatment',
      description: 'Add volume and smooth wrinkles with hyaluronic acid',
      duration: '15-30 minutes',
      downtime: '1-2 days',
      results: 'Immediate, lasts 6-12 months'
    },
    botox: {
      name: 'Botulinum Toxin Treatment',
      description: 'Relax muscles to reduce dynamic wrinkles',
      duration: '10-15 minutes', 
      downtime: 'Minimal',
      results: 'Visible in 3-7 days, lasts 3-4 months'
    }
  };
  
  return treatmentData[treatmentType as keyof typeof treatmentData] || {
    name: 'Treatment Simulation',
    description: 'Advanced treatment visualization',
    duration: 'Varies',
    downtime: 'Consult practitioner',
    results: 'Results may vary'
  };
}
