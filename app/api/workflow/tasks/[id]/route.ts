/**
 * Task Update API Routes
 * Phase 7: Cross-Role Workflow Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enhancedWorkflowManager } from '@/lib/workflow/enhancedWorkflowManager';
import { UpdateTaskRequest } from '@/types/workflow';

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

// PUT /api/workflow/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id: taskId } = await params;
    const body: UpdateTaskRequest = await request.json();

    // Set task_id from URL parameter
    body.task_id = taskId;

    const task = await enhancedWorkflowManager.updateTask(body, userId);

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
