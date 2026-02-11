/**
 * OTP Verification API
 * POST - Send OTP via SMS
 * PATCH - Verify OTP code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { smsService } from '@/lib/sms/smsService';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// POST: Send OTP
export async function POST(request: NextRequest) {
  try {
    const { phone, purpose = 'verification', clinicId } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate Thai phone
    if (!smsService.isValidThaiPhone(phone)) {
      return NextResponse.json({ error: 'Invalid Thai phone number' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check cooldown — prevent spam
    const { data: recent } = await adminClient
      .from('otp_codes')
      .select('created_at')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        return NextResponse.json({
          error: `กรุณารอ ${Math.ceil(COOLDOWN_SECONDS - elapsed)} วินาที ก่อนขอ OTP ใหม่`,
          retryAfter: Math.ceil(COOLDOWN_SECONDS - elapsed),
        }, { status: 429 });
      }
    }

    // Invalidate previous OTPs for this phone+purpose
    await adminClient
      .from('otp_codes')
      .update({ is_used: true })
      .eq('phone', phone)
      .eq('purpose', purpose)
      .eq('is_used', false);

    // Generate and store OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await adminClient.from('otp_codes').insert({
      phone,
      code,
      purpose,
      clinic_id: clinicId || null,
      expires_at: expiresAt,
      attempts: 0,
      is_used: false,
    });

    if (insertError) {
      console.error('[OTP] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
    }

    // Send OTP via SMS
    const result = await smsService.send({
      to: phone,
      message: `[BN-Aura] รหัส OTP ของคุณคือ ${code} (หมดอายุใน ${OTP_EXPIRY_MINUTES} นาที) อย่าแชร์รหัสนี้กับใคร`,
      priority: 'high',
    });

    return NextResponse.json({
      success: true,
      data: {
        sent: result.success,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
        messageId: result.messageId,
        // Don't expose code in production
        ...(process.env.NODE_ENV !== 'production' ? { code } : {}),
      },
    });
  } catch (error: any) {
    console.error('[OTP] Send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Verify OTP
export async function PATCH(request: NextRequest) {
  try {
    const { phone, code, purpose = 'verification' } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Find the latest unused OTP for this phone+purpose
    const { data: otp } = await adminClient
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return NextResponse.json({ error: 'ไม่พบ OTP กรุณาขอรหัสใหม่', verified: false }, { status: 400 });
    }

    // Check expiry
    if (new Date(otp.expires_at) < new Date()) {
      await adminClient.from('otp_codes').update({ is_used: true }).eq('id', otp.id);
      return NextResponse.json({ error: 'OTP หมดอายุแล้ว กรุณาขอรหัสใหม่', verified: false }, { status: 400 });
    }

    // Check max attempts
    if (otp.attempts >= MAX_ATTEMPTS) {
      await adminClient.from('otp_codes').update({ is_used: true }).eq('id', otp.id);
      return NextResponse.json({ error: 'ลองผิดเกินจำนวนครั้ง กรุณาขอรหัสใหม่', verified: false }, { status: 400 });
    }

    // Increment attempts
    await adminClient.from('otp_codes').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);

    // Verify code
    if (otp.code !== code) {
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      return NextResponse.json({
        error: `รหัส OTP ไม่ถูกต้อง (เหลืออีก ${remaining} ครั้ง)`,
        verified: false,
        attemptsRemaining: remaining,
      }, { status: 400 });
    }

    // Mark as used
    await adminClient.from('otp_codes').update({ is_used: true, verified_at: new Date().toISOString() }).eq('id', otp.id);

    return NextResponse.json({
      success: true,
      verified: true,
      data: { phone, purpose },
    });
  } catch (error: any) {
    console.error('[OTP] Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
