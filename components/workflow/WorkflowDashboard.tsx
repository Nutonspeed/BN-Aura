/**
 * Workflow Dashboard Component
 * Phase 7: Cross-Role Workflow Integration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Activity,
  Filter
} from 'lucide-react';
import { UnifiedWorkflow, WorkflowStatistics } from '@/types/workflow';

interface WorkflowDashboardProps {
  userRole: 'sales_staff' | 'beautician' | 'clinic_owner';
  userId: string;
  clinicId: string;
}

export function WorkflowDashboard({ userRole, userId, clinicId }: WorkflowDashboardProps) {
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [statistics, setStatistics] = useState<WorkflowStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load workflows
      const workflowsResponse = await fetch('/api/workflow/enhanced', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        }
      });
      
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.data || []);
      }

      // Load statistics (for clinic owners)
      if (userRole === 'clinic_owner') {
        const statsResponse = await fetch(`/api/workflow/statistics?clinicId=${clinicId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId, userRole]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'scanned': return 'bg-blue-100 text-blue-800';
      case 'treatment_scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in_treatment': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'follow_up': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workflow Dashboard</h1>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          {userRole === 'clinic_owner' && (
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active treatment journeys
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((acc, w) => 
                    acc + w.tasks.filter(t => t.status === 'pending').length, 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting action
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((acc, w) => 
                    acc + w.tasks.filter(t => t.status === 'in_progress').length, 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((acc, w) => 
                    acc + w.tasks.filter(t => 
                      t.status === 'completed' && 
                      new Date(t.completed_at!).toDateString() === new Date().toDateString()
                    ).length, 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks finished today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Workflows */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.slice(0, 5).map((workflow) => (
                  <div key={workflow.state.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{workflow.customer.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {workflow.customer.email} • {workflow.customer.age} years old
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStageColor(workflow.state.current_stage)}>
                        {workflow.state.current_stage.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(workflow.state.priority_level)}>
                        {workflow.state.priority_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.state.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{workflow.customer.full_name}</h3>
                        <p className="text-gray-600">{workflow.customer.email}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(workflow.state.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getStageColor(workflow.state.current_stage)}>
                          {workflow.state.current_stage.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(workflow.state.priority_level)}>
                          {workflow.state.priority_level}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Assigned Staff</p>
                        <div className="flex space-x-4 mt-1">
                          {workflow.assignedSales && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span className="text-sm">Sales: {workflow.assignedSales.full_name}</span>
                            </div>
                          )}
                          {workflow.assignedBeautician && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span className="text-sm">Beautician: {workflow.assignedBeautician.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tasks Summary</p>
                        <div className="flex space-x-4 mt-1">
                          <span className="text-sm">
                            {workflow.tasks.filter(t => t.status === 'pending').length} pending
                          </span>
                          <span className="text-sm">
                            {workflow.tasks.filter(t => t.status === 'in_progress').length} in progress
                          </span>
                          <span className="text-sm">
                            {workflow.tasks.filter(t => t.status === 'completed').length} completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {workflow.state.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700">{workflow.state.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.flatMap(workflow => 
                  workflow.tasks
                    .filter(task => task.assigned_to === userId)
                    .map(task => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{task.task_title}</h4>
                            <p className="text-sm text-gray-600">{task.task_description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Customer: {workflow.customer.full_name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getTaskStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority_level)}>
                              {task.priority_level}
                            </Badge>
                          </div>
                        </div>
                        
                        {task.due_date && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="flex space-x-2 mt-3">
                          {task.status === 'pending' && (
                            <Button size="sm">Start Task</Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm">Complete Task</Button>
                          )}
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'clinic_owner' && statistics && (
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.completion_rate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks completed successfully
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.average_completion_time.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average task duration
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.overdue_tasks}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tasks past due date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.total_workflows}</div>
                  <p className="text-xs text-muted-foreground">
                    Total treatment journeys
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.staff_workload.map((staff) => (
                    <div key={staff.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{staff.user_name}</p>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span>Active: {staff.active_tasks}</span>
                        <span>Completed: {staff.completed_tasks}</span>
                        {staff.overdue_tasks > 0 && (
                          <span className="text-red-600">Overdue: {staff.overdue_tasks}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
