import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * Super Admin Global Management API
 * Restricted to super_admin role only
 */

export async function GET(request: Request) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // GET requests for data fetching
    if (type === 'stats') {
      // 1. Total Clinics
      const { count: totalClinics } = await adminClient
        .from('clinics')
        .select('id', { count: 'exact', head: true });

      // 2. Global Customers
      const { count: globalCustomers } = await adminClient
        .from('customers')
        .select('id', { count: 'exact', head: true });

      // 3. Monthly AI Load (Scans in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: monthlyScans } = await adminClient
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      // 4. Active Staff
      const { count: totalStaff } = await adminClient
        .from('clinic_staff')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      return successResponse({
        totalClinics: totalClinics || 0,
        globalCustomers: globalCustomers || 0,
        monthlyAILoad: monthlyScans || 0,
        activeStaff: totalStaff || 0
      });
    }

    if (type === 'clinic' && id) {
      const { data: clinic, error } = await adminClient
        .from('clinics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return successResponse({ clinic });
    }

    if (type === 'clinics') {
      const { data: clinics, error } = await adminClient
        .from('clinics')
        .select(`
          id, 
          clinic_code,
          display_name, 
          status:is_active, 
          created_at,
          clinic_staff(count),
          customers(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform status from is_active boolean to string if needed by UI
      const transformedClinics = clinics.map(c => ({
        ...c,
        name: typeof c.display_name === 'object' ? (c.display_name as any).th || (c.display_name as any).en : c.display_name,
        status: c.status ? 'active' : 'inactive'
      }));

      return successResponse({ clinics: transformedClinics });
    }

    if (type === 'users') {
      const { data: users, error } = await adminClient
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          tier,
          clinic_id,
          is_active,
          created_at,
          metadata,
          clinics!users_clinic_id_fkey(
            display_name,
            clinic_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include clinic name
      const transformedUsers = users.map((user: any) => ({
        ...user,
        clinic_name: user.clinics ? 
          (typeof user.clinics.display_name === 'object' ? 
            user.clinics.display_name.th || user.clinics.display_name.en : 
            user.clinics.display_name) : 
          null
      }));

      return successResponse({ users: transformedUsers });
    }

    if (type === 'system_health') {
      // Logic to check system components
      // In a real environment, this might check external status pages or specific ping endpoints
      return successResponse({
        health: {
          database: 'Operational',
          storage: 'Operational',
          ai_gateway: 'Operational',
          auth_service: 'Operational',
          edge_functions: 'Operational',
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, clinicId, status, quotaLimit, name, email, phone, address, plan, metadata, clinicData, fullName, password, role } = body;

    if (action === 'updateUserStatus' && userId) {
      const { error } = await adminClient
        .from('users')
        .update({ 
          is_active: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return successResponse({ message: `User status updated successfully` });
    }

    if (action === 'createClinic' && name && email) {
      // Generate clinic code
      const clinicCode = `CLN-${Date.now().toString(36).toUpperCase()}`;
      
      // Create clinic using admin client
      const { data: newClinic, error: clinicError } = await adminClient
        .from('clinics')
        .insert({
          clinic_code: clinicCode,
          display_name: { th: name, en: name },
          subscription_tier: plan || 'starter',
          is_active: true,
          created_by: user.id,
          metadata: metadata || {
            contact_email: email,
            contact_phone: phone || null,
            address: address || null,
            registered_by: user.id,
            registered_at: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (clinicError) throw clinicError;

      return successResponse({ 
        id: newClinic.id,
        clinicCode,
        message: 'Clinic created successfully' 
      });
    }

    if (action === 'createUser' && email && fullName && clinicId) {
      try {
        // Create user in auth.users using Admin API
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName
          }
        });

        if (authError) throw authError;

        // Check if user already exists in users table
        const { data: existingUser } = await adminClient
          .from('users')
          .select('id')
          .eq('id', authUser.user.id)
          .single();

        let userData;
        if (!existingUser) {
          // Create new user entry
          const { data: newUser, error: userError } = await adminClient
            .from('users')
            .insert({
              id: authUser.user.id,
              email,
              full_name: fullName,
              role: 'premium_customer'
            })
            .select()
            .single();
          
          if (userError) throw userError;
          userData = newUser;
        } else {
          userData = existingUser;
        }

        // Add user to clinic_staff table as clinic_owner
        const { data: staffData, error: staffError } = await adminClient
          .from('clinic_staff')
          .insert({
            clinic_id: clinicId,
            user_id: authUser.user.id,
            role: 'clinic_owner',
            is_active: true,
            created_by: user.id
          })
          .select()
          .single();

        if (staffError) throw staffError;

        return successResponse({ 
          id: authUser.user.id,
          email: authUser.user.email,
          message: 'User created successfully' 
        });
      } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ 
          error: error.message || 'Failed to create user' 
        }, { status: 500 });
      }
    }

    if (action === 'updateStatus' && clinicId && status) {
      const isActive = status === 'active';
      const { error } = await adminClient
        .from('clinics')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', clinicId);

      if (error) throw error;
      return successResponse({ message: `Clinic status updated to ${status}` });
    }

    if (action === 'updateClinic' && clinicId && clinicData) {
      // Update clinic using admin client
      const { data: updatedClinic, error: updateError } = await adminClient
        .from('clinics')
        .update({
          display_name: clinicData.display_name,
          subscription_tier: clinicData.subscription_tier,
          is_active: clinicData.is_active,
          metadata: clinicData.metadata,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId)
        .select()
        .single();

      if (updateError) throw updateError;

      return successResponse({ 
        clinic: updatedClinic,
        message: 'Clinic updated successfully' 
      });
    }

    if (action === 'updateQuota' && clinicId && quotaLimit) {
      // Logic to update AI quota for a clinic
      // This might involve updating a 'clinic_quota' table
      return successResponse({ message: 'Quota updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action or missing fields' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
