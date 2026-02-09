'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  User,
  CalendarDots,
  ChatCircle,
  ShoppingCart,
  CurrencyDollar,
  Phone,
  Sparkle,
  Timer,
  Play,
  Pause,
  ArrowRight,
  Warning,
  CheckSquare,
  Square
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SalesTask {
  id: string;
  taskType: 'scan_customer' | 'send_proposal' | 'follow_up_upsell' | 'customer_follow_up' | 'payment_reminder' | 'appointment_reminder';
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  estimatedDuration?: number; // minutes
  createdAt: string;
  completedAt?: string;
}

export default function SalesDailyTasks() {
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    // Refresh every 2 minutes
    const interval = setInterval(fetchTasks, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff info
      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!staffData) return;

      // Get assigned customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, status, created_at, updated_at, metadata')
        .eq('assigned_sales_id', user.id)
        .order('created_at', { ascending: false });

      if (!customers) return;

      const taskList: SalesTask[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      customers.forEach(customer => {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        const daysSinceUpdated = Math.floor(
          (Date.now() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generate tasks based on customer status and timeline

        // 1. New customer scan task (within 24 hours)
        if (customer.status === 'new' && daysSinceCreated <= 1) {
          taskList.push({
            id: `scan-${customer.id}`,
            taskType: 'scan_customer',
            title: 'สแกนผิวใหม่',
            description: `ทำ AI skin analysis ให้ ${customer.full_name}`,
            customerId: customer.id,
            customerName: customer.full_name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            priority: daysSinceCreated === 0 ? 'critical' : 'high',
            status: 'pending',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 30,
            createdAt: customer.created_at
          });
        }

        // 2. Send proposal task (after scan, within 48 hours)
        if (customer.status === 'qualified' && daysSinceUpdated <= 2) {
          taskList.push({
            id: `proposal-${customer.id}`,
            taskType: 'send_proposal',
            title: 'ส่งใบเสนอราคา',
            description: `สร้างและส่งใบเสนอราคาให้ ${customer.full_name}`,
            customerId: customer.id,
            customerName: customer.full_name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            priority: daysSinceUpdated <= 1 ? 'high' : 'medium',
            status: 'pending',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 20,
            createdAt: customer.updated_at
          });
        }

        // 3. Follow-up task (no contact > 3 days)
        if (daysSinceUpdated > 3 && daysSinceUpdated <= 7 && customer.status !== 'converted') {
          taskList.push({
            id: `followup-${customer.id}`,
            taskType: 'customer_follow_up',
            title: 'ติดตามลูกค้า',
            description: `โทรหรือ chat ติดตาม ${customer.full_name}`,
            customerId: customer.id,
            customerName: customer.full_name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            priority: daysSinceUpdated > 5 ? 'high' : 'medium',
            status: 'pending',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 15,
            createdAt: customer.updated_at
          });
        }

        // 4. Upsell follow-up (converted customers > 30 days)
        if (customer.status === 'converted') {
          const lastPurchase = (customer.metadata as any)?.last_purchase_date;
          if (lastPurchase) {
            const daysSincePurchase = Math.floor(
              (Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSincePurchase >= 30 && daysSincePurchase <= 35) {
              taskList.push({
                id: `upsell-${customer.id}`,
                taskType: 'follow_up_upsell',
                title: 'เสนอการซื้อ',
                description: `ติดตามเพื่อเสนอ treatment ถัดไปให้ ${customer.full_name}`,
                customerId: customer.id,
                customerName: customer.full_name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                priority: 'medium',
                status: 'pending',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedDuration: 20,
                createdAt: new Date(lastPurchase).toISOString()
              });
            }
          }
        }
      });

      // Sort by priority and due date
      taskList.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });

      setTasks(taskList);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: 'start' | 'complete' | 'pause') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'start':
            return { ...task, status: 'in_progress' as const };
          case 'complete':
            return { ...task, status: 'completed' as const, completedAt: new Date().toISOString() };
          case 'pause':
            return { ...task, status: 'pending' as const };
        }
      }
      return task;
    }));

    if (action === 'start') {
      setActiveTask(taskId);
    } else if (action === 'complete' || action === 'pause') {
      setActiveTask(null);
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'scan_customer': return <Sparkle className="w-4 h-4" />;
      case 'send_proposal': return <ShoppingCart className="w-4 h-4" />;
      case 'customer_follow_up': return <Phone className="w-4 h-4" />;
      case 'follow_up_upsell': return <TrendUp className="w-4 h-4" />;
      case 'payment_reminder': return <CurrencyDollar className="w-4 h-4" />;
      case 'appointment_reminder': return <CalendarDots className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      case 'high': return 'border-orange-500/30 bg-orange-500/5';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'low': return 'border-green-500/30 bg-green-500/5';
      default: return 'border-border bg-muted/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge className="bg-red-500/10 text-red-500 text-xs">ด่วนที่สุด</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-500 text-xs">ด่วน</Badge>;
      case 'medium': return <Badge className="bg-yellow-500/10 text-yellow-500 text-xs">ปานกลาง</Badge>;
      case 'low': return <Badge className="bg-green-500/10 text-green-500 text-xs">ทั่วไป</Badge>;
      default: return null;
    }
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    estimatedTime: tasks
      .filter(t => t.status === 'pending' || t.status === 'in_progress')
      .reduce((sum, t) => sum + (t.estimatedDuration || 0), 0)
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <CheckSquare weight="duotone" className="w-6 h-6 text-blue-500" />
            งานวันนี้
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.pending + stats.inProgress} คงเหลือ
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
              {completionRate}% เสร็จ
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>ความคืบหน้าวันนี้</span>
            <span>{stats.completed}/{stats.total} งาน</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
            />
          </div>
          {stats.estimatedTime > 0 && (
            <p className="text-xs text-muted-foreground">
              เวลาที่คาดว่าจะใช้: ~{Math.round(stats.estimatedTime / 60 * 10) / 10} ชั่วโมง
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            ทั้งหมด ({stats.total})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="text-xs"
          >
            รอดำเนินการ ({stats.pending})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in_progress')}
            className="text-xs"
          >
            กำลังทำ ({stats.inProgress})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className="text-xs"
          >
            เสร็จแล้ว ({stats.completed})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ไม่มีงานในรายการนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  getPriorityColor(task.priority),
                  task.status === 'completed' && 'opacity-60',
                  activeTask === task.id && 'ring-2 ring-primary/50'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getTaskIcon(task.taskType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        {getPriorityBadge(task.priority)}
                        {task.estimatedDuration && (
                          <Badge variant="outline" className="text-xs">
                            <Timer className="w-3 h-3 mr-1" />
                            {task.estimatedDuration} นาที
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{task.customerName}</span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>
                              กำหนด: {new Date(task.dueDate).toLocaleDateString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : task.status === 'in_progress' ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {task.status !== 'completed' && (
                  <div className="flex items-center gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleTaskAction(task.id, 'start')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Play className="w-3 h-3" />
                        เริ่มทำ
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(task.id, 'pause')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Pause className="w-3 h-3" />
                          หยุดชั่วคราว
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTaskAction(task.id, 'complete')}
                          className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600"
                        >
                          <CheckSquare className="w-3 h-3" />
                          เสร็จแล้ว
                        </Button>
                      </>
                    )}

                    <div className="flex-1" />

                    {/* Quick actions based on task type */}
                    {task.taskType === 'scan_customer' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/th/sales/skin-analysis?customerId=${task.customerId}`}
                        className="text-xs"
                      >
                        สแกนผิว
                      </Button>
                    )}
                    
                    {task.taskType === 'send_proposal' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/th/sales/customers/${task.customerId}`}
                        className="text-xs"
                      >
                        สร้างใบเสนอ
                      </Button>
                    )}
                    
                    {(task.taskType === 'customer_follow_up' || task.taskType === 'follow_up_upsell') && (
                      <>
                        {task.customerPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `tel:${task.customerPhone}`}
                            className="text-xs"
                          >
                            โทร
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/th/sales/chat?customerId=${task.customerId}`}
                          className="text-xs"
                        >
                          Chat
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
