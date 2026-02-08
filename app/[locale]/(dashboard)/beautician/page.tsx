'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  ClockCounterClockwise,
  ChatCircle,
  SpinnerGap,
  Stethoscope,
  CheckCircle,
  ClipboardText,
  Pulse,
  Lightning,
  Camera,
  ListChecks,
  CaretRight,
  ArrowLeft
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import TaskQueue from '@/components/beautician/TaskQueue';
import ProtocolInsights from '@/components/beautician/ProtocolInsights';
import ComparisonModal from '@/components/beautician/ComparisonModal';
import { cn } from '@/lib/utils';
import { useBeauticianTasks, useStartTreatment, useCompleteTreatment, useTaskRealtime } from '@/hooks/useBeauticianTasks';
import { toast } from 'sonner';

export default function BeauticianDashboard() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('beautician' as any);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<{
    id: string;
    customer_id: string;
    treatment_name?: string;
    priority?: 'high' | 'normal' | 'low';
    customers?: { name: string };
  } | null>(null);
  const [throughput, setThroughput] = useState({ completed: 0, total: 0 });
  const [checklist, setChecklist] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [automatedTasks, setAutomatedTasks] = useState<any[]>([]);

  const supabase = useMemo(() => createClient(), []);

  // Real-time task management hooks
  const { data: pendingTasks = [], isLoading: tasksLoading } = useBeauticianTasks('pending', 20);
  const startTreatment = useStartTreatment();
  const completeTreatment = useCompleteTreatment();
  
  // Setup real-time updates
  useTaskRealtime(userId || '');

  // Fetch appointments and create automated workflow tasks
  const fetchAppointmentsAndTasks = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Fetch today's and upcoming appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          customers(
            id, first_name, last_name, phone, email
          )
        `)
        .eq('staff_id', userId)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (!appointmentsError && appointments) {
        setUpcomingAppointments(appointments);
        
        // Auto-create workflow tasks for appointments that don't have them yet
        const tasksToCreate = [];
        for (const appointment of appointments) {
          if (appointment.status === 'confirmed' && !appointment.metadata?.workflow_id) {
            tasksToCreate.push({
              appointment_id: appointment.id,
              customer_id: appointment.customers?.id,
              treatment_names: appointment.services || [],
              appointment_time: appointment.appointment_date,
              start_time: appointment.start_time
            });
          }
        }

        if (tasksToCreate.length > 0) {
          await createAutomatedWorkflowTasks(tasksToCreate);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, [userId, supabase]);

  // Create automated workflow tasks for appointments
  const createAutomatedWorkflowTasks = async (appointments: any[]) => {
    for (const appointment of appointments) {
      try {
        // Get beautician's clinic_id first
        const { data: beauticianInfo } = await supabase
          .from('clinic_staff')
          .select('clinic_id')
          .eq('user_id', userId)
          .single();

        if (!beauticianInfo?.clinic_id) {
          console.error('Beautician clinic_id not found');
          continue;
        }

        // Create workflow state
        const { data: workflow, error: workflowError } = await supabase
          .from('workflow_states')
          .insert({
            customer_id: appointment.customer_id,
            current_stage: 'treatment_planned',
            assigned_beautician_id: userId,
            treatment_plan: {
              appointment_id: appointment.appointment_id,
              treatment_names: appointment.treatment_names,
              scheduled_time: appointment.appointment_time,
              start_time: appointment.start_time
            },
            clinic_id: beauticianInfo.clinic_id
          })
          .select()
          .single();

        if (workflowError) {
          console.error('❌ Workflow creation failed:', {
            error: workflowError,
            appointment: appointment.appointment_id,
            customer: appointment.customer_id
          });
          continue;
        }

        if (workflow) {
          console.log(`✅ Created workflow ${workflow.id} for appointment ${appointment.appointment_id}`);
          
          // Create initial tasks via API
          const treatmentName = Array.isArray(appointment.treatment_names) 
            ? appointment.treatment_names.join(', ') 
            : Array.isArray(appointment.services)
            ? appointment.services.map((s: any) => s.name || s).join(', ')
            : 'Treatment Session';

          const appointmentDateTime = appointment.start_time 
            ? new Date(`${appointment.appointment_time}T${appointment.start_time}`)
            : new Date(appointment.appointment_time);

          const tasksToCreate = [
            {
              workflow_id: workflow.id,
              assigned_to: userId,
              task_type: 'preparation',
              title: `เตรียมสำหรับ ${treatmentName}`,
              description: `เตรียมอุปกรณ์และวัสดุสำหรับ ${treatmentName}`,
              priority: 'medium',
              due_date: appointmentDateTime.toISOString()
            },
            {
              workflow_id: workflow.id,
              assigned_to: userId,
              task_type: 'consultation',
              title: 'ปรึกษาลูกค้า',
              description: 'ตรวจสอบการวิเคราะห์ผิวและแผนการรักษา',
              priority: 'high',
              due_date: appointmentDateTime.toISOString()
            }
          ];

          // Create tasks using API
          let tasksCreated = 0;
          for (const taskData of tasksToCreate) {
            try {
              console.log('🔄 Creating task:', taskData.title);
              const taskResponse = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
              });

              const taskResult = await taskResponse.json();
              
              if (!taskResponse.ok) {
                console.error('❌ Task creation failed:', {
                  status: taskResponse.status,
                  error: taskResult.error || taskResult,
                  task: taskData.title
                });
              } else {
                console.log(`✅ Created task: ${taskData.title}`);
                tasksCreated++;
              }
            } catch (taskError) {
              console.error('❌ Task creation API error:', {
                error: taskError,
                task: taskData.title
              });
            }
          }
          
          console.log(`📊 Workflow automation summary: ${tasksCreated}/${tasksToCreate.length} tasks created for appointment ${appointment.appointment_id}`);
          
          // Update appointment metadata with workflow_id
          const updatedMetadata = {
            ...appointment.metadata,
            workflow_id: workflow.id,
            workflow_created: new Date().toISOString()
          };
          
          await supabase
            .from('appointments')
            .update({ metadata: updatedMetadata })
            .eq('id', appointment.appointment_id);
        }
      } catch (error) {
        console.error('Error creating automated tasks:', error);
      }
    }
  };

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch real-time throughput and staff info
        const [staffRes, reportRes] = await Promise.all([
          supabase.from('clinic_staff').select('id, users:user_id(full_name)').eq('user_id', user.id).single(),
          fetch('/api/reports?type=beautician_overview').then(res => res.json())
        ]);
        
        if (staffRes.data?.users) {
          setStaffName((staffRes.data.users as any).full_name);
        }

        if (reportRes.success) {
          setThroughput({
            completed: reportRes.data.completedCases,
            total: reportRes.data.totalCases
          });
        }

        // Fetch active journey for this beautician
        const { data: journeys } = await supabase
          .from('customer_treatment_journeys')
          .select(`
            *,
            customers (
              full_name
            ),
            treatments (
              protocols
            )
          `)
          .or('journey_status.eq.treatment_planned,journey_status.eq.in_progress')
          .eq('assigned_beautician_id', user.id)
          .limit(1);
        
        if (journeys && journeys.length > 0) {
          const j = journeys[0];
          setActiveCase({
            id: j.id,
            customer_id: j.customer_id,
            treatment_name: (j.treatment_plan as any)?.treatment_name,
            priority: (j.metadata as any)?.priority || 'normal',
            customers: { name: (j.customers as any)?.full_name || 'Customer' }
          });

          // Initialize checklist from journey state or treatment protocols
          const existingChecklist = (j as any).treatment_checklist;
          if (Array.isArray(existingChecklist) && existingChecklist.length > 0) {
            setChecklist(existingChecklist);
          } else {
            const protocols = (j as any).treatments?.protocols;
            if (Array.isArray(protocols)) {
              setChecklist(protocols.map(p => ({ ...p, completed: false })));
            } else {
              setChecklist([]);
            }
          }
        } else {
          setActiveCase(null);
          setChecklist([]);
        }
      }
    } catch (err) {
      console.error('Beautician Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleToggleChecklist = async (index: number) => {
    if (!activeCase) return;
    
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);

    // Save to database
    try {
      await supabase
        .from('customer_treatment_journeys')
        .update({ treatment_checklist: newChecklist })
        .eq('id', activeCase.id);
    } catch (err) {
      console.error('Error saving checklist state:', err);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  useEffect(() => {
    if (userId) {
      fetchAppointmentsAndTasks();
      // Refresh appointments every 2 minutes
      const interval = setInterval(fetchAppointmentsAndTasks, 120000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchAppointmentsAndTasks]);

  const handleStartTreatment = async (taskId: string, workflowId: string) => {
    if (!userId) return;
    try {
      await startTreatment.mutateAsync({
        taskId,
        workflowId,
        beauticianId: userId
      });
      await fetchStaffData(); // Refresh dashboard state
    } catch (error) {
      console.error('Error starting treatment:', error);
    }
  };

  const handleCompleteTreatment = async (journeyId: string) => {
    // Find the task associated with this journey
    const task = pendingTasks.find(t => t.workflow_id === journeyId);
    if (!task) {
      toast.error('Task not found');
      return;
    }

    try {
      await completeTreatment.mutateAsync({
        taskId: task.id,
        workflowId: journeyId,
        notes: 'Treatment completed successfully according to protocol.'
      });
      await fetchStaffData(); // Refresh dashboard state
    } catch (error) {
      console.error('Error completing treatment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          กำลังซิงโครไนซ์โหนดโปรโตคอล...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />
      
      <ComparisonModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onSuccess={() => {}} // Could refresh insights if needed
        customerId={activeCase?.customer_id || ''}
      />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Stethoscope weight="duotone" className="w-4 h-4" />
            โหนดการดำเนินงานคลินิก
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            ระบบ<span className="text-primary">ทำงาน</span>, {staffName || 'ผู้ดำเนินการ'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            ให้บริการความงามที่มีความแม่นยำสูงผ่านโปรโตคอลทางคลินิก
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Card className="px-6 py-3 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">สถานะกะ</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  ปฏิบัติงาน
                </span>
              </div>
              <div className="h-8 w-px bg-emerald-500/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">ผลผลิตเซสชัน</span>
                <span className="text-xs font-bold text-foreground uppercase tabular-nums">{throughput.completed}/{throughput.total} เคส</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Task Queue */}
        <div className="lg:col-span-1">
          {userId && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TaskQueue 
                staffId={userId} 
                onStartTreatment={handleStartTreatment}
              />
            </motion.div>
          )}
        </div>

        {/* Center: Upcoming Appointments */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-[500px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                  <ClockCounterClockwise weight="duotone" className="w-6 h-6 text-blue-500" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[400px]">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment, idx) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-card border border-border/50 rounded-xl hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">
                              {appointment.customer?.first_name} {appointment.customer?.last_name}
                            </h4>
                            <Badge className={`text-xs ${
                              appointment.workflow_id 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                              {appointment.workflow_id ? '✓ พร้อม' : '⚠ กำลังตั้งค่า...'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appointment.treatment?.name || 'การรักษา'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(appointment.appointment_date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            appointment.status === 'confirmed' ? 'bg-emerald-500' :
                            appointment.status === 'pending' ? 'bg-amber-500' :
                            'bg-gray-400'
                          }`} />
                          {appointment.workflow_id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-6 px-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                              onClick={() => {
                                // Navigate to workflow or start preparation
                                toast.info('กำลังเปิดการจัดการเวิร์กโฟลว์...');
                              }}
                            >
                              View Tasks
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Workflow Progress Indicator */}
                      {appointment.workflow_id && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                                   style={{ width: '25%' }} />
                            </div>
                            <span className="text-xs text-muted-foreground">ก่อนเตรียม</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClockCounterClockwise className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">ไม่มีนัดหมายที่จะถึง</p>
                    <p className="text-xs mt-2">ตรวจสอบตารางหรือติดต่อผู้จัดการ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Protocol and Insights */}
        <div className="lg:col-span-1 space-y-8">
          {/* Case Context Header */}
          <AnimatePresence mode="wait">
            {activeCase ? (
              <motion.div 
                key="active-case"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="relative overflow-hidden group border-primary/20">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                    <Pulse className="w-48 h-48 text-primary" />
                  </div>

                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                          <User weight="duotone" className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-foreground tracking-tight">
                            {activeCase.customers?.name || 'ลูกค้า'}
                          </h3>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                              โปรโตคอล: <span className="text-primary">{activeCase.treatment_name || 'ทะเบียน'}</span>
                            </p>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {activeCase.id.slice(0,8)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={activeCase.priority === 'high' ? 'destructive' : 'default'} pulse={activeCase.priority === 'high'} className="font-black uppercase tracking-widest py-1.5 px-4">
                        <Lightning weight="fill" className="w-3 h-3 mr-2" />
                        ความสำคัญ {activeCase.priority || 'ปกติ'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="no-case"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card variant="ghost" className="p-16 border-2 border-dashed border-border/50 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 rounded-[30px] bg-secondary border border-border flex items-center justify-center text-muted-foreground opacity-20">
                    <ClockCounterClockwise weight="duotone" className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-foreground/30 uppercase tracking-[0.2em]">กำลังรอโหนดเคส</h4>
                    <p className="text-xs text-muted-foreground italic font-light tracking-widest">มอบหมายลำดับความสำคัญจากทะเบียนคลินิกเพื่อเริ่มโปรโตคอล</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clinical Protocols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            {activeCase && checklist.length > 0 && (
              <Card className="relative overflow-hidden group border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <ListChecks weight="duotone" className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>รายการตรวจสอบโปรโตคอลที่ใช้งาน</CardTitle>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">การติดตามความแม่นยำ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">ความคืบหน้า</p>
                    <Badge variant="default" className="font-black text-base">
                      {checklist.filter(c => c.completed).length}/{checklist.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {checklist.map((step, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleToggleChecklist(idx)}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left group/step",
                          step.completed 
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
                            : "bg-secondary/30 border-border/50 hover:border-primary/30 text-foreground/60 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all shadow-sm shrink-0",
                          step.completed ? "bg-emerald-500 text-white border-emerald-400" : "bg-card border-border group-hover/step:border-primary/30"
                        )}>
                          {step.completed ? <CheckCircle weight="fill" className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-bold uppercase tracking-tight truncate",
                            step.completed ? "line-through opacity-50 text-muted-foreground" : ""
                          )}>{step.action}</p>
                          <p className="text-[10px] opacity-60 font-medium italic truncate">{step.notes}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <ProtocolInsights 
              customerId={activeCase?.customer_id || ''} 
              journeyId={activeCase?.id}
            />
          </motion.div>

          {/* Quick Actions for Beautician */}
          <AnimatePresence>
            {activeCase && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <button 
                  onClick={() => handleCompleteTreatment(activeCase.id)}
                  className="p-8 bg-card border border-border rounded-[32px] hover:border-emerald-500/40 hover:shadow-card-hover transition-all group text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm border border-emerald-500/20">
                    <CheckCircle weight="duotone" className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">สิ้นสุดเซสชัน</span>
                </button>

                <button 
                  onClick={() => setIsCompareModalOpen(true)}
                  className="p-8 bg-card border border-border rounded-[32px] hover:border-primary/40 hover:shadow-card-hover transition-all group text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm border border-primary/20">
                    <Camera weight="duotone" className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] group-hover:text-primary transition-colors">การเปลี่ยนแปลง</span>
                </button>

                <button className="p-8 bg-card border border-border rounded-[32px] hover:border-rose-500/40 hover:shadow-card-hover transition-all group text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/[0.02] transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm border border-rose-500/20">
                    <ChatCircle weight="duotone" className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] group-hover:text-rose-600 transition-colors">ข้อมูลการขาย</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
