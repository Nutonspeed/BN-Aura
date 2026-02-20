import { NextRequest, NextResponse } from 'next/server';
import { RealtimeAICoach } from '@/lib/ai/realtimeAICoach';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,
      sessionId,
      treatmentId,
      customerId,
      staffId,
      treatmentType,
      feedback,
      voiceCommand
    } = body;

    // Initialize AI coach
    const aiCoach = new RealtimeAICoach();

    switch (action) {
      case 'start_session':
        if (!treatmentId || !customerId || !staffId || !treatmentType) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields for starting session' 
            },
            { status: 400 }
          );
        }

        const session = await aiCoach.startCoachingSession(
          treatmentId,
          customerId,
          staffId,
          treatmentType
        );

        return NextResponse.json({
          success: true,
          data: {
            session,
            treatmentSteps: aiCoach.getTreatmentSteps(treatmentType),
            voiceCommands: aiCoach.getVoiceCommands(treatmentType)
          }
        });

      case 'process_feedback':
        if (!sessionId || !feedback) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, feedback' 
            },
            { status: 400 }
          );
        }

        const events = await aiCoach.processRealtimeFeedback(sessionId, feedback);
        
        return NextResponse.json({
          success: true,
          data: {
            events,
            session: aiCoach.getActiveSession(sessionId)
          }
        });

      case 'process_voice_command':
        if (!sessionId || !voiceCommand) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: sessionId, voiceCommand' 
            },
            { status: 400 }
          );
        }

        const event = await aiCoach.processVoiceCommand(sessionId, voiceCommand);
        
        return NextResponse.json({
          success: true,
          data: {
            event,
            session: aiCoach.getActiveSession(sessionId)
          }
        });

      case 'update_progress':
        if (!sessionId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required field: sessionId' 
            },
            { status: 400 }
          );
        }

        await aiCoach.updateSessionProgress(
          sessionId,
          body.progress || 0,
          body.currentStep
        );

        return NextResponse.json({
          success: true,
          data: {
            session: aiCoach.getActiveSession(sessionId)
          }
        });

      case 'complete_session':
        if (!sessionId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required field: sessionId' 
            },
            { status: 400 }
          );
        }

        await aiCoach.completeSession(sessionId);

        return NextResponse.json({
          success: true,
          data: {
            session: aiCoach.getActiveSession(sessionId),
            message: 'Session completed successfully'
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
    console.error('[Realtime AI Coach] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process coaching request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const staffId = searchParams.get('staffId');

    const aiCoach = new RealtimeAICoach();

    if (sessionId) {
      // Get specific session
      const session = aiCoach.getActiveSession(sessionId);
      const events = session ? await aiCoach.getSessionEvents(sessionId) : [];

      return NextResponse.json({
        success: true,
        data: {
          session,
          events,
          treatmentSteps: session ? aiCoach.getTreatmentSteps(session.treatmentType) : []
        }
      });
    }

    if (staffId) {
      // Get all active sessions for staff
      const allSessions = aiCoach.getAllActiveSessions();
      const staffSessions = allSessions.filter(session => session.staffId === staffId);

      return NextResponse.json({
        success: true,
        data: {
          sessions: staffSessions,
          totalActive: staffSessions.length
        }
      });
    }

    // Get all active sessions
    const allSessions = aiCoach.getAllActiveSessions();

    return NextResponse.json({
      success: true,
      data: {
        sessions: allSessions,
        totalActive: allSessions.length,
        availableTreatmentTypes: ['facial_treatment', 'laser_treatment', 'injectable_treatment']
      }
    });

  } catch (error) {
    console.error('[Realtime AI Coach GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get coaching data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
