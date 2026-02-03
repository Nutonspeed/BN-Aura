import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { VoCService } from '@/lib/analytics/vocService';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin Role (Super Admin or Clinic Admin)
    // For now, we'll allow clinic admins to see their own VoC data
    // But this route is under /admin/analytics which might imply super admin.
    // Let's check permissions properly.
    
    const url = new URL(request.url);
    const clinicId = url.searchParams.get('clinicId');
    
    // If no clinicId provided, and user is super admin, maybe return aggregate?
    // Or if user is clinic admin, use their clinic ID.
    
    const adminClient = createAdminClient();
    const { data: userProfile } = await adminClient
        .from('users')
        .select('role, clinic_id')
        .eq('id', user.id)
        .single();

    let targetClinicId = clinicId;

    if (userProfile?.role === 'super_admin') {
        // Super admin can request specific clinic or we might implement aggregate later
        if (!targetClinicId) {
             return NextResponse.json({ error: 'Clinic ID required for Super Admin view' }, { status: 400 });
        }
    } else {
        // Regular admin/staff constrained to their clinic
        targetClinicId = userProfile?.clinic_id;
    }

    if (!targetClinicId) {
        return NextResponse.json({ error: 'Clinic context not found' }, { status: 400 });
    }

    const vocService = new VoCService();
    const data = await vocService.getVoCAnalytics(targetClinicId);

    return successResponse(data);

  } catch (error) {
    return handleAPIError(error);
  }
}
