/**
 * Beautician Workflow Integration Component
 * Phase 7: Cross-Role Workflow Integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Eye
} from 'lucide-react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { WorkflowTask } from '@/types/workflow';
import type { TaskStatus } from '@/types/workflow';

interface BeauticianWorkflowIntegrationProps {
  beauticianId: string;
  onTaskUpdate?: (taskId: string, status: string) => void;
}

type WorkflowTaskWithComments = WorkflowTask & {
  comments?: Array<{
    id: string;
    author?: { full_name?: string };
    comment_text: string;
    created_at: string;
  }>;
  workflow?: { customer?: { full_name?: string } };
};

export function BeauticianWorkflowIntegration({ 
  beauticianId, 
  onTaskUpdate 
}: BeauticianWorkflowIntegrationProps) {
  const { tasks, updateTask, refreshTasks, error } = useWorkflow();
  const [selectedTask, setSelectedTask] = useState<WorkflowTaskWithComments | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const load = async () => {
      await refreshTasks({ assigned_to: beauticianId });
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [beauticianId, refreshTasks]);

  const loadAssignedTasks = async () => {
    await refreshTasks({ assigned_to: beauticianId });
  };

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      let newStatus: TaskStatus | undefined;
      switch (action) {
        case 'start':
          newStatus = 'in_progress';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'pause':
          newStatus = 'pending';
          break;
        default:
          return;
      }

      await updateTask({ task_id: taskId, status: newStatus });
      onTaskUpdate?.(taskId, newStatus);
      loadAssignedTasks(); // Refresh tasks
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;

    try {
      await fetch(`/api/workflow/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText.trim() })
      });
      setCommentText('');
      loadAssignedTasks(); // Refresh to show new comment
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
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

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'review_scan': return '🔬';
      case 'prepare_treatment': return '💉';
      case 'perform_treatment': return '✨';
      case 'follow_up': return '📞';
      case 'contact_customer': return '💬';
      case 'schedule_appointment': return '📅';
      default: return '📋';
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'review_scan': return 'ตรวจสอบผลการสแกน';
      case 'prepare_treatment': return 'เตรียมการรักษา';
      case 'perform_treatment': return 'ดำเนินการรักษา';
      case 'follow_up': return 'ติดตามผล';
      case 'contact_customer': return 'ติดต่อลูกค้า';
      case 'schedule_appointment': return 'นัดหมาย';
      default: return 'งานอื่นๆ';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const beauticianTasks = (tasks as WorkflowTaskWithComments[]).filter(task => task.assigned_to === beauticianId);
  const selectedComments = selectedTask?.comments ?? [];

  return (
    <div className="space-y-6">
      {/* Task Queue Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>คิวงานของฉัน</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {beauticianTasks.filter(t => t.status === 'pending').length} รอดำเนินงาน
              </Badge>
              <Badge variant="secondary">
                {beauticianTasks.filter(t => t.status === 'in_progress').length} กำลังทำ
              </Badge>
              <Badge variant="default">
                {tasks.filter(t => t.status === 'completed').length} เสร็จสมบูรณ์
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {beauticianTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <CheckCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่มีงานที่มอบหมาย
                </h3>
                <p className="text-gray-600">
                  ทุกอย่างเรียบร้อย! รอรับงานใหม่จาก sales team
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {beauticianTasks.map((task) => { const comments = task.comments ?? []; return (
                  <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getTaskTypeIcon(task.task_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{task.task_title}</h4>
                          <p className="text-sm text-gray-600">
                            {getTaskTypeLabel(task.task_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority_level)}>
                          {task.priority_level}
                        </Badge>
                        {task.due_date && isOverdue(task.due_date) && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            เลยกำหนด
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">ลูกค้า</p>
                        <p className="text-sm">
                          {task.workflow?.customer?.full_name || 'ไม่ระบุ'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">กำหนดเสร็จ</p>
                        <p className="text-sm">
                          {task.due_date ? 
                            new Date(task.due_date).toLocaleDateString('th-TH') : 
                            'ไม่ระบุ'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">ระยะเวลาโดยประมาณ</p>
                        <p className="text-sm">
                          {task.estimated_duration ? `${task.estimated_duration} นาที` : 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.task_description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">{task.task_description}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {task.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleTaskAction(task.id, 'start')}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            เริ่มทำงาน
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleTaskAction(task.id, 'complete')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              เสร็จสมบูรณ์
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTaskAction(task.id, 'pause')}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              หยุดชั่วคราว
                            </Button>
                          </>
                        )}
                        {task.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTaskAction(task.id, 'restart')}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            ทำใหม่
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTask(task)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          แสดงความเห็น
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </div>

                    {/* Task Comments */}
                    {comments && comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          ความเห็น ({comments.length})
                        </p>
                        <div className="space-y-2">
                          {comments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{comment.author?.full_name}</p>
                                  <p className="text-gray-600">{comment.comment_text}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                             ))}
                          {comments.length > 2 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{comments.length - 2} ความเห็นเพิ่มเติม
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Task Detail Modal */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>รายละเอียดงาน: {selectedTask.task_title}</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedTask(null)}
              >
                ปิด
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Task Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">ประเภทงาน</p>
                  <p>{getTaskTypeLabel(selectedTask.task_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">สถานะ</p>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">ความสำคัญ</p>
                  <Badge className={getPriorityColor(selectedTask.priority_level)}>
                    {selectedTask.priority_level}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">กำหนดเสร็จ</p>
                  <p>
                    {selectedTask.due_date ? 
                      new Date(selectedTask.due_date).toLocaleString('th-TH') : 
                      'ไม่ระบุ'
                    }
                  </p>
                </div>
              </div>

              {/* Add Comment */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">เพิ่มความเห็น</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="พิมพ์ความเห็นของคุณ..."
                    className="flex-1 p-2 border rounded"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                    ส่ง
                  </Button>
                </div>
              </div>

              {/* All Comments */}
              {selectedComments && selectedComments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    ความเห็นทั้งหมด ({selectedComments.length})
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedComments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{comment.author?.full_name}</p>
                            <p className="text-sm text-gray-600">{comment.comment_text}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
