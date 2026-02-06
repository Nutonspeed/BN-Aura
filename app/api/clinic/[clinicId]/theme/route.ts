import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET clinic theme
export async function GET(
  request: NextRequest,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;

    const { data, error } = await supabase
      .from('clinic_settings')
      .select('theme_config')
      .eq('clinic_id', clinicId)
      .single();

    if (error || !data?.theme_config) {
      // Return default theme
      return NextResponse.json({
        id: 'bnaura-default',
        name: 'BN-Aura Premium',
        colors: {
          light: {
            primary: '#8B5CF6',
            secondary: '#F3F4F6',
            accent: '#EC4899',
            background: '#FFFFFF',
            foreground: '#1F2937',
            muted: '#6B7280',
            border: '#E5E7EB',
          },
          dark: {
            primary: '#A78BFA',
            secondary: '#374151',
            accent: '#F472B6',
            background: '#111827',
            foreground: '#F9FAFB',
            muted: '#9CA3AF',
            border: '#374151',
          },
        },
        borderRadius: 'lg',
      });
    }

    return NextResponse.json(data.theme_config);
  } catch (error) {
    console.error('[Theme] GET error:', error);
    return NextResponse.json({ error: 'Failed to get theme' }, { status: 500 });
  }
}

// POST/PUT clinic theme
export async function POST(
  request: NextRequest,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;
    const themeConfig = await request.json();

    // Upsert clinic settings with theme
    const { error } = await supabase
      .from('clinic_settings')
      .upsert({
        clinic_id: clinicId,
        theme_config: themeConfig,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });

    if (error) throw error;

    console.log(`[Theme] Saved for clinic: ${clinicId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Theme] POST error:', error);
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
}
