import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user
    });
    
  } catch (error) {
    console.error('Refresh API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 401 }
      );
    }
    
    // Check if session is expired
    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    return NextResponse.json({
      success: true,
      session,
      expiresAt,
      timeUntilExpiry: expiresAt - now,
      isExpired: now > expiresAt
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
