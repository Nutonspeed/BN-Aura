import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { workflowEngine } from '@/lib/workflow/workflowEngine';
import { taskQueueManager } from '@/lib/workflow/taskQueue';
import { eventBroadcaster } from '@/lib/workflow/eventBroadcaster';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, workflowId, data } = body;

    // ดึงข้อมูล clinic_id
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicId = userData.clinic_id;

    const tierMultiplier: Record<string, number> = {
      bronze: 1,
      silver: 1.1,
      gold: 1.25,
      platinum: 1.5,
      diamond: 2
    };
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'BN';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const ensureLoyaltyProfile = async (customerId: string) => {
      const { data: profileRow, error: profileError } = await supabase
        .from('loyalty_profiles')
        .select('available_points, total_points, referral_code, current_tier')
        .eq('customer_id', customerId)
        .eq('clinic_id', clinicId)
        .single();

      if (profileRow) {
        return {
          availablePoints: profileRow.available_points || 0,
          totalPoints: profileRow.total_points || 0,
          referralCode: profileRow.referral_code as string,
          currentTier: (profileRow.current_tier || 'bronze') as string
        };
      }

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const referralCode = generateReferralCode();

      const { data: createdProfile, error: createError } = await supabase
        .from('loyalty_profiles')
        .insert({
          customer_id: customerId,
          clinic_id: clinicId,
          referral_code: referralCode
        })
        .select('available_points, total_points, referral_code, current_tier')
        .single();

      if (createError) {
        if (createError.code === '23505') {
          const { data: existingProfile, error: refetchError } = await supabase
            .from('loyalty_profiles')
            .select('available_points, total_points, referral_code, current_tier')
            .eq('customer_id', customerId)
            .eq('clinic_id', clinicId)
            .single();

          if (refetchError) throw refetchError;
          return {
            availablePoints: existingProfile?.available_points || 0,
            totalPoints: existingProfile?.total_points || 0,
            referralCode: existingProfile?.referral_code as string,
            currentTier: (existingProfile?.current_tier || 'bronze') as string
          };
        }
        throw createError;
      }

      return {
        availablePoints: createdProfile?.available_points || 0,
        totalPoints: createdProfile?.total_points || 0,
        referralCode: createdProfile?.referral_code as string,
        currentTier: (createdProfile?.current_tier || 'bronze') as string
      };
    };

    const awardLoyaltyPointsIfEligible = async (params: {
      actionType: string;
      workflowId: string;
      customerId: string;
      treatmentPlan?: any;
    }) => {
      const eventKey = `workflow:${params.workflowId}:action:${params.actionType}`;

      let points: number | null = null;
      let transactionType: 'earned' | 'bonus' = 'earned';
      let description = 'Loyalty points';

      // Note: payment points are awarded in /api/payments to avoid duplication.

      if (params.actionType === 'complete_treatment') {
        points = 50;
        transactionType = 'bonus';
        description = 'Treatment completed (+50 bonus points)';
      }

      if (!points || points <= 0) {
        return;
      }

      const profile = await ensureLoyaltyProfile(params.customerId);

      const multiplier = tierMultiplier[profile.currentTier] || 1;
      const finalPoints = Math.floor(points * multiplier);
      if (finalPoints <= 0) return;
      const { data: insertedTx, error: insertError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: params.customerId,
          clinic_id: clinicId,
          type: transactionType,
          amount: finalPoints,
          description,
          workflow_id: params.workflowId,
          event_key: eventKey
        })
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return;
        }
        throw insertError;
      }

      if (!insertedTx?.id) {
        return;
      }

      const newAvailable = profile.availablePoints + finalPoints;
      const newTotal = profile.totalPoints + finalPoints;

      const { error: updateError } = await supabase
        .from('loyalty_profiles')
        .update({
          available_points: newAvailable,
          total_points: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', params.customerId)
        .eq('clinic_id', clinicId);

      if (updateError) {
        throw updateError;
      }
    };

    switch (action) {
      case 'create_workflow': {
        const { customerId, customerName, customerEmail, customerPhone, assignedSalesId } = data;
        
        const workflow = await workflowEngine.createWorkflow({
          clinicId,
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          assignedSalesId: assignedSalesId || user.id
        });

        return NextResponse.json({ success: true, workflow });
      }

      case 'execute_transition': {
        const { actionType, performedBy, actionData, notes } = data;
        
        if (!workflowId) {
          return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
        }

        const updatedWorkflow = await workflowEngine.executeTransition(
          workflowId,
          actionType,
          performedBy || user.id,
          actionData,
          notes
        );

        if (updatedWorkflow) {
          await awardLoyaltyPointsIfEligible({
            actionType,
            workflowId,
            customerId: updatedWorkflow.customerId,
            treatmentPlan: updatedWorkflow.treatmentPlan
          });
        }

        return NextResponse.json({ success: true, workflow: updatedWorkflow });
      }

      case 'get_workflow': {
        if (!workflowId) {
          return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
        }

        const workflow = await workflowEngine.getWorkflowState(workflowId);
        if (!workflow) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, workflow });
      }

      case 'list_workflows': {
        const { stage, assignedTo, limit } = data || {};
        
        const workflows = await workflowEngine.getClinicWorkflows(
          clinicId,
          stage,
          assignedTo
        );

        return NextResponse.json({ success: true, workflows });
      }

      case 'create_task': {
        const { assignedTo, taskType, customerName, priority, dueDate, taskData, notes } = data;
        
        if (!workflowId || !assignedTo || !taskType || !customerName) {
          return NextResponse.json({ 
            error: 'Missing required fields: workflowId, assignedTo, taskType, customerName' 
          }, { status: 400 });
        }

        const task = await taskQueueManager.createTask({
          workflowId,
          assignedTo,
          taskType,
          customerName,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          taskData,
          notes
        });

        return NextResponse.json({ success: true, task });
      }

      case 'update_task_status': {
        const { taskId, status, notes } = data;
        
        if (!taskId || !status) {
          return NextResponse.json({ 
            error: 'Missing required fields: taskId, status' 
          }, { status: 400 });
        }

        const task = await taskQueueManager.updateTaskStatus(
          taskId,
          status,
          user.id,
          notes
        );

        return NextResponse.json({ success: true, task });
      }

      case 'broadcast_event': {
        const { eventType, targetUsers, eventData } = data;
        
        if (!workflowId || !eventType || !eventData) {
          return NextResponse.json({ 
            error: 'Missing required fields: workflowId, eventType, eventData' 
          }, { status: 400 });
        }

        await eventBroadcaster.broadcastEvent({
          eventType,
          workflowId,
          sourceUserId: user.id,
          targetUsers: targetUsers || [],
          data: eventData,
          timestamp: new Date()
        });

        return NextResponse.json({ success: true, message: 'Event broadcasted' });
      }

      case 'reprioritize_tasks': {
        const updatedCount = await taskQueueManager.reprioritizeTasks(clinicId);
        return NextResponse.json({ 
          success: true, 
          message: `Updated ${updatedCount} tasks` 
        });
      }

      case 'auto_assign_tasks': {
        const assignedCount = await taskQueueManager.autoAssignTasks(clinicId);
        return NextResponse.json({ 
          success: true, 
          message: `Assigned ${assignedCount} tasks` 
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow Management API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const workflowId = searchParams.get('workflowId');

    // ดึงข้อมูล clinic_id
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicId = userData.clinic_id;

    switch (type) {
      case 'my_tasks': {
        const status = searchParams.get('status')?.split(',');
        const priority = searchParams.get('priority')?.split(',');
        const limit = parseInt(searchParams.get('limit') || '50');

        const tasks = await taskQueueManager.getUserTasks(
          user.id,
          status as any,
          priority as any,
          limit
        );

        return NextResponse.json({ success: true, tasks });
      }

      case 'workflow_tasks': {
        if (!workflowId) {
          return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
        }

        const includeCompleted = searchParams.get('includeCompleted') === 'true';
        const tasks = await taskQueueManager.getWorkflowTasks(workflowId, includeCompleted);

        return NextResponse.json({ success: true, tasks });
      }

      case 'clinic_workflows': {
        const stage = searchParams.get('stage');
        const assignedTo = searchParams.get('assignedTo');
        
        const workflows = await workflowEngine.getClinicWorkflows(
          clinicId,
          stage as any,
          assignedTo || undefined
        );

        return NextResponse.json({ success: true, workflows });
      }

      case 'workflow_stats': {
        // ใช้ SQL function ที่สร้างใน migration
        const { data: stats } = await supabase
          .rpc('get_workflow_stats', { clinic_uuid: clinicId });

        return NextResponse.json({ success: true, stats });
      }

      case 'event_history': {
        if (!workflowId) {
          return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
        }

        const eventTypes = searchParams.get('eventTypes')?.split(',');
        const limit = parseInt(searchParams.get('limit') || '50');

        const events = await eventBroadcaster.getEventHistory(
          workflowId,
          eventTypes as any,
          limit
        );

        return NextResponse.json({ success: true, events });
      }

      case 'dashboard_summary': {
        // สรุปข้อมูล Workflow สำหรับ Dashboard
        const [workflows, myTasks] = await Promise.all([
          workflowEngine.getClinicWorkflows(clinicId),
          taskQueueManager.getUserTasks(user.id, ['pending', 'in_progress'])
        ]);

        // สถิติแยกตาม stage
        const stageStats = workflows.reduce((acc, workflow) => {
          acc[workflow.currentStage] = (acc[workflow.currentStage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Task priorities
        const taskPriorities = myTasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const summary = {
          totalWorkflows: workflows.length,
          activeWorkflows: workflows.filter(w => w.currentStage !== 'completed').length,
          completedToday: workflows.filter(w => 
            w.currentStage === 'completed' && 
            w.updatedAt.toDateString() === new Date().toDateString()
          ).length,
          myPendingTasks: myTasks.length,
          stageDistribution: stageStats,
          taskPriorities
        };

        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow Management GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
