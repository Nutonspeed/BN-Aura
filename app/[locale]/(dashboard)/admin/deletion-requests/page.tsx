'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Trash, 
  Check, 
  X, 
  Spinner, 
  Clock, 
  ShieldCheck,
  User,
  ArrowLeft,
  FunnelSimple
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface DeletionRequest {
  id: string;
  user_id: string;
  request_type: string;
  reason: string | null;
  status: string;
  processed_at: string | null;
  processed_by: string | null;
  metadata: any;
  created_at: string;
  users: { id: string; email: string; full_name: string } | null;
}

export default function DeletionRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/deletion-requests?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch deletion requests:', e);
    } finally {
      setLoading(false);
    }
  }, [getToken, filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleProcess = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/admin/deletion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(action === 'approve' ? 'อนุมัติคำขอลบข้อมูลแล้ว' : 'ปฏิเสธคำขอแล้ว');
        fetchRequests();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      console.error('Failed to process request:', e);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" size="sm" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock weight="bold" className="w-3 h-3 mr-1" /> รอดำเนินการ</Badge>;
      case 'approved':
        return <Badge variant="default" size="sm" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><Check weight="bold" className="w-3 h-3 mr-1" /> อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="secondary" size="sm" className="bg-red-500/10 text-red-600 border-red-500/20"><X weight="bold" className="w-3 h-3 mr-1" /> ปฏิเสธ</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'rejected', label: 'ปฏิเสธ' },
    { value: 'all', label: 'ทั้งหมด' },
  ];

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/admin')} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldCheck weight="duotone" className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">คำขอลบข้อมูล (PDPA)</h1>
            <p className="text-sm text-muted-foreground">จัดการคำขอลบข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <FunnelSimple className="w-4 h-4 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              filter === f.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Trash className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">ไม่มีคำขอลบข้อมูล</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold">
                        {req.users?.full_name || req.users?.email || req.user_id}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.users?.email || 'ไม่ทราบอีเมล'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ประเภท: {req.request_type === 'full_deletion' ? 'ลบข้อมูลทั้งหมด' : req.request_type}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-muted-foreground">เหตุผล: {req.reason}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">
                      ส่งคำขอเมื่อ: {formatDate(req.created_at)}
                      {req.processed_at && ` | ดำเนินการเมื่อ: ${formatDate(req.processed_at)}`}
                    </p>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcess(req.id, 'reject')}
                      disabled={processing === req.id}
                      className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {processing === req.id ? (
                        <Spinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <><X weight="bold" className="w-4 h-4 mr-1" /> ปฏิเสธ</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleProcess(req.id, 'approve')}
                      disabled={processing === req.id}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing === req.id ? (
                        <Spinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Check weight="bold" className="w-4 h-4 mr-1" /> อนุมัติ</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
