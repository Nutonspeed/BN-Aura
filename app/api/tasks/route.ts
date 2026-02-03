import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Task Queue Management
 * GET - Fetch tasks for current user
 * POST - Create/update tasks
 * PATCH - Update task status
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch tasks assigned to current user
    const { data: tasks, error } = await supabase
      .from('task_queue')
      .select(`
        *,
        workflow_states (
          id,
          current_stage,
          customer_id,
          customers (
            id,
            full_name,
            phone
          )
        )
      `)
      .eq('assigned_to', user.id)
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return successResponse({ tasks });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      workflow_id, 
      assigned_to, 
      task_type, 
      title, 
      description, 
      priority = 'medium',
      due_date,
      task_data = {}
    } = body;

    if (!workflow_id || !assigned_to || !task_type || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: workflow_id, assigned_to, task_type, title' 
      }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('task_queue')
      .insert({
        workflow_id,
        assigned_to,
        task_type,
        title,
        description,
        priority,
        due_date,
        task_data,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse({ task, message: 'Task created successfully' });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, status, notes } = body;

    if (!task_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: task_id, status' 
      }, { status: 400 });
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data: task, error } = await supabase
      .from('task_queue')
      .update(updateData)
      .eq('id', task_id)
      .eq('assigned_to', user.id) // Ensure user can only update their own tasks
      .select()
      .single();

    if (error) throw error;

    return successResponse({ task, message: 'Task updated successfully' });
  } catch (error) {
    return handleAPIError(error);
  }
}
