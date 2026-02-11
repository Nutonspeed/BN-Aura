'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Trash, 
  Check, 
  X, 
  Spinner,
  Warning,
  Lock,
  Eye,
  Megaphone,
  ArrowLeft
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface ConsentRecord {
  id: string;
  consent_type: string;
  consent_given: boolean;
  consent_version: string;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
}

const CONSENT_TYPES = [
  { 
    id: 'terms', 
    label: 'ข้อกำหนดการใช้บริการ', 
    labelEn: 'Terms of Service',
    desc: 'ยินยอมให้ใช้บริการตามข้อกำหนดและเงื่อนไข',
    icon: Lock,
    required: true 
  },
  { 
    id: 'privacy', 
    label: 'นโยบายความเป็นส่วนตัว', 
    labelEn: 'Privacy Policy',
    desc: 'ยินยอมให้เก็บรวบรวมและประมวลผลข้อมูลส่วนบุคคล',
    icon: Eye,
    required: true 
  },
  { 
    id: 'marketing', 
    label: 'การสื่อสารทางการตลาด', 
    labelEn: 'Marketing Communications',
    desc: 'ยินยอมรับข้อมูลโปรโมชั่นและข่าวสารผ่านช่องทางดิจิทัล',
    icon: Megaphone,
    required: false 
  },
];

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const fetchConsents = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/consent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecords(data.data);
        const map: Record<string, boolean> = {};
        data.data.forEach((r: ConsentRecord) => {
          map[r.consent_type] = r.consent_given;
        });
        setConsents(map);
      }
    } catch (e) {
      console.error('Failed to fetch consents:', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchConsents(); }, [fetchConsents]);

  const handleToggleConsent = async (type: string, required: boolean) => {
    if (required && consents[type]) {
      toast.error('ไม่สามารถยกเลิกความยินยอมที่จำเป็นได้');
      return;
    }

    const newValue = !consents[type];
    setConsents(prev => ({ ...prev, [type]: newValue }));

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (newValue) {
        await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'record', consents: { [type]: true } })
        });
        toast.success('บันทึกความยินยอมแล้ว');
      } else {
        await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'revoke', consentType: type })
        });
        toast.success('ยกเลิกความยินยอมแล้ว');
      }
      fetchConsents();
    } catch (e) {
      console.error('Failed to update consent:', e);
      toast.error('เกิดข้อผิดพลาด');
      setConsents(prev => ({ ...prev, [type]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'export_data' })
      });
      const data = await res.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bn-aura-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('ดาวน์โหลดข้อมูลสำเร็จ');
      }
    } catch (e) {
      console.error('Failed to export data:', e);
      toast.error('ไม่สามารถส่งออกข้อมูลได้');
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'request_deletion', requestType: 'full_deletion', reason: 'User requested via privacy settings' })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('ส่งคำขอลบข้อมูลแล้ว จะดำเนินการภายใน 30 วัน');
        setShowDeleteConfirm(false);
      }
    } catch (e) {
      console.error('Failed to request deletion:', e);
      toast.error('ไม่สามารถส่งคำขอได้');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/clinic/settings')} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ShieldCheck weight="duotone" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">ความเป็นส่วนตัวและข้อมูล</h1>
            <p className="text-sm text-muted-foreground">จัดการความยินยอม PDPA และข้อมูลส่วนบุคคล</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Consent Management */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold">การจัดการความยินยอม</h2>
              <p className="text-sm text-muted-foreground mt-1">คุณสามารถเปลี่ยนแปลงความยินยอมได้ตลอดเวลา</p>
            </div>
            <div className="divide-y divide-border">
              {CONSENT_TYPES.map((item) => {
                const Icon = item.icon;
                const record = records.find(r => r.consent_type === item.id);
                const isActive = consents[item.id] || false;

                return (
                  <div key={item.id} className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0",
                        isActive ? "bg-primary/10 border-primary/20" : "bg-muted border-border"
                      )}>
                        <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{item.label}</h3>
                          {item.required && (
                            <Badge variant="secondary" size="sm" className="text-[9px]">จำเป็น</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                        {record && (
                          <p className="text-[10px] text-muted-foreground/60">
                            อัปเดตล่าสุด: {formatDate(record.updated_at)}
                            {record.revoked_at && ` | ยกเลิกเมื่อ: ${formatDate(record.revoked_at)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleConsent(item.id, item.required)}
                      disabled={saving}
                      className={cn(
                        "relative w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0",
                        isActive ? "bg-primary" : "bg-muted-foreground/20"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center",
                        isActive ? "left-[22px]" : "left-0.5"
                      )}>
                        {isActive ? (
                          <Check weight="bold" className="w-3 h-3 text-primary" />
                        ) : (
                          <X weight="bold" className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Portability */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold">สิทธิ์ในข้อมูลของคุณ</h2>
              <p className="text-sm text-muted-foreground mt-1">ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Download className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">ส่งออกข้อมูล (Data Portability)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ดาวน์โหลดข้อมูลส่วนบุคคลทั้งหมดในรูปแบบ JSON</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData} 
                  disabled={exporting}
                  className="rounded-xl"
                >
                  {exporting ? (
                    <Spinner className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting ? 'กำลังส่งออก...' : 'ดาวน์โหลด'}
                </Button>
              </div>

              {/* Delete Data */}
              <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Trash className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400">ขอลบข้อมูล (Right to Erasure)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ส่งคำขอลบข้อมูลส่วนบุคคลทั้งหมด ดำเนินการภายใน 30 วัน</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-xl"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  ขอลบข้อมูล
                </Button>
              </div>
            </div>
          </div>

          {/* Consent History */}
          {records.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold">ประวัติความยินยอม</h2>
                <p className="text-sm text-muted-foreground mt-1">บันทึกการเปลี่ยนแปลงความยินยอมทั้งหมด</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-medium text-muted-foreground">ประเภท</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">สถานะ</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">เวอร์ชัน</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">อัปเดตล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="p-4 font-medium">
                          {CONSENT_TYPES.find(c => c.id === r.consent_type)?.label || r.consent_type}
                        </td>
                        <td className="p-4">
                          {r.consent_given ? (
                            <Badge variant="default" size="sm" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <Check weight="bold" className="w-3 h-3 mr-1" /> ยินยอม
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm" className="bg-red-500/10 text-red-600 border-red-500/20">
                              <X weight="bold" className="w-3 h-3 mr-1" /> ยกเลิก
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">v{r.consent_version}</td>
                        <td className="p-4 text-muted-foreground text-xs">{formatDate(r.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Warning weight="duotone" className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">ยืนยันการลบข้อมูล</h3>
                <p className="text-xs text-muted-foreground">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-sm text-muted-foreground space-y-2">
              <p>เมื่อส่งคำขอลบข้อมูลแล้ว:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>ข้อมูลส่วนบุคคลทั้งหมดจะถูกลบภายใน 30 วัน</li>
                <li>บัญชีผู้ใช้จะถูกปิดใช้งาน</li>
                <li>ข้อมูลที่จำเป็นตามกฎหมายอาจถูกเก็บไว้ตามระยะเวลาที่กำหนด</li>
                <li>การดำเนินการนี้ไม่สามารถย้อนกลับได้</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)} 
                className="flex-1 rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRequestDeletion} 
                disabled={deleting}
                className="flex-1 rounded-xl"
              >
                {deleting ? (
                  <Spinner className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash className="w-4 h-4 mr-2" />
                )}
                {deleting ? 'กำลังส่งคำขอ...' : 'ยืนยันลบข้อมูล'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
