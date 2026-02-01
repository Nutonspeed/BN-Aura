/**
 * Sales Workflow Kanban Board
 * แสดง workflows ในรูปแบบ Kanban ตาม stage
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { workflowBridge, WorkflowData } from '@/lib/workflow/workflowBridge';
import { 
  User, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const workflowStages = [
  { id: 'lead_created', label: 'Lead Created', color: 'bg-blue-500' },
  { id: 'scanned', label: 'Scanned', color: 'bg-purple-500' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-500' },
  { id: 'payment_confirmed', label: 'Payment Confirmed', color: 'bg-green-500' },
  { id: 'treatment_scheduled', label: 'Treatment Scheduled', color: 'bg-indigo-500' },
  { id: 'in_treatment', label: 'In Treatment', color: 'bg-pink-500' },
  { id: 'treatment_completed', label: 'Completed', color: 'bg-emerald-500' }
];

interface WorkflowCard {
  id: string;
  customer_id: string;
  customer_name?: string;
  current_stage: string;
  treatment_plan?: any;
  created_at: string;
  estimated_commission?: number;
}

export default function WorkflowKanban() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Record<string, WorkflowCard[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowCard | null>(null);
  
  const { events, broadcast } = useWorkflowEvents({
    onStageChange: (workflowId, oldStage, newStage) => {
      // Update local state when stage changes
      setWorkflows(prev => {
        const updated = { ...prev };
        
        // Move card between columns
        const oldStageCards = prev[oldStage] || [];
        const cardIndex = oldStageCards.findIndex(w => w.id === workflowId);
        
        if (cardIndex !== -1) {
          const [card] = oldStageCards.splice(cardIndex, 1);
          card.current_stage = newStage;
          
          if (!updated[newStage]) {
            updated[newStage] = [];
          }
          updated[newStage].push(card);
        }
        
        return updated;
      });
    },
    onCommissionEarned: (workflowId, amount) => {
      console.log(`Commission earned: ${amount} for workflow ${workflowId}`);
    }
  });

  // Load workflows
  useEffect(() => {
    if (!user?.id) return;

    const loadWorkflows = async () => {
      try {
        setLoading(true);
        
        // Use unified API to get sales workflows
        const response = await fetch('/api/workflow/unified?operation=list_by_sales&sales_id=' + user.id);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Group by stage
          const grouped: Record<string, WorkflowCard[]> = {};
          
          workflowStages.forEach(stage => {
            grouped[stage.id] = [];
          });
          
          result.data.forEach((workflow: any) => {
            if (!grouped[workflow.current_stage]) {
              grouped[workflow.current_stage] = [];
            }
            
            grouped[workflow.current_stage].push({
              id: workflow.id,
              customer_id: workflow.customer_id,
              customer_name: workflow.metadata?.customer_name || 'Unknown',
              current_stage: workflow.current_stage,
              treatment_plan: workflow.treatment_plan,
              created_at: workflow.created_at,
              estimated_commission: workflow.estimated_commission
            });
          });
          
          setWorkflows(grouped);
        }
      } catch (error) {
        console.error('Failed to load workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [user?.id]);

  // Handle stage transition
  const handleStageTransition = async (workflowId: string, newStage: string) => {
    try {
      await fetch('/api/workflow/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'transition',
          workflowId,
          data: { new_stage: newStage }
        })
      });
      
      // Broadcast the change
      await broadcast('workflow_stage_changed', workflowId, {
        old_stage: selectedWorkflow?.current_stage,
        new_stage: newStage,
        changed_by: user?.id
      });
      
      setSelectedWorkflow(null);
    } catch (error) {
      console.error('Failed to transition workflow:', error);
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
        <h1 className="text-3xl font-bold text-white mb-2">Sales Workflow Board</h1>
        <p className="text-gray-400">Manage customer journey through treatment pipeline</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {workflowStages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className={`${stage.color} rounded-lg p-4 mb-4`}>
              <h3 className="text-white font-semibold">{stage.label}</h3>
              <p className="text-white/80 text-sm">{workflows[stage.id]?.length || 0} items</p>
            </div>
            
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {workflows[stage.id]?.map(workflow => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium">{workflow.customer_name}</h4>
                      {workflow.estimated_commission && (
                        <span className="text-green-400 text-sm">
                          ฿{workflow.estimated_commission.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(workflow.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {workflow.treatment_plan && (
                      <div className="mt-2">
                        <p className="text-gray-400 text-xs">
                          {workflow.treatment_plan.treatments?.[0] || 'No treatment'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Detail Modal */}
      <AnimatePresence>
        {selectedWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedWorkflow(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedWorkflow.customer_name}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Stage</p>
                  <p className="text-white capitalize">
                    {workflowStages.find(s => s.id === selectedWorkflow.current_stage)?.label}
                  </p>
                </div>
                
                {selectedWorkflow.estimated_commission && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Estimated Commission</p>
                    <p className="text-green-400 font-semibold">
                      ฿{selectedWorkflow.estimated_commission.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {selectedWorkflow.treatment_plan && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Treatment Plan</p>
                    <p className="text-white">
                      {selectedWorkflow.treatment_plan.treatments?.join(', ') || 'No treatments'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {workflowStages.map((stage, index) => {
                  const currentIndex = workflowStages.findIndex(s => s.id === selectedWorkflow.current_stage);
                  const isNext = index === currentIndex + 1;
                  const isCompleted = index < currentIndex;
                  
                  return (
                    <button
                      key={stage.id}
                      disabled={!isNext}
                      onClick={() => handleStageTransition(selectedWorkflow.id, stage.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400'
                          : isNext
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : stage.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
