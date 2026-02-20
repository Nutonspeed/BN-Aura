import { NextRequest, NextResponse } from 'next/server';
import { ARMobileFeatures } from '@/lib/ar/arMobileFeatures';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,
      sessionId,
      userId,
      treatmentId,
      deviceInfo,
      imageData,
      progress,
      topic
    } = body;

    // Initialize AR features
    const arFeatures = new ARMobileFeatures();

    switch (action) {
      case 'start_session':
        if (!userId || !treatmentId || !deviceInfo) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields for starting AR session' 
            },
            { status: 400 }
          );
        }

        const session = await arFeatures.startARSession(userId, treatmentId, deviceInfo);
        
        return NextResponse.json({
          success: true,
          data: {
            session,
            deviceCapabilities: arFeatures.getDeviceCapabilities(deviceInfo.type),
            recommendedSettings: arFeatures.getRecommendedSettings(deviceInfo.type)
          }
        });

      case 'process_face_analysis':
        if (!sessionId || !imageData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, imageData' 
            },
            { status: 400 }
          );
        }

        const analysis = await arFeatures.processFaceAnalysis(sessionId, imageData);
        
        return NextResponse.json({
          success: true,
          data: {
            analysis,
            session: arFeatures.getActiveSession(sessionId)
          }
        });

      case 'generate_treatment_overlay':
        if (!sessionId || !treatmentId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, treatmentId' 
            },
            { status: 400 }
          );
        }

        const overlays = await arFeatures.generateTreatmentOverlay(
          sessionId,
          treatmentId,
          progress || 0
        );
        
        return NextResponse.json({
          success: true,
          data: {
            overlays,
            session: arFeatures.getActiveSession(sessionId)
          }
        });

      case 'generate_educational_overlay':
        if (!sessionId || !topic) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, topic' 
            },
            { status: 400 }
          );
        }

        const overlay = await arFeatures.generateEducationalOverlay(sessionId, topic);
        
        return NextResponse.json({
          success: true,
          data: {
            overlay,
            session: arFeatures.getActiveSession(sessionId)
          }
        });

      case 'update_simulation_progress':
        if (!sessionId || !treatmentId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, treatmentId' 
            },
            { status: 400 }
          );
        }

        await arFeatures.updateSimulationProgress(sessionId, treatmentId, progress || 0);
        
        return NextResponse.json({
          success: true,
          data: {
            session: arFeatures.getActiveSession(sessionId),
            simulation: arFeatures.getTreatmentSimulations().find(s => s.id === treatmentId)
          }
        });

      case 'end_session':
        if (!sessionId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required field: sessionId' 
            },
            { status: 400 }
          );
        }

        await arFeatures.endSession(sessionId);
        
        return NextResponse.json({
          success: true,
          data: {
            session: arFeatures.getActiveSession(sessionId),
            message: 'AR session ended successfully'
          }
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[AR Mobile Features] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AR request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAgent = searchParams.get('userAgent');
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    const arFeatures = new ARMobileFeatures();

    if (userAgent) {
      // Check device compatibility
      const compatibility = arFeatures.checkDeviceCompatibility(userAgent);
      
      return NextResponse.json({
        success: true,
        data: {
          compatibility,
          availableSimulations: arFeatures.getTreatmentSimulations(),
          supportedFeatures: compatibility.capabilities?.features || []
        }
      });
    }

    if (sessionId) {
      // Get specific session
      const session = arFeatures.getActiveSession(sessionId);
      
      return NextResponse.json({
        success: true,
        data: {
          session,
          availableSimulations: arFeatures.getTreatmentSimulations()
        }
      });
    }

    if (userId) {
      // Get all active sessions for user
      const allSessions = arFeatures.getAllActiveSessions();
      const userSessions = allSessions.filter(session => session.userId === userId);

      return NextResponse.json({
        success: true,
        data: {
          sessions: userSessions,
          totalActive: userSessions.length,
          availableSimulations: arFeatures.getTreatmentSimulations()
        }
      });
    }

    // Get general AR information
    return NextResponse.json({
      success: true,
      data: {
        availableSimulations: arFeatures.getTreatmentSimulations(),
        supportedDevices: [
          'iPhone 13 Pro',
          'iPhone 14 Pro',
          'iPhone 15 Pro',
          'Samsung Galaxy S23',
          'Samsung Galaxy S23+',
          'Google Pixel 7',
          'OnePlus 11'
        ],
        features: {
          faceTracking: 'Real-time face detection and tracking',
          treatmentSimulation: 'Before/after treatment visualization',
          educationalOverlays: 'Interactive educational content',
          measurementTools: 'Face measurement and analysis',
          realTimeEffects: 'Live AR effects and filters'
        }
      }
    });

  } catch (error) {
    console.error('[AR Mobile Features GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get AR data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
