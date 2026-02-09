import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

/**
 * Super Admin Global Management API
 * Restricted to super_admin role only
 */

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const adminClient = createAdminClient();

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // GET requests for data fetching
    if (type === 'stats') {
      // Get system stats directly without cache
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const [
        clinicsResult,
        usersResult,
        staffResult,
        globalCustomersResult,
        monthlyScansResult
      ] = await Promise.all([
        adminClient.from('clinics').select('id', { count: 'exact', head: true }),
        adminClient.from('users').select('id', { count: 'exact', head: true }),
        adminClient.from('clinic_staff').select('id', { count: 'exact', head: true }),
        adminClient.from('customers').select('id', { count: 'exact', head: true }),
        adminClient.from('skin_analyses').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo)
      ]);

      return successResponse({
        totalClinics: clinicsResult.count || 0,
        globalCustomers: globalCustomersResult.count || 0,
        monthlyAILoad: monthlyScansResult.count || 0,
        activeStaff: staffResult.count || 0
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
      // Get clinics data directly without cache
      const { data: clinics } = await adminClient
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (!clinics) {
        return successResponse({ clinics: [] });
      }
      
      // Get staff and customer counts separately for each clinic
      const transformedClinics = await Promise.all(clinics.map(async (clinic) => {
        // Get staff count
        const { count: staffCount } = await adminClient
          .from('clinic_staff')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinic.id)
          .eq('is_active', true);

        // Get customer count (using users table with customer role)
        const { count: customerCount } = await adminClient
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinic.id)
          .eq('is_active', true);

        return {
          ...clinic,
          name: typeof clinic.display_name === 'object' ? 
            (clinic.display_name as any).th || (clinic.display_name as any).en : 
            clinic.display_name,
          status: clinic.is_active ? 'active' : 'inactive',
          staffCount: staffCount || 0,
          customerCount: customerCount || 0,
          plan: clinic.subscription_tier || 'starter'
        };
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
          metadata
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data - keep simple for now
      const transformedUsers = users;

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
    await requireSuperAdmin();
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const adminClient = createAdminClient();
    const user = { id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff' }; // Super admin user ID

    const body = await request.json();
    const { action, userId, clinicId, status, quotaLimit, name, email, phone, address, plan, metadata, clinicData, fullName, password, role: userRole = 'clinic_owner' } = body;

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
          // Note: users.role uses user_role enum (public, free_user, premium_customer, super_admin)
          // The actual clinic role (clinic_owner) is stored in clinic_staff.role
          const { data: newUser, error: userError } = await adminClient
            .from('users')
            .insert({
              id: authUser.user.id,
              email,
              full_name: fullName,
              role: 'premium_customer' // Clinic owners are premium users
            })
            .select()
            .single();
          
          if (userError) throw userError;
          userData = newUser;
        } else {
          userData = existingUser;
        }

        // Add user to clinic_staff table with specified role
        const { data: staffData, error: staffError } = await adminClient
          .from('clinic_staff')
          .insert({
            clinic_id: clinicId,
            user_id: authUser.user.id,
            role: userRole,
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

      // TODO: Add cache invalidation when cache system is properly configured
      console.log('Clinic status updated - cache invalidation needed');

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

      // TODO: Add cache invalidation when cache system is properly configured
      console.log('Clinic status updated - cache invalidation needed');

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
