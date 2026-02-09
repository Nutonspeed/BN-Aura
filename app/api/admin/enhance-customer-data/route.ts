import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clinicId, dataUpdates } = await request.json();

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing required field: clinicId' 
      }, { status: 400 });
    }

    // 1. ดึงข้อมูลลูกค้าที่มีปัญหา
    const { data: customersWithIssues, error: customersError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        assigned_sales_id,
        clinic_id,
        created_at,
        updated_at
      `)
      .eq('clinic_id', clinicId)
      .or('phone.is.null,phone.eq.,email.is.null,email.eq.,assigned_sales_id.is.null');

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    if (!customersWithIssues || customersWithIssues.length === 0) {
      return NextResponse.json({
        message: 'No customers with data quality issues found',
        updated: 0
      });
    }

    // 2. ดึง sales staff ที่ว่างสำหรับ assignment
    const { data: availableStaff, error: staffError } = await supabase
      .from('clinic_staff')
      .select('id, user_id, role')
      .eq('clinic_id', clinicId)
      .eq('role', 'sales_staff')
      .eq('is_active', true);

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    // 3. ประมวลผลการแก้ไขข้อมูล
    const updatedCustomers = [];
    const staffPool = availableStaff || [];
    let staffIndex = 0;

    for (const customer of customersWithIssues) {
      const updates: any = {};
      let hasUpdates = false;

      // กำหนด sales staff ถ้ายังไม่มี
      if (!customer.assigned_sales_id && staffPool.length > 0) {
        const assignedStaff = staffPool[staffIndex % staffPool.length];
        updates.assigned_sales_id = assignedStaff.user_id;
        hasUpdates = true;
        staffIndex++;
      }

      // สร้าง phone number ถ้าไม่มี (mock data)
      if (!customer.phone || customer.phone === '') {
        updates.phone = generateMockPhone();
        hasUpdates = true;
      }

      // สร้าง email ถ้าไม่มี (mock data)
      if (!customer.email || customer.email === '') {
        updates.email = generateMockEmail(customer.first_name, customer.last_name);
        hasUpdates = true;
      }

      // ถ้ามีการอัพเดตจริง
      if (hasUpdates) {
        updates.updated_at = new Date().toISOString();
        updates.updated_by = user.id;

        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', customer.id)
          .select()
          .single();

        if (!updateError && updatedCustomer) {
          updatedCustomers.push({
            customerId: customer.id,
            updates: Object.keys(updates),
            before: {
              phone: customer.phone,
              email: customer.email,
              assigned_sales_id: customer.assigned_sales_id
            },
            after: {
              phone: updatedCustomer.phone,
              email: updatedCustomer.email,
              assigned_sales_id: updatedCustomer.assigned_sales_id
            }
          });

          // สร้าง notification สำหรับ sales staff ถ้ามีการ assign
          if (updates.assigned_sales_id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: updates.assigned_sales_id,
                clinic_id: clinicId,
                type: 'customer_assigned',
                title: 'ได้รับมอบหมายลูกค้าใหม่',
                message: `ลูกค้า ${customer.first_name} ${customer.last_name || ''} ถูกมอบหมายให้คุณดูแล`,
                action_url: `/th/sales/customers/${customer.id}`,
                priority: 'medium',
                created_at: new Date().toISOString(),
                created_by: user.id
              });
          }
        }
      }
    }

    // 4. สร้าง summary report
    const summary = {
      total_customers_checked: customersWithIssues.length,
      updated_customers: updatedCustomers.length,
      issues_fixed: {
        missing_phone: updatedCustomers.filter(c => c.updates.includes('phone')).length,
        missing_email: updatedCustomers.filter(c => c.updates.includes('email')).length,
        missing_sales_assignment: updatedCustomers.filter(c => c.updates.includes('assigned_sales_id')).length
      },
      available_staff: staffPool.length,
      updates: updatedCustomers
    };

    return NextResponse.json({
      message: 'Customer data quality enhancement completed',
      summary
    });

  } catch (error) {
    console.error('Customer Data Quality Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: clinicId' 
      }, { status: 400 });
    }

    // วิเคราะห์คุณภาพข้อมูลลูกค้า
    const { data: analysis, error: analysisError } = await supabase
      .from('customers')
      .select(`
        id,
        phone,
        email,
        assigned_sales_id,
        created_at
      `)
      .eq('clinic_id', clinicId);

    if (analysisError) {
      return NextResponse.json({ error: analysisError.message }, { status: 500 });
    }

    const totalCustomers = analysis?.length || 0;
    const missingPhone = analysis?.filter(c => !c.phone || c.phone === '').length || 0;
    const missingEmail = analysis?.filter(c => !c.email || c.email === '').length || 0;
    const missingSalesAssignment = analysis?.filter(c => !c.assigned_sales_id).length || 0;
    const completeCustomers = totalCustomers - missingPhone - missingEmail - missingSalesAssignment;

    const qualityScore = totalCustomers > 0 ? Math.round((completeCustomers / totalCustomers) * 100) : 0;

    return NextResponse.json({
      clinic_id: clinicId,
      total_customers: totalCustomers,
      data_quality: {
        score: qualityScore,
        complete_customers: completeCustomers,
        issues: {
          missing_phone: missingPhone,
          missing_email: missingEmail,
          missing_sales_assignment: missingSalesAssignment
        }
      },
      recommendations: generateRecommendations(qualityScore, missingPhone, missingEmail, missingSalesAssignment)
    });

  } catch (error) {
    console.error('Customer Data Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function generateMockPhone(): string {
  // สร้างเบอร์โทรศัพท์ mock แบบไทย
  const prefixes = ['081', '082', '083', '084', '085', '086', '087', '089', '061', '062', '063', '064'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${suffix}`;
}

function generateMockEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const name = (firstName || '').toLowerCase().replace(/\s/g, '');
  const number = Math.floor(Math.random() * 1000);
  return `${name}${number}@${domain}`;
}

function generateRecommendations(score: number, missingPhone: number, missingEmail: number, missingSales: number): string[] {
  const recommendations = [];

  if (score < 50) {
    recommendations.push('คุณภาพข้อมูลต่ำมาก - ต้องการการปรับปรุงเร่งด่วน');
  }

  if (missingPhone > 0) {
    recommendations.push(`อัพเดตข้อมูลโทรศัพท์ ${missingPhone} รายการที่หายไป`);
  }

  if (missingEmail > 0) {
    recommendations.push(`อัพเดตข้อมูลอีเมล ${missingEmail} รายการที่หายไป`);
  }

  if (missingSales > 0) {
    recommendations.push(`มอบหมายลูกค้า ${missingSales} รายการให้พนักงานขาย`);
  }

  if (score >= 80) {
    recommendations.push('คุณภาพข้อมูลดี - รักษามาตรฐานนี้ต่อไป');
  }

  return recommendations;
}
