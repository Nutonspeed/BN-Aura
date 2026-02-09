// Complete Clinic Owner Creation Script
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST() {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();
    
    // 1. Create or get the clinic first
    const clinicData = {
      clinic_code: 'BN-TEST-CLINIC-001',
      display_name: {
        th: 'คลินิกความงาม BN Test',
        en: 'BN Test Beauty Clinic'
      },
      subscription_tier: 'premium',
      max_sales_staff: 10,
      is_active: true
    };
    
    // Check if clinic exists
    const { data: existingClinic } = await adminClient
      .from('clinics')
      .select('id')
      .eq('clinic_code', clinicData.clinic_code)
      .single();
    
    let clinicId;
    if (existingClinic) {
      clinicId = existingClinic.id;
      console.log('Using existing clinic:', clinicId);
    } else {
      // Create new clinic
      const { data: newClinic, error: clinicError } = await adminClient
        .from('clinics')
        .insert(clinicData)
        .select()
        .single();
      
      if (clinicError) throw clinicError;
      clinicId = newClinic.id;
      console.log('Created new clinic:', clinicId);
    }
    
    // 2. Get the user by email
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, role, clinic_id')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    if (userError) {
      return Response.json({ error: 'User not found: ' + userError.message }, { status: 404 });
    }
    
    console.log('Found user:', user);
    
    // 3. Update user to premium tier and link to clinic
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ 
        role: 'premium_customer',
        tier: 'premium',
        clinic_id: clinicId,
        full_name: 'BN Test Clinic Owner'
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // 4. Add to clinic_staff as clinic_owner
    const { data: staffData, error: staffError } = await adminClient
      .from('clinic_staff')
      .upsert({
        clinic_id: clinicId,
        user_id: user.id,
        role: 'clinic_owner',
        is_active: true
      })
      .select()
      .single();
    
    if (staffError) throw staffError;
    
    // 5. Update clinic to link owner
    const { data: finalClinic, error: ownerError } = await adminClient
      .from('clinics')
      .update({ owner_user_id: user.id })
      .eq('id', clinicId)
      .select()
      .single();
    
    if (ownerError) throw ownerError;
    
    // 6. Verify everything is set up correctly
    const { data: verification } = await adminClient
      .from('users')
      .select(`
        id, 
        email, 
        role, 
        tier, 
        clinic_id,
        full_name,
        clinics!inner (
          id,
          clinic_code,
          display_name,
          owner_user_id
        ),
        clinic_staff!inner (
          role as staff_role,
          is_active
        )
      `)
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    return Response.json({ 
      success: true,
      message: 'Clinic Owner created successfully',
      data: {
        before: user,
        after: verification,
        clinic: finalClinic,
        staff: staffData
      }
    });
    
  } catch (err) {
    console.error('Clinic Owner creation error:', err);
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    }, { status: 500 });
  }
}
