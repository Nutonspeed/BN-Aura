import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import crypto from 'crypto';

/**
 * API Key Management API
 * Restricted to super_admin role
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: keys, error } = await adminClient
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array for now instead of failing
      if (error.code === '42P01') return successResponse({ keys: [] });
      throw error;
    }

    return successResponse({ keys });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, name, scopes, expiresIn, id, rateLimit } = body;

    if (action === 'create' && name) {
      // Generate a secure API key
      const prefix = 'bn_live';
      const randomPart = crypto.randomBytes(24).toString('hex');
      const key = `${prefix}_${randomPart}`;
      
      const expiresAt = expiresIn === 'never' 
        ? null 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { data: newKey, error } = await adminClient
        .from('api_keys')
        .insert({
          name,
          key,
          prefix,
          scopes: scopes || [],
          status: 'active',
          rate_limit: rateLimit || 1000,
          expires_at: expiresAt,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return successResponse({ key: newKey });
    }

    if (action === 'revoke' && id) {
      const { error } = await adminClient
        .from('api_keys')
        .update({ 
          status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return successResponse({ message: 'Key revoked successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
