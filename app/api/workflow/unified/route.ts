import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { operation, workflowId, data } = await request.json();

    // Validate required fields
    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required' },
        { status: 400 }
      );
    }

    // For now, use direct SQL queries instead of RPC
    switch (operation) {
      case 'create':
        const { data: newWorkflow, error: createError } = await supabase
          .from('workflow_states')
          .insert([data])
          .select()
          .single();
        
        if (createError) throw createError;
        return NextResponse.json({ success: true, data: newWorkflow });
        
      case 'transition':
        const { data: updatedWorkflow, error: updateError } = await supabase
          .from('workflow_states')
          .update({
            current_stage: data.new_stage,
            updated_at: new Date().toISOString(),
            treatment_plan: data.treatment_plan
          })
          .eq('id', workflowId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return NextResponse.json({ success: true, data: updatedWorkflow });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported operation' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const operation = searchParams.get('operation');
    const workflowId = searchParams.get('workflowId');
    const salesId = searchParams.get('salesId');
    const clinicId = searchParams.get('clinic_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Route to appropriate function based on operation
    let result;
    
    if (operation === 'get' && workflowId) {
      const { data, error } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('id', workflowId)
        .single();
      
      if (error) throw error;
      result = { success: true, data };
      
    } else if (operation === 'list_by_sales' && salesId) {
      const { data, error } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('assigned_sales_id', salesId)
        .limit(limit);
      
      if (error) throw error;
      result = { success: true, data };
      
    } else if (operation === 'list_by_clinic' && clinicId) {
      const { data, error } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('clinic_id', clinicId)
        .limit(limit);
      
      if (error) throw error;
      result = { success: true, data };
      
    } else {
      // Return error details for debugging
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid operation parameters',
          debug: {
            operation,
            workflowId,
            salesId,
            clinicId,
            limit,
            allParams: Object.fromEntries(searchParams.entries())
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
