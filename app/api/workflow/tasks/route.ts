/**
 * Workflow Tasks API Routes
 * Phase 7: Cross-Role Workflow Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enhancedWorkflowManager } from '@/lib/workflow/enhancedWorkflowManager';
import { CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '@/types/workflow';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user.id;
}

// GET /api/workflow/tasks - Get tasks for user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: TaskFilters = {
      assigned_to: searchParams.get('assigned_to') || undefined,
      status: searchParams.get('status') as any,
      task_type: searchParams.get('task_type') as any,
      priority_level: searchParams.get('priority_level') as any,
      due_from: searchParams.get('due_from') || undefined,
      due_to: searchParams.get('due_to') || undefined,
      workflow_id: searchParams.get('workflow_id') || undefined
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await enhancedWorkflowManager.getTasks(filters, userId, page, limit);

    return NextResponse.json({
      success: true,
      data: result.tasks,
      total: result.total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/workflow/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body: CreateTaskRequest = await request.json();

    // Validate required fields
    if (!body.workflow_id || !body.assigned_to || !body.task_type || !body.task_title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: workflow_id, assigned_to, task_type, task_title' },
        { status: 400 }
      );
    }

    const task = await enhancedWorkflowManager.createTask(body, userId);

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
