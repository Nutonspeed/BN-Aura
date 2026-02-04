import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST: Sign a consent form
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      clinicId,
      customerId,
      templateId,
      appointmentId,
      treatmentId,
      fieldValues = {},
      signatureData,
      witnessName,
      witnessSignatureData,
      photoIdUrl
    } = body;

    if (!clinicId || !customerId || !templateId) {
      return NextResponse.json(
        { error: 'clinicId, customerId, and templateId are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch template
    const { data: template } = await adminClient
      .from('consent_form_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate required fields
    if (template.requires_signature && !signatureData) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }

    if (template.requires_witness && (!witnessName || !witnessSignatureData)) {
      return NextResponse.json(
        { error: 'Witness signature is required' },
        { status: 400 }
      );
    }

    if (template.requires_photo_id && !photoIdUrl) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    // Create consent record
    const { data: consent, error } = await adminClient
      .from('customer_consents')
      .insert({
        clinic_id: clinicId,
        customer_id: customerId,
        template_id: templateId,
        appointment_id: appointmentId,
        treatment_id: treatmentId,
        form_version: template.version,
        field_values: fieldValues,
        signature_data: signatureData,
        signed_at: signatureData ? new Date().toISOString() : null,
        witness_name: witnessName,
        witness_signature_url: witnessSignatureData,
        witness_signed_at: witnessSignatureData ? new Date().toISOString() : null,
        photo_id_url: photoIdUrl,
        status: signatureData ? 'signed' : 'pending',
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Consent creation error:', error);
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
    }

    // TODO: Generate PDF and store URL
    // const pdfUrl = await generateConsentPDF(consent, template);
    // await adminClient.from('customer_consents').update({ pdf_url: pdfUrl }).eq('id', consent.id);

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        status: consent.status,
        signedAt: consent.signed_at
      }
    });
  } catch (error) {
    console.error('Consent signing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get customer's consents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const appointmentId = searchParams.get('appointment_id');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('customer_consents')
      .select(`
        *,
        template:consent_form_templates(id, name, version)
      `)
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    const { data: consents, error } = await query;

    if (error) {
      console.error('Consents fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 });
    }

    return NextResponse.json({ consents });
  } catch (error) {
    console.error('Consents API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
