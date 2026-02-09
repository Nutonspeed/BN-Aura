'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Phone,
  ChatCircle,
  EnvelopeSimple,
  CalendarDots,
  User,
  TrendUp,
  Warning,
  CheckCircle,
  X,
  Bell,
  ArrowRight,
  Timer
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface FollowUpReminder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  lastContact: string;
  daysSinceContact: number;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  status: 'pending' | 'completed' | 'skipped';
}

export default function FollowUpReminders() {
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const supabase = createClient();

  useEffect(() => {
    fetchReminders();
    // Refresh every 5 minutes
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
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
        .select('id, full_name, email, phone, updated_at, status, metadata')
        .eq('assigned_sales_id', user.id)
        .order('updated_at', { ascending: false });

      if (!customers) return;

      const reminderList: FollowUpReminder[] = [];

      customers.forEach(customer => {
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        let urgency: 'high' | 'medium' | 'low' = 'low';
        let reason = '';
        let suggestedAction = '';

        // Determine urgency based on days since contact and customer status
        if (daysSinceContact > 7 && customer.status === 'new') {
          urgency = 'high';
          reason = 'ลูกค้าใหม่ไม่ได้รับการติดต่อเกิน 7 วัน';
          suggestedAction = 'โทรติดตามพร้อมเสนอ skin analysis ฟรี';
        } else if (daysSinceContact > 14) {
          urgency = 'high';
          reason = 'ไม่ได้ติดต่อเกิน 2 สัปดาห์';
          suggestedAction = 'โทรหรือส่งอีเมลพร้อมข้อเสนอพิเศษ';
        } else if (daysSinceContact > 5 && customer.status === 'qualified') {
          urgency = 'medium';
          reason = 'ลูกค้าที่สนใจไม่ได้รับการติดตามเกิน 5 วัน';
          suggestedAction = 'ส่งข้อมูลเพิ่มเติมเกี่ยวกับ treatment';
        } else if (daysSinceContact > 3 && (customer.metadata as any)?.urgency_score > 0.7) {
          urgency = 'medium';
          reason = 'ลูกค้าที่มีความเร่งด่วนสูงไม่ได้รับการติดตามเกิน 3 วัน';
          suggestedAction = 'โทรติดตามทันที';
        } else if (daysSinceContact > 10) {
          urgency = 'low';
          reason = 'ไม่ได้ติดต่อเกิน 10 วัน';
          suggestedAction = 'ส่งข้อความทักทาย';
        }

        // Only add if needs follow-up
        if (daysSinceContact > 3 && urgency !== 'low') {
          reminderList.push({
            id: customer.id,
            customerId: customer.id,
            customerName: customer.full_name || 'ไม่ระบุ',
            customerEmail: customer.email,
            customerPhone: customer.phone,
            lastContact: customer.updated_at,
            daysSinceContact,
            urgency,
            reason,
            suggestedAction,
            status: 'pending'
          });
        }
      });

      // Sort by urgency and days since contact
      reminderList.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return b.daysSinceContact - a.daysSinceContact;
      });

      setReminders(reminderList.slice(0, 10)); // Show top 10
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reminder: FollowUpReminder, action: 'call' | 'chat' | 'email') => {
    try {
      switch (action) {
        case 'call':
          if (reminder.customerPhone) {
            window.location.href = `tel:${reminder.customerPhone}`;
          }
          break;
        case 'chat':
          window.location.href = `/th/sales/chat?customerId=${reminder.customerId}`;
          break;
        case 'email':
          if (reminder.customerEmail) {
            window.location.href = `mailto:${reminder.customerEmail}`;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to handle action:', error);
    }
  };

  const markAsCompleted = async (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const snoozeReminder = async (reminderId: string, hours: number) => {
    // Remove from current list and add back later
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    // In production, this would update database with snooze timestamp
    setTimeout(() => {
      fetchReminders();
    }, hours * 60 * 60 * 1000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500/30 bg-red-500/5';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'low': return 'border-green-500/30 bg-green-500/5';
      default: return 'border-border bg-muted/20';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <Warning className="w-4 h-4 text-red-500" />;
      case 'medium': return <Timer className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Clock className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredReminders = filter === 'all' 
    ? reminders 
    : reminders.filter(r => r.urgency === filter);

  const stats = {
    total: reminders.length,
    high: reminders.filter(r => r.urgency === 'high').length,
    medium: reminders.filter(r => r.urgency === 'medium').length,
    low: reminders.filter(r => r.urgency === 'low').length
  };

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
            <Bell weight="duotone" className="w-6 h-6 text-amber-500" />
            การติดตามลูกค้า
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.total} รายการ
            </Badge>
            {stats.high > 0 && (
              <Badge className="bg-red-500/10 text-red-500 text-xs">
                {stats.high} ด่วน
              </Badge>
            )}
          </div>
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
            variant={filter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
            className="text-xs"
          >
            ด่วน ({stats.high})
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('medium')}
            className="text-xs"
          >
            ปานกลาง ({stats.medium})
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
            className="text-xs"
          >
            ทั่วไป ({stats.low})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {filteredReminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ไม่มีรายการที่ต้องติดตามในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border transition-all hover:shadow-lg',
                  getUrgencyColor(reminder.urgency)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getUrgencyIcon(reminder.urgency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{reminder.customerName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {reminder.daysSinceContact} วัน
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {reminder.reason}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <ArrowRight className="w-3 h-3" />
                        <span>{reminder.suggestedAction}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsCompleted(reminder.id)}
                      className="text-green-500 hover:text-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reminder.customerPhone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(reminder, 'call')}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Phone className="w-3 h-3" />
                      โทร
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(reminder, 'chat')}
                    className="flex items-center gap-1 text-xs"
                  >
                    <ChatCircle className="w-3 h-3" />
                    Chat
                  </Button>
                  {reminder.customerEmail && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(reminder, 'email')}
                      className="flex items-center gap-1 text-xs"
                    >
                      <EnvelopeSimple className="w-3 h-3" />
                      Email
                    </Button>
                  )}
                  
                  <div className="flex-1" />
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => snoozeReminder(reminder.id, 2)}
                    className="text-xs text-muted-foreground"
                  >
                    2 ชม.
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => snoozeReminder(reminder.id, 24)}
                    className="text-xs text-muted-foreground"
                  >
                    1 วัน
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
