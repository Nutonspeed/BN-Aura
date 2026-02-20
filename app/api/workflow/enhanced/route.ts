/**
 * Enhanced Workflow Management API Routes
 * Phase 7: Cross-Role Workflow Integration (Upgrade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enhancedWorkflowManager } from '@/lib/workflow/enhancedWorkflowManager';
import { 
  CreateWorkflowRequest,
  UpdateWorkflowStageRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  WorkflowFilters,
  TaskFilters
} from '@/types/workflow';

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

// GET /api/workflow - Get workflows for user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: WorkflowFilters = {
      stage: searchParams.get('stage') as any,
      assigned_sales: searchParams.get('assigned_sales') || undefined,
      assigned_beautician: searchParams.get('assigned_beautician') || undefined,
      priority_level: searchParams.get('priority_level') as any,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      customer_search: searchParams.get('customer_search') || undefined
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await enhancedWorkflowManager.getWorkflows(filters, userId, page, limit);

    return NextResponse.json({
      success: true,
      data: result.workflows,
      total: result.total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/workflow - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body: CreateWorkflowRequest = await request.json();

    // Validate required fields
    if (!body.customer_id || !body.scan_results) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer_id, scan_results' },
        { status: 400 }
      );
    }

    const workflow = await enhancedWorkflowManager.createWorkflow(body, userId);

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
