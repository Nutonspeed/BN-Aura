/**
 * SMS OTP API
 * POST - Send OTP to phone number
 * PUT  - Verify OTP code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { smsService, formatThaiSMS } from '@/lib/sms/smsService';
import crypto from 'crypto';

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// POST: Send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, clinicId, purpose } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!smsService.isConfigured()) {
      // Dev mode — return mock OTP
      return NextResponse.json({
        success: true,
        message: 'OTP sent (mock mode)',
        expiresIn: 300,
        _devOtp: '123456',
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    const adminClient = createAdminClient();
    await adminClient.from('otp_verifications').upsert({
      phone,
      code: otp,
      purpose: purpose || 'login',
      clinic_id: clinicId || null,
      expires_at: expiresAt.toISOString(),
      verified: false,
      attempts: 0,
    }, { onConflict: 'phone,purpose' });

    // Send SMS
    const message = formatThaiSMS('รหัส OTP ของคุณคือ {otp} (หมดอายุใน 5 นาที) - BN-Aura', { otp });
    const result = await smsService.send({ to: phone, message });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send OTP', details: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300,
    });
  } catch (error) {
    console.error('[OTP] Send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Verify OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, purpose } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Look up OTP
    const { data: otpRecord } = await adminClient
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('purpose', purpose || 'login')
      .eq('verified', false)
      .single();

    if (!otpRecord) {
      return NextResponse.json({ error: 'No pending OTP found' }, { status: 404 });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP expired' }, { status: 410 });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 });
    }

    // Increment attempts
    await adminClient
      .from('otp_verifications')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    // Verify code
    if (otpRecord.code !== code) {
      return NextResponse.json({ error: 'Invalid OTP code', attemptsLeft: 5 - otpRecord.attempts - 1 }, { status: 400 });
    }

    // Mark as verified
    await adminClient
      .from('otp_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      phone,
    });
  } catch (error) {
    console.error('[OTP] Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
