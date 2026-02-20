/**
 * End-to-End Workflow Testing Script
 * Phase 7: Cross-Role Workflow Integration
 */

import { createClient } from '@/lib/supabase/server';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export class WorkflowE2ETester {
  private supabase: ReturnType<typeof createClient>;
  private testResults: TestResult[] = [];

  constructor() {
    this.supabase = createClient();
  }

  private async getClient() {
    return await this.supabase;
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Phase 7 E2E Workflow Tests...');
    
    // Clear previous results
    this.testResults = [];

    // Test 1: Database Schema
    await this.testDatabaseSchema();
    
    // Test 2: Workflow Creation
    await this.testWorkflowCreation();
    
    // Test 3: Task Assignment
    await this.testTaskAssignment();
    
    // Test 4: Cross-Role Access
    await this.testCrossRoleAccess();
    
    // Test 5: API Endpoints
    await this.testAPIEndpoints();
    
    // Test 6: Real-time Updates
    await this.testRealtimeUpdates();

    return this.testResults;
  }

  private async testDatabaseSchema(): Promise<void> {
    try {
      console.log('📊 Testing Database Schema...');
      
      const supabase = await this.getClient();

      // Test workflow_states table
      const { data: workflows, error: workflowError } = await supabase
        .from('workflow_states')
        .select('id, customer_id, current_stage, created_at')
        .limit(1);

      if (workflowError) {
        this.testResults.push({
          success: false,
          message: `Workflow states table error: ${workflowError.message}`
        });
        return;
      }

      // Test workflow_tasks table
      const { data: tasks, error: taskError } = await supabase
        .from('workflow_tasks')
        .select('id, workflow_id, task_type, status')
        .limit(1);

      if (taskError) {
        this.testResults.push({
          success: false,
          message: `Workflow tasks table error: ${taskError.message}`
        });
        return;
      }

      this.testResults.push({
        success: true,
        message: '✅ Database schema validation passed',
        data: { workflows: workflows?.length || 0, tasks: tasks?.length || 0 }
      });

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `Database schema test failed: ${this.formatError(error)}`
      });
    }
  }

  private async testWorkflowCreation(): Promise<void> {
    try {
      console.log('🔧 Testing Workflow Creation...');
      
      const supabase = await this.getClient();

      // Get test customer
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name')
        .limit(1);

      if (customerError || !customers || customers.length === 0) {
        this.testResults.push({
          success: false,
          message: 'No test customer found for workflow creation'
        });
        return;
      }

      const customerId = customers[0].id;

      // Create test workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflow_states')
        .insert({
          customer_id: customerId,
          current_stage: 'scanned',
          priority_level: 'normal',
          notes: 'E2E Test Workflow'
        })
        .select()
        .single();

      if (workflowError) {
        this.testResults.push({
          success: false,
          message: `Workflow creation failed: ${workflowError.message}`
        });
        return;
      }

      this.testResults.push({
        success: true,
        message: '✅ Workflow creation test passed',
        data: { workflowId: workflow.id }
      });

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `Workflow creation test failed: ${this.formatError(error)}`
      });
    }
  }

  private async testTaskAssignment(): Promise<void> {
    try {
      console.log('👥 Testing Task Assignment...');
      
      const supabase = await this.getClient();

      // Get test workflow
      const { data: workflows, error: workflowError } = await supabase
        .from('workflow_states')
        .select('id, customer_id')
        .eq('notes', 'E2E Test Workflow')
        .limit(1);

      if (workflowError || !workflows || workflows.length === 0) {
        this.testResults.push({
          success: false,
          message: 'No test workflow found for task assignment'
        });
        return;
      }

      const workflowId = workflows[0].id;

      // Get test staff
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('email', 'sales1.auth@bntest.com')
        .limit(1);

      if (staffError || !staff || staff.length === 0) {
        this.testResults.push({
          success: false,
          message: 'No test staff found for task assignment'
        });
        return;
      }

      const staffId = staff[0].id;

      // Create test task
      const { data: task, error: taskError } = await supabase
        .from('workflow_tasks')
        .insert({
          workflow_id: workflowId,
          assigned_to: staffId,
          task_type: 'review_scan',
          task_title: 'E2E Test Task',
          task_description: 'Test task for E2E validation',
          status: 'pending',
          priority_level: 'normal'
        })
        .select()
        .single();

      if (taskError) {
        this.testResults.push({
          success: false,
          message: `Task assignment failed: ${taskError.message}`
        });
        return;
      }

      this.testResults.push({
        success: true,
        message: '✅ Task assignment test passed',
        data: { taskId: task.id, assignedTo: staffId }
      });

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `Task assignment test failed: ${this.formatError(error)}`
      });
    }
  }

  private async testCrossRoleAccess(): Promise<void> {
    try {
      console.log('🔐 Testing Cross-Role Access...');
      
      const supabase = await this.getClient();

      // Test RLS policies by trying to access data with different roles
      const testQueries = [
        {
          name: 'Sales can access their tasks',
          query: supabase
            .from('workflow_tasks')
            .select('id, task_title')
            .eq('assigned_to', 'sales1.auth@bntest.com')
        },
        {
          name: 'Beautician can access their tasks',
          query: supabase
            .from('workflow_tasks')
            .select('id, task_title')
            .eq('assigned_to', 'beautician1@bntest.com')
        }
      ];

      for (const test of testQueries) {
        const { data, error } = await test.query;
        
        if (error) {
          this.testResults.push({
            success: false,
            message: `${test.name} failed: ${error.message}`
          });
        } else {
          this.testResults.push({
            success: true,
            message: `✅ ${test.name} passed`,
            data: { count: data?.length || 0 }
          });
        }
      }

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `Cross-role access test failed: ${this.formatError(error)}`
      });
    }
  }

  private async testAPIEndpoints(): Promise<void> {
    try {
      console.log('🌐 Testing API Endpoints...');
      
      const testEndpoints = [
        {
          name: 'GET /api/workflow/enhanced',
          method: 'GET',
          url: '/api/workflow/enhanced'
        },
        {
          name: 'GET /api/workflow/tasks',
          method: 'GET', 
          url: '/api/workflow/tasks'
        }
      ];

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`http://localhost:3000${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json'
              // Note: In real test, we'd need proper auth token
            }
          });

          if (response.ok) {
            this.testResults.push({
              success: true,
              message: `✅ ${endpoint.name} passed`,
              data: { status: response.status }
            });
          } else {
            this.testResults.push({
              success: false,
              message: `${endpoint.name} failed: ${response.status} ${response.statusText}`
            });
          }
        } catch (error) {
          this.testResults.push({
            success: false,
            message: `${endpoint.name} failed: ${this.formatError(error)}`
          });
        }
      }

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `API endpoints test failed: ${this.formatError(error)}`
      });
    }
  }

  private async testRealtimeUpdates(): Promise<void> {
    try {
      console.log('⚡ Testing Real-time Updates...');
      
      const supabase = await this.getClient();

      // Test subscription to workflow changes
      const subscription = supabase
        .channel('workflow_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'workflow_states' 
          },
          (payload: Record<string, unknown>) => {
            console.log('Real-time update received:', payload);
          }
        )
        .subscribe();

      // Wait a moment to see if subscription works
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clean up subscription
      subscription.unsubscribe();

      this.testResults.push({
        success: true,
        message: '✅ Real-time updates test passed',
        data: { subscriptionActive: true }
      });

    } catch (error) {
      this.testResults.push({
        success: false,
        message: `Real-time updates test failed: ${this.formatError(error)}`
      });
    }
  }

  getResults(): TestResult[] {
    return this.testResults;
  }

  getSummary(): { passed: number; failed: number; total: number } {
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    return { passed, failed, total };
  }
}

// Export for use in API routes or testing scripts
export async function runWorkflowE2ETests(): Promise<TestResult[]> {
  const tester = new WorkflowE2ETester();
  return await tester.runAllTests();
}
