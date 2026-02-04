'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  EnvelopeSimple, 
  CalendarDots, 
  Clock, 
  ArrowRight, 
  CheckCircle,
  WarningCircle,
  FileText,
  CreditCard,
  Scissors,
  ChatCircle,
  CaretLeft
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useWorkflow } from '@/hooks/useWorkflow';
import { WorkflowState, WorkflowStage } from '@/lib/workflow/workflowEngine';
import CustomerTimelineView from '@/components/sales/CustomerTimelineView';
import PredictiveAnalyticsView from '@/components/sales/PredictiveAnalyticsView';
import { getCustomerIntelligenceAction } from '@/app/actions/customer';
import { CustomerIntelligence } from '@/lib/customer/customerIntelligence';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<CustomerIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingJourney, setStartingJourney] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [beauticians, setBeauticians] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [selectedBeauticianId, setSelectedBeauticianId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  
  const { 
    workflows, 
    createWorkflow,
    listWorkflows, 
    executeTransition, 
    loading: workflowLoading 
  } = useWorkflow();

  // Find active workflow for this customer
  const activeWorkflow = workflows.find(w => 
    w.customerId === customerId && w.currentStage !== 'completed'
  );

  useEffect(() => {
    async function loadData() {
      if (!customerId) return;
      
      try {
        const supabase = createClient();
        
        // Fetch customer details
        const { data: customerData, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();
          
        if (error) throw error;
        setCustomer(customerData);

        // Fetch Intelligence
        const intelRes = await getCustomerIntelligenceAction(customerId);
        if (intelRes.success) {
          setIntelligence(intelRes.data || null);
        }

        // Fetch Workflows
        // Note: listWorkflows might need to be filtered by customerId in the hook or API
        // For now, we list all and filter on client, or assuming listWorkflows fetches relevant ones.
        // Ideally pass customerId to listWorkflows if supported, currently it supports stage/assignedTo.
        // Let's rely on listWorkflows fetching clinic workflows and we filter.
        await listWorkflows(); 

      } catch (err) {
        console.error('Error loading customer data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [customerId, listWorkflows]);

  const handleAction = async (action: string, data?: any) => {
    if (!activeWorkflow) return;
    
    try {
      await executeTransition(activeWorkflow.id, action, data);
      // Refresh logic handled by hook usually, or we reload
      await listWorkflows();
    } catch (err) {
      console.error('Action failed:', err);
      alert('Failed to execute action');
    }
  };

  const loadBeauticians = async () => {
    if (!customer?.clinic_id) return;

    try {
      setStaffLoading(true);
      const res = await fetch(`/api/v1/staff/profiles?clinic_id=${customer.clinic_id}`);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load staff profiles');
      }

      const rows = (json.data || []) as any[];
      const mapped = rows
        .filter(r => r?.users?.full_name)
        .map(r => ({
          id: r.user_id,
          name: r.users.full_name,
          role: r.role
        }))
        .filter(r => r.role === 'clinic_staff');

      setBeauticians(mapped);
    } catch (e) {
      console.error(e);
      setBeauticians([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const openSchedule = async () => {
    setScheduleOpen(true);
    await loadBeauticians();
  };

  const submitSchedule = async () => {
    if (!selectedBeauticianId || !appointmentDate || !appointmentTime) {
      alert('Please select beautician and set date/time');
      return;
    }

    await handleAction('schedule_appointment', {
      beauticianId: selectedBeauticianId,
      appointmentDate,
      appointmentTime
    });

    setScheduleOpen(false);
  };

  const handleStartNewJourney = async () => {
    if (!customerId || !customer) return;

    try {
      setStartingJourney(true);
      await createWorkflow({
        customerId,
        customerName: customer.full_name,
        customerEmail: customer.email || undefined,
        customerPhone: customer.phone || undefined
      });
      await listWorkflows();
    } catch (err) {
      console.error('Failed to start new journey:', err);
      alert('Failed to start new journey');
    } finally {
      setStartingJourney(false);
    }
  };

  const getStageColor = (stage: WorkflowStage) => {
    switch (stage) {
      case 'lead_created': return 'bg-gray-500/20 text-gray-400';
      case 'scanned': return 'bg-blue-500/20 text-blue-400';
      case 'proposal_sent': return 'bg-purple-500/20 text-purple-400';
      case 'payment_confirmed': return 'bg-emerald-500/20 text-emerald-400';
      case 'treatment_scheduled': return 'bg-orange-500/20 text-orange-400';
      case 'in_treatment': return 'bg-pink-500/20 text-pink-400';
      case 'treatment_completed': return 'bg-green-500/20 text-green-400';
      case 'follow_up': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Customer Not Found</h1>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{customer.full_name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {customer.phone}
            </span>
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {customer.email}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto">
          {activeWorkflow ? (
            <div className={`px-4 py-2 rounded-xl border border-white/10 ${getStageColor(activeWorkflow.currentStage)}`}>
              <span className="text-xs font-bold uppercase tracking-wider">
                Stage: {activeWorkflow.currentStage.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <button 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              onClick={handleStartNewJourney}
              disabled={startingJourney}
            >
              {startingJourney ? 'Starting...' : 'Start New Journey'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Workflow & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Workflow Card */}
          {activeWorkflow && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Current Action Required
                </h2>
              </div>

              {/* Action Buttons based on Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeWorkflow.currentStage === 'scanned' && (
                  <>
                    <button 
                      onClick={() => handleAction('send_proposal')}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left group"
                    >
                      <FileText className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-white">Send Proposal</h3>
                      <p className="text-xs text-gray-400 mt-1">Generate and send treatment plan</p>
                    </button>
                  </>
                )}

                {activeWorkflow.currentStage === 'proposal_sent' && (
                  <button 
                    onClick={() => handleAction('confirm_payment')}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left group"
                  >
                    <CreditCard className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white">Confirm Payment</h3>
                    <p className="text-xs text-gray-400 mt-1">Record payment and proceed</p>
                  </button>
                )}

                {activeWorkflow.currentStage === 'payment_confirmed' && (
                  <button 
                    onClick={openSchedule}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left group"
                  >
                    <Calendar className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white">Schedule Treatment</h3>
                    <p className="text-xs text-gray-400 mt-1">Assign beautician and time</p>
                  </button>
                )}

                {/* Status Only View for In-Treatment */}
                {['treatment_scheduled', 'in_treatment'].includes(activeWorkflow.currentStage) && (
                  <div className="col-span-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <Scissors className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
                    <h3 className="font-bold text-white">Treatment in Progress</h3>
                    <p className="text-sm text-blue-300 mt-1">Handled by Beautician Team</p>
                  </div>
                )}

                {activeWorkflow.currentStage === 'treatment_completed' && (
                  <button 
                    onClick={() => handleAction('send_follow_up')}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left group"
                  >
                    <MessageSquare className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white">Send Follow-up</h3>
                    <p className="text-xs text-gray-400 mt-1">Check satisfaction & instructions</p>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          {intelligence?.timeline && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">Customer Journey</h2>
              <CustomerTimelineView events={intelligence.timeline} />
            </div>
          )}
        </div>

        {/* Right Sidebar - Intelligence */}
        <div className="space-y-8">
          {/* Predictive Analytics */}
          {intelligence?.analytics && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">AI Insights</h2>
              <PredictiveAnalyticsView data={intelligence.analytics} />
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full py-3 px-4 bg-white/5 rounded-lg text-sm font-medium text-left hover:bg-white/10 transition-colors flex items-center justify-between group">
                <span>Edit Profile</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button className="w-full py-3 px-4 bg-white/5 rounded-lg text-sm font-medium text-left hover:bg-white/10 transition-colors flex items-center justify-between group">
                <span>View Scan History</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button className="w-full py-3 px-4 bg-white/5 rounded-lg text-sm font-medium text-left hover:bg-white/10 transition-colors flex items-center justify-between group">
                <span>Contact History</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {scheduleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setScheduleOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Schedule Treatment</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Beautician</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    value={selectedBeauticianId}
                    onChange={(e) => setSelectedBeauticianId(e.target.value)}
                    disabled={staffLoading}
                  >
                    <option value="">Select beautician</option>
                    {beauticians.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {staffLoading && (
                    <div className="text-xs text-gray-500 mt-2">Loading staff...</div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Date</div>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Time</div>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setScheduleOpen(false)}
                  className="flex-1 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSchedule}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
