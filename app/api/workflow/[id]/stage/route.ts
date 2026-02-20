/**
 * Workflow Stage Update API Routes
 * Phase 7: Cross-Role Workflow Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enhancedWorkflowManager } from '@/lib/workflow/enhancedWorkflowManager';
import { UpdateWorkflowStageRequest } from '@/types/workflow';

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

// PUT /api/workflow/[id]/stage - Update workflow stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id: workflowId } = await params;
    const body: UpdateWorkflowStageRequest = await request.json();

    // Validate required fields
    if (!body.new_stage) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: new_stage' },
        { status: 400 }
      );
    }

    // Set workflow_id from URL parameter
    body.workflow_id = workflowId;

    const workflow = await enhancedWorkflowManager.updateWorkflowStage(body, userId);

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error updating workflow stage:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
