/**
 * LINE Login OAuth API
 * GET  - Redirect to LINE Login authorization
 * POST - Handle callback, exchange code for token, link/create user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

function getLineConfig() {
  return {
    channelId: process.env.LINE_LOGIN_CHANNEL_ID || '',
    channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET || '',
    redirectUri: process.env.LINE_LOGIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/line/callback`,
  };
}

// GET: Generate LINE Login URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'login_url';
  const clinicId = searchParams.get('clinic_id');

  if (action === 'login_url') {
    const config = getLineConfig();

    if (!config.channelId) {
      return NextResponse.json({
        success: false,
        error: 'LINE Login not configured. Set LINE_LOGIN_CHANNEL_ID in environment.',
        setup: {
          th: [
            '1. ไปที่ https://developers.line.biz/console/',
            '2. สร้าง LINE Login Channel',
            '3. ตั้งค่า Callback URL',
            '4. เพิ่ม LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET ใน .env',
          ],
        },
      }, { status: 400 });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Encode clinic_id in state for multi-tenant support
    const statePayload = clinicId ? `${state}:${clinicId}` : state;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.channelId,
      redirect_uri: config.redirectUri,
      state: statePayload,
      scope: 'profile openid email',
      nonce,
      bot_prompt: 'aggressive', // Prompt user to add LINE OA as friend
    });

    const loginUrl = `${LINE_AUTH_URL}?${params.toString()}`;

    return NextResponse.json({
      success: true,
      data: { loginUrl, state: statePayload },
    });
  }

  // Status check
  if (action === 'status') {
    const config = getLineConfig();
    return NextResponse.json({
      success: true,
      data: {
        configured: !!config.channelId,
        hasSecret: !!config.channelSecret,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// POST: Exchange authorization code for access token + link user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, clinicId: bodyClinicId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const config = getLineConfig();

    if (!config.channelId || !config.channelSecret) {
      return NextResponse.json({ error: 'LINE Login not configured' }, { status: 500 });
    }

    // Extract clinic_id from state if present
    let clinicId = bodyClinicId;
    if (state && state.includes(':')) {
      clinicId = clinicId || state.split(':')[1];
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch(LINE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.channelId,
        client_secret: config.channelSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      return NextResponse.json({ error: 'Failed to exchange code', details: err }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // 2. Get LINE profile
    const profileResponse = await fetch(LINE_PROFILE_URL, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to get LINE profile' }, { status: 400 });
    }

    const profile = await profileResponse.json();

    // 3. Find or create user in Supabase
    const adminClient = createAdminClient();

    // Check if LINE user already linked
    const { data: existingBooking } = await adminClient
      .from('social_bookings')
      .select('customer_id, clinic_id')
      .eq('platform', 'line')
      .eq('platform_user_id', profile.userId)
      .maybeSingle();

    if (existingBooking) {
      // Existing user — return their info
      const { data: customer } = await adminClient
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('id', existingBooking.customer_id)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          isNewUser: false,
          customer,
          lineProfile: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          clinicId: existingBooking.clinic_id,
        },
      });
    }

    // New LINE user — create social booking record
    if (clinicId) {
      await adminClient.from('social_bookings').insert({
        clinic_id: clinicId,
        platform: 'line',
        platform_user_id: profile.userId,
        platform_user_name: profile.displayName,
        status: 'pending',
        metadata: {
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
          accessToken: tokenData.access_token,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isNewUser: true,
        lineProfile: {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        },
        clinicId,
        message: 'LINE account linked. Complete registration to continue.',
      },
    });
  } catch (error: any) {
    console.error('[LINE Login] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
