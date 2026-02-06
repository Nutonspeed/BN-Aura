import { NextRequest, NextResponse } from 'next/server';
import { AISkinConsultant } from '@/lib/analysis/aiSkinConsultant';

// Store sessions in memory (in production, use Redis or database)
const sessions = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId && sessions.has(sessionId)) {
      return NextResponse.json({ success: true, data: sessions.get(sessionId) });
    }

    // Return sample session
    const sample = AISkinConsultant.getSampleSession();
    sessions.set(sample.sessionId, sample);
    return NextResponse.json({ success: true, data: sample });
  } catch (error) {
    console.error('Consultant error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, customerId, message, context } = body;

    if (action === 'start') {
      const session = AISkinConsultant.startSession(customerId || 'GUEST', context);
      sessions.set(session.sessionId, session);
      return NextResponse.json({ success: true, data: session });
    }

    if (action === 'chat') {
      if (!sessionId || !message) {
        return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 });
      }

      let session = sessions.get(sessionId);
      if (!session) {
        session = AISkinConsultant.startSession('GUEST', context);
        sessions.set(session.sessionId, session);
      }

      const response = await AISkinConsultant.chat(session, message);
      sessions.set(sessionId, session);

      return NextResponse.json({ 
        success: true, 
        data: {
          session,
          response,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Consultant POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
