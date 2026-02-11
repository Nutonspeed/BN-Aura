/**
 * LINE Login OAuth Callback Handler
 * Receives authorization code from LINE and redirects to frontend
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/th/login?error=line_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/th/login?error=no_code`);
  }

  // Redirect to frontend with code and state for client-side processing
  const params = new URLSearchParams({ code });
  if (state) params.set('state', state);

  return NextResponse.redirect(`${appUrl}/th/login?line_callback=true&${params.toString()}`);
}
