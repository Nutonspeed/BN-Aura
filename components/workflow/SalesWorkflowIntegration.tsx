/**
 * Sales Workflow Integration Component
 * Phase 7: Cross-Role Workflow Integration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import { useWorkflowFromScan, useWorkflowTransitions } from '@/hooks/useWorkflow';
import { UnifiedWorkflow } from '@/types/workflow';

interface ScanResults {
  skinType?: string;
  overallScore?: number;
  age?: number;
  recommendations?: unknown[];
}

interface SalesWorkflowIntegrationProps {
  customerId: string;
  scanResults?: ScanResults;
  treatmentPlan?: Record<string, unknown>;
  onWorkflowCreated?: (workflowId: string) => void;
}

export function SalesWorkflowIntegration({ 
  customerId, 
  scanResults, 
  treatmentPlan,
  onWorkflowCreated 
}: SalesWorkflowIntegrationProps) {
  const { createWorkflowFromScan } = useWorkflowFromScan();
  const { moveToTreatmentScheduled } = useWorkflowTransitions();
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/enhanced?customer_search=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.data || []);
      }
    } catch (err) {
      console.error('Error loading customer workflows:', err);
    }
  }, [customerId, setWorkflows]);

  useEffect(() => {
    loadCustomerWorkflows();
  }, [loadCustomerWorkflows]);

  const handleCreateWorkflow = async () => {
    if (!scanResults) {
      setError('Scan results are required to create a workflow');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const workflow = await createWorkflowFromScan(customerId, scanResults, treatmentPlan);
      
      if (workflow) {
        setWorkflows(prev => [workflow, ...prev]);
        onWorkflowCreated?.(workflow.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleTreatment = async (workflowId: string) => {
    try {
      await moveToTreatmentScheduled(workflowId);
      loadCustomerWorkflows(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule treatment');
    }
  };

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

  const canCreateNewWorkflow = () => {
    return scanResults && workflows.length === 0;
  };

  return (
    <div className="space-y-6">
      {/* Create Workflow Section */}
      {canCreateNewWorkflow() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Treatment Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Start a treatment journey for this customer based on their scan results.
              </p>
              
              {scanResults && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Scan Results Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Skin Type:</span> {scanResults.skinType}
                    </div>
                    <div>
                      <span className="font-medium">Overall Score:</span> {scanResults.overallScore}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span> {scanResults.age}
                    </div>
                    <div>
                      <span className="font-medium">Recommendations:</span> {scanResults.recommendations?.length || 0}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCreateWorkflow}
                disabled={loading || !scanResults}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Start Treatment Journey'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Workflows */}
      {workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Treatment Journeys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.state.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Treatment Journey #{workflow.id.slice(-8)}</h3>
                      <p className="text-gray-600">
                        Started: {new Date(workflow.state.created_at).toLocaleDateString()}
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

                  {/* Workflow Progress */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(workflow.tasks.filter(t => t.status === 'completed').length / workflow.tasks.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {workflow.tasks.filter(t => t.status === 'completed').length}/{workflow.tasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Staff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Assigned Staff</p>
                      <div className="space-y-2">
                        {workflow.assignedSales && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Sales: {workflow.assignedSales.full_name}</span>
                          </div>
                        )}
                        {workflow.assignedBeautician && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Beautician: {workflow.assignedBeautician.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Tasks Summary</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">
                            {workflow.tasks.filter(t => t.status === 'pending').length}
                          </div>
                          <div className="text-gray-500">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">
                            {workflow.tasks.filter(t => t.status === 'in_progress').length}
                          </div>
                          <div className="text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">
                            {workflow.tasks.filter(t => t.status === 'completed').length}
                          </div>
                          <div className="text-gray-500">Completed</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Tasks</p>
                    <div className="space-y-2">
                      {workflow.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm">{task.task_title}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {workflow.state.current_stage === 'scanned' && (
                      <Button 
                        size="sm"
                        onClick={() => handleScheduleTreatment(workflow.state.id)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Treatment
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>

                  {/* Notes */}
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
      )}

      {/* No Workflows State */}
      {workflows.length === 0 && !canCreateNewWorkflow() && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Treatment Journeys
              </h3>
              <p className="text-gray-600 mb-4">
                Complete a skin analysis scan to start a treatment journey for this customer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
