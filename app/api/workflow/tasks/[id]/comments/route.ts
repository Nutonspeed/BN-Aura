/**
 * API Route for Task Comments
 * Phase 7: Cross-Role Workflow Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { comment_text } = await request.json();

    if (!comment_text?.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this task
    const { data: task, error: taskError } = await supabase
      .from('workflow_tasks')
      .select(`
        *,
        workflow_states!inner(
          customer_id,
          clinic_id,
          assigned_sales,
          assigned_beautician
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user can access this task
    const canAccess = 
      task.assigned_to === user.id ||
      task.workflow_states?.assigned_sales === user.id ||
      task.workflow_states?.assigned_beautician === user.id ||
      task.workflow_states?.clinic_id === user.user_metadata?.clinic_id;

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('workflow_task_comments')
      .insert({
        task_id: taskId,
        author_id: user.id,
        comment_text: comment_text.trim()
      })
      .select(`
        *,
        author:users!inner(
          full_name,
          email
        )
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Create workflow event
    await supabase
      .from('workflow_events')
      .insert({
        workflow_id: task.workflow_id,
        event_type: 'note_added',
        actor_id: user.id,
        actor_role: user.user_metadata?.role || 'staff',
        event_data: {
          task_id: taskId,
          comment_id: comment.id
        },
        description: `เพิ่มความเห็นในงาน: ${task.task_title}`
      });

    return NextResponse.json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Error in task comments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this task
    const { data: task, error: taskError } = await supabase
      .from('workflow_tasks')
      .select(`
        *,
        workflow_states!inner(
          customer_id,
          clinic_id,
          assigned_sales,
          assigned_beautician
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user can access this task
    const canAccess = 
      task.assigned_to === user.id ||
      task.workflow_states?.assigned_sales === user.id ||
      task.workflow_states?.assigned_beautician === user.id ||
      task.workflow_states?.clinic_id === user.user_metadata?.clinic_id;

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('workflow_task_comments')
      .select(`
        *,
        author:users!inner(
          full_name,
          email
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comments || []
    });

  } catch (error) {
    console.error('Error in task comments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
