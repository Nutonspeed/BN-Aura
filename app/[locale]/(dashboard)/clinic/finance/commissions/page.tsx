'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollar,
  Check,
  Clock,
  Spinner,
  ArrowLeft,
  FunnelSimple,
  User,
  CalendarDots,
  Bank,
  Receipt,
  Plus,
  CaretDown
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface Payout {
  id: string;
  clinic_id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  deductions: number;
  adjustments: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  commission_record_ids: string[];
}

interface StaffMember {
  user_id: string;
  role: string;
  users: { full_name: string; email: string } | null;
}

export default function CommissionPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('pending');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPayout, setNewPayout] = useState({
    staffId: '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`
    };
  }, []);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/commissions/payouts?${statusParam}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (e) {
      console.error('Failed to fetch payouts:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStaff = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('user_id, role, users:user_id(full_name, email)')
        .eq('is_active', true)
        .in('role', ['sales_staff', 'beautician', 'sales_manager']);

      setStaff((staffData as any) || []);
    } catch (e) {
      console.error('Failed to fetch staff:', e);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleCreatePayout = async () => {
    if (!newPayout.staffId) {
      toast.error('กรุณาเลือกพนักงาน');
      return;
    }
    setProcessing('create');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/commissions/payouts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          staffId: newPayout.staffId,
          periodStart: newPayout.periodStart,
          periodEnd: newPayout.periodEnd,
          notes: newPayout.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('สร้างรายการจ่ายคอมมิชชั่นแล้ว');
        setShowCreateForm(false);
        setNewPayout({ staffId: '', periodStart: newPayout.periodStart, periodEnd: newPayout.periodEnd, notes: '' });
        fetchPayouts();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateStatus = async (payoutId: string, newStatus: string, extra?: Record<string, string>) => {
    setProcessing(payoutId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/commissions/payouts', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ payoutId, status: newStatus, ...extra })
      });
      const data = await res.json();
      if (data.success) {
        const msg = newStatus === 'approved' ? 'อนุมัติแล้ว' : newStatus === 'paid' ? 'บันทึกการจ่ายแล้ว' : 'อัปเดตแล้ว';
        toast.success(msg);
        fetchPayouts();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setProcessing(null);
    }
  };

  const formatTHB = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" size="sm" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock weight="bold" className="w-3 h-3 mr-1" />รอดำเนินการ</Badge>;
      case 'approved': return <Badge variant="default" size="sm" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Check weight="bold" className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>;
      case 'paid': return <Badge variant="default" size="sm" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CurrencyDollar weight="bold" className="w-3 h-3 mr-1" />จ่ายแล้ว</Badge>;
      default: return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const getStaffName = (staffId: string) => {
    const s = staff.find(s => s.user_id === staffId);
    return (s?.users as any)?.full_name || (s?.users as any)?.email || staffId.slice(0, 8);
  };

  const summaryStats = {
    totalPending: payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.net_amount, 0),
    totalApproved: payouts.filter(p => p.status === 'approved').reduce((s, p) => s + p.net_amount, 0),
    totalPaid: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0),
    count: payouts.length
  };

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'paid', label: 'จ่ายแล้ว' },
    { value: 'all', label: 'ทั้งหมด' },
  ];

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/clinic/finance/reports')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CurrencyDollar weight="duotone" className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">คอมมิชชั่น & การจ่ายเงิน</h1>
              <p className="text-sm text-muted-foreground">จัดการการจ่ายคอมมิชชั่นให้พนักงาน</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          สร้างรายการจ่าย
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">รอดำเนินการ</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatTHB(summaryStats.totalPending)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">อนุมัติแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatTHB(summaryStats.totalApproved)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyDollar className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">จ่ายแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatTHB(summaryStats.totalPaid)}</p>
        </div>
      </div>

      {/* Create Payout Form */}
      {showCreateForm && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold">สร้างรายการจ่ายคอมมิชชั่นใหม่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">พนักงาน</label>
              <select
                value={newPayout.staffId}
                onChange={e => setNewPayout(p => ({ ...p, staffId: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm"
              >
                <option value="">-- เลือกพนักงาน --</option>
                {staff.map(s => (
                  <option key={s.user_id} value={s.user_id}>
                    {(s.users as any)?.full_name || (s.users as any)?.email || s.user_id.slice(0, 8)} ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">เริ่มต้น</label>
                <input type="date" value={newPayout.periodStart} onChange={e => setNewPayout(p => ({ ...p, periodStart: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">สิ้นสุด</label>
                <input type="date" value={newPayout.periodEnd} onChange={e => setNewPayout(p => ({ ...p, periodEnd: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">หมายเหตุ</label>
            <input type="text" value={newPayout.notes} onChange={e => setNewPayout(p => ({ ...p, notes: e.target.value }))} placeholder="หมายเหตุ (ไม่บังคับ)" className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-xl">ยกเลิก</Button>
            <Button onClick={handleCreatePayout} disabled={processing === 'create'} className="rounded-xl">
              {processing === 'create' ? <Spinner className="w-4 h-4 animate-spin mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
              คำนวณและสร้างรายการ
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <FunnelSimple className="w-4 h-4 text-muted-foreground" />
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
            filter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Payouts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <CurrencyDollar className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">ไม่มีรายการจ่ายคอมมิชชั่น</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold">{getStaffName(p.staff_id)}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDots className="w-3.5 h-3.5" />
                        {formatDate(p.period_start)} — {formatDate(p.period_end)}
                      </span>
                      <span>{p.commission_record_ids?.length || 0} รายการ</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>ยอดรวม: <strong>{formatTHB(p.total_amount)}</strong></span>
                      {p.deductions > 0 && <span className="text-red-500">หัก: {formatTHB(p.deductions)}</span>}
                      {p.adjustments !== 0 && <span className="text-blue-500">ปรับ: {formatTHB(p.adjustments)}</span>}
                      <span className="font-bold text-emerald-600">สุทธิ: {formatTHB(p.net_amount)}</span>
                    </div>
                    {p.notes && <p className="text-[10px] text-muted-foreground/60">หมายเหตุ: {p.notes}</p>}
                    {p.paid_at && <p className="text-[10px] text-muted-foreground/60">จ่ายเมื่อ: {formatDate(p.paid_at)} | {p.payment_method || '-'} | Ref: {p.payment_reference || '-'}</p>}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {p.status === 'pending' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(p.id, 'approved')} disabled={processing === p.id} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                      {processing === p.id ? <Spinner className="w-4 h-4 animate-spin" /> : <><Check weight="bold" className="w-4 h-4 mr-1" />อนุมัติ</>}
                    </Button>
                  )}
                  {p.status === 'approved' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(p.id, 'paid', { paymentMethod: 'bank_transfer' })} disabled={processing === p.id} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                      {processing === p.id ? <Spinner className="w-4 h-4 animate-spin" /> : <><Bank weight="bold" className="w-4 h-4 mr-1" />บันทึกจ่าย</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
