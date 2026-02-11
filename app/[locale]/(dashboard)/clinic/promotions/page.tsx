'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Copy,
  Trash,
  ToggleLeft,
  ToggleRight,
  SpinnerGap,
  Check,
  X,
  Percent,
  CurrencyCircleDollar,
  CalendarDots
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  code: string;
  usage_limit: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'percentage',
    discountValue: 10,
    minPurchase: 0,
    maxDiscount: '',
    code: '',
    usageLimit: '',
    endsAt: '',
  });

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions?active=false');
      const data = await res.json();
      if (data.success) setPromotions(data.data);
    } catch (e) {
      console.error('Failed to fetch promotions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('กรุณาระบุชื่อโปรโมชัน');
    setCreating(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          type: form.type,
          discountValue: form.discountValue,
          minPurchase: form.minPurchase,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          code: form.code || undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          endsAt: form.endsAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('สร้างโปรโมชันสำเร็จ');
        setShowCreate(false);
        setForm({ name: '', description: '', type: 'percentage', discountValue: 10, minPurchase: 0, maxDiscount: '', code: '', usageLimit: '', endsAt: '' });
        fetchPromotions();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    finally { setCreating(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`คัดลอกโค้ด ${code} แล้ว`);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <Tag weight="duotone" className="w-4 h-4" />
            จัดการโปรโมชัน
          </div>
          <h1 className="text-2xl font-black tracking-tight">โปรโมชัน</h1>
          <p className="text-sm text-muted-foreground">สร้างและจัดการโค้ดส่วนลดสำหรับคลินิก</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus weight="bold" className="w-4 h-4" />
          สร้างโปรโมชัน
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <Card className="p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">ทั้งหมด</p>
              <p className="text-2xl font-black mt-1">{promotions.length}</p>
            </div>
            <Tag weight="duotone" className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">ใช้งานอยู่</p>
              <p className="text-2xl font-black mt-1 text-emerald-500">{promotions.filter(p => p.is_active).length}</p>
            </div>
            <ToggleRight weight="duotone" className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">ใช้แล้ว</p>
              <p className="text-2xl font-black mt-1 text-amber-500">{promotions.reduce((s, p) => s + p.used_count, 0)}</p>
            </div>
            <Check weight="duotone" className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      {/* Promo List */}
      <div className="space-y-3 px-2">
        {promotions.length === 0 ? (
          <Card className="p-12 rounded-2xl border-border/50 text-center">
            <Tag weight="duotone" className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">ยังไม่มีโปรโมชัน</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4 gap-2">
              <Plus weight="bold" className="w-4 h-4" />
              สร้างโปรโมชันแรก
            </Button>
          </Card>
        ) : (
          promotions.map((promo, i) => (
            <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5 rounded-2xl border-border/50 hover:border-primary/20 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {promo.type === 'percentage' ? <Percent weight="bold" className="w-6 h-6" /> : <CurrencyCircleDollar weight="bold" className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{promo.name}</p>
                        <Badge variant={promo.is_active ? 'default' : 'ghost'} size="sm">
                          {promo.is_active ? 'ใช้งาน' : 'ปิด'}
                        </Badge>
                      </div>
                      {promo.description && <p className="text-xs text-muted-foreground">{promo.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>ลด {promo.type === 'percentage' ? `${promo.discount_value}%` : `฿${promo.discount_value}`}</span>
                        {promo.min_purchase > 0 && <span>ขั้นต่ำ ฿{promo.min_purchase.toLocaleString()}</span>}
                        {promo.usage_limit && <span>ใช้แล้ว {promo.used_count}/{promo.usage_limit}</span>}
                        {promo.ends_at && (
                          <span className="flex items-center gap-1">
                            <CalendarDots className="w-3 h-3" />
                            หมดอายุ {formatDate(promo.ends_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyCode(promo.code)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-xl text-xs font-bold hover:bg-secondary/80 transition-colors"
                    >
                      <Copy weight="bold" className="w-3.5 h-3.5" />
                      {promo.code}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">สร้างโปรโมชันใหม่</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-secondary rounded-xl"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ชื่อโปรโมชัน *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" placeholder="เช่น ลด 20% ต้อนรับปีใหม่" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">รายละเอียด</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" placeholder="รายละเอียดเพิ่มเติม" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ประเภท</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm">
                      <option value="percentage">เปอร์เซ็นต์ (%)</option>
                      <option value="fixed">จำนวนเงิน (฿)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ส่วนลด</label>
                    <input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ยอดขั้นต่ำ (฿)</label>
                    <input type="number" value={form.minPurchase} onChange={e => setForm({...form, minPurchase: Number(e.target.value)})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">จำกัดการใช้</label>
                    <input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" placeholder="ไม่จำกัด" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">โค้ด (ไม่ใส่ = สร้างอัตโนมัติ)</label>
                    <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-mono" placeholder="AUTO" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">วันหมดอายุ</label>
                    <input type="date" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm" />
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full gap-2 py-6">
                  {creating ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <Plus weight="bold" className="w-4 h-4" />}
                  {creating ? 'กำลังสร้าง...' : 'สร้างโปรโมชัน'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
