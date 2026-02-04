/**
 * Beautician Workflow Task Queue
 * แสดง tasks ที่มอบหมายให้ beautician พร้อม realtime updates
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { 
  Clock, 
  User, 
  CalendarDots, 
  CheckCircle, 
  Play, 
  Pause,
  ChatCircle,
  WarningCircle,
  Scissors,
  Sparkle
} from '@phosphor-icons/react';

interface TaskItem {
  id: string;
  workflow_id: string;
  customer_name: string;
  treatment_type: string;
  scheduled_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'paused';
  room_number?: string;
  notes?: string;
  estimated_duration: number;
}

export default function WorkflowTaskQueue() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  
  const { events, broadcast } = useWorkflowEvents({
    onTreatmentScheduled: (workflowId, schedule) => {
      // Refresh tasks when new treatment is scheduled
      loadTasks();
    },
    onMessageReceived: (workflowId, message) => {
      // Show notification for new messages
      console.log('New message for workflow:', workflowId, message);
    }
  });

  // Load tasks for beautician
  const loadTasks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Query workflow_states for treatments assigned to this beautician
      const supabase = createClient();
      const { data, error } = await supabase
        .from('workflow_states')
        .select(`
          id,
          customer_id,
          current_stage,
          treatment_plan,
          assigned_beautician_id,
          created_at,
          updated_at,
          metadata,
          customers!inner(
            full_name,
            phone
          )
        `)
        .eq('assigned_beautician_id', user.id)
        .in('current_stage', ['treatment_scheduled', 'in_treatment'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to task items
      const taskItems: TaskItem[] = (data || []).map(workflow => ({
        id: workflow.id,
        workflow_id: workflow.id,
        customer_name: (workflow.customers as any)?.full_name || 'Unknown Customer',
        treatment_type: workflow.treatment_plan?.treatments?.[0] || 'General Treatment',
        scheduled_time: workflow.metadata?.scheduled_time || workflow.created_at,
        status: workflow.current_stage === 'in_treatment' ? 'in_progress' : 'scheduled',
        room_number: workflow.metadata?.room_number,
        notes: workflow.metadata?.notes,
        estimated_duration: workflow.treatment_plan?.duration || 60
      }));

      setTasks(taskItems);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      const supabase = createClient();
      
      // Update workflow stage
      const { error } = await supabase
        .from('workflow_states')
        .update({
          current_stage: newStatus === 'in_progress' ? 'in_treatment' : 
                        newStatus === 'completed' ? 'treatment_completed' : 
                        'treatment_scheduled',
          updated_at: new Date().toISOString(),
          metadata: {
            ...selectedTask,
            status: newStatus,
            last_updated_by: user?.id
          }
        })
        .eq('id', taskId);

      if (error) throw error;

      // Broadcast the update
      await broadcast('task_status_updated', taskId, {
        old_status: selectedTask?.status,
        newStatus,
        updated_by: user?.id,
        timestamp: new Date().toISOString()
      });

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Filter tasks
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  // Get status color
  const getStatusColor = (status: TaskItem['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Treatment Queue</h1>
        <p className="text-gray-400">Manage your scheduled treatments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Tasks', count: tasks.length },
          { id: 'scheduled', label: 'Scheduled', count: tasks.filter(t => t.status === 'scheduled').length },
          { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
          { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredTasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </div>
                    {task.room_number && (
                      <span className="text-gray-400 text-sm">Room {task.room_number}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {task.customer_name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      <span>{task.treatment_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimated_duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDots className="w-4 h-4" />
                      <span>{new Date(task.scheduled_time).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {task.notes && (
                    <p className="text-gray-400 text-sm">{task.notes}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {task.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        updateTaskStatus(task.id, 'in_progress');
                      }}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'paused')}
                        className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          updateTaskStatus(task.id, 'completed');
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <WarningCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChatCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Sparkle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tasks found</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedTask.customer_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Treatment</p>
                  <p className="text-white">{selectedTask.treatment_type}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-1">Duration</p>
                  <p className="text-white">{selectedTask.estimated_duration} minutes</p>
                </div>
                
                {selectedTask.room_number && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Room</p>
                    <p className="text-white">{selectedTask.room_number}</p>
                  </div>
                )}
                
                {selectedTask.notes && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Notes</p>
                    <p className="text-white">{selectedTask.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                
                {selectedTask.status === 'scheduled' && (
                  <button
                    onClick={() => {
                      updateTaskStatus(selectedTask.id, 'in_progress');
                      setSelectedTask(null);
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start Treatment
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
