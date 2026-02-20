'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, Users, Syringe, CheckCircle, ArrowRight, ArrowLeft, SpinnerGap, Sparkle, Phone, Envelope, MapPin, Clock } from '@phosphor-icons/react';

const STEPS = ['ยินดีต้อนรับ', 'ข้อมูลคลินิก', 'เพิ่มทีมงาน', 'ทรีทเมนต์', 'เสร็จสิ้น'];

const TREATMENTS = [
  { name: 'ไฮดราเฟเชียล', category: 'facial', price: 3500, duration: 60 },
  { name: 'ฉีดโบท็อกซ์', category: 'injection', price: 8000, duration: 30 },
  { name: 'เลเซอร์ผิว', category: 'laser', price: 5000, duration: 45 },
  { name: 'แอลอีดี เทอราปี', category: 'therapy', price: 2500, duration: 30 },
  { name: 'ฟิลเลอร์', category: 'injection', price: 12000, duration: 45 },
  { name: 'เมโสเธอราปี', category: 'injection', price: 6000, duration: 30 },
];

export default function OnboardingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'th';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', address: '', openTime: '09:00', closeTime: '20:00' });
  const [staff, setStaff] = useState([{ name: '', email: '', role: 'sales_staff' }]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch('/api/clinic/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          staff: staff.filter(s => s.name && s.email),
          treatments: Array.from(selected).map(i => TREATMENTS[i]),
        }),
      });
    } catch (err) { console.error(err); }
    setLoading(false);
    setStep(4);
  };

  const next = () => step === 3 ? handleSave() : setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const toggle = (i: number) => {
    const nextSelected = new Set(selected);
    if (nextSelected.has(i)) nextSelected.delete(i);
    else nextSelected.add(i);
    setSelected(nextSelected);
  };
  const addStaff = () => {
    if (staff.length >= 10) return;
    setStaff([...staff, { name: '', email: '', role: 'sales_staff' }]);
  };
  const updateStaff = (i: number, f: string, v: string) => { const u = [...staff]; (u[i] as any)[f] = v; setStaff(u); };

  const inputCls = "w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {i < step ? <CheckCircle weight="fill" className="w-5 h-5" /> : i + 1}
              </div>
              {i < 4 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

              {step === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkle weight="fill" className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-3">ยินดีต้อนรับสู่ BN-Aura</h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">ตั้งค่าคลินิกของคุณใน 3 ขั้นตอนง่ายๆ</p>
                  <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm mx-auto">
                    {[['ข้อมูลคลินิก', Buildings], ['เพิ่มทีมงาน', Users], ['ทรีทเมนต์', Syringe]].map(([label, Icon]: any, i) => (
                      <div key={i} className="text-center"><Icon className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-xs text-muted-foreground">{label}</p></div>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">ข้อมูลคลินิก</h2>
                  <p className="text-sm text-muted-foreground mb-6">กรอกข้อมูลพื้นฐานของคลินิก</p>
                  <div className="space-y-4">
                    <div><label className="text-sm font-medium">ชื่อคลินิก *</label><div className="relative mt-1"><Buildings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="เช่น Bangkok Premium Clinic" className={inputCls} /></div></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium">เบอร์โทร</label><div className="relative mt-1"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="02-xxx-xxxx" className={inputCls} /></div></div>
                      <div><label className="text-sm font-medium">อีเมล</label><div className="relative mt-1"><Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="clinic@example.com" className={inputCls} /></div></div>
                    </div>
                    <div><label className="text-sm font-medium">ที่อยู่</label><div className="relative mt-1"><MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="ที่อยู่คลินิก" rows={2} className={inputCls + " resize-none"} /></div></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium">เวลาเปิด</label><div className="relative mt-1"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="time" value={profile.openTime} onChange={e => setProfile({...profile, openTime: e.target.value})} className={inputCls} /></div></div>
                      <div><label className="text-sm font-medium">เวลาปิด</label><div className="relative mt-1"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="time" value={profile.closeTime} onChange={e => setProfile({...profile, closeTime: e.target.value})} className={inputCls} /></div></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">เพิ่มทีมงาน</h2>
                  <p className="text-sm text-muted-foreground mb-6">เชิญทีมงานเข้าใช้ระบบ (ข้ามได้)</p>
                  <div className="space-y-3">
                    {staff.map((m, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input value={m.name} onChange={e => updateStaff(i, 'name', e.target.value)} placeholder="ชื่อ-นามสกุล" className="bg-background border border-border rounded-lg py-2 px-3 text-sm" />
                        <input value={m.email} onChange={e => updateStaff(i, 'email', e.target.value)} placeholder="email@clinic.com" className="bg-background border border-border rounded-lg py-2 px-3 text-sm" />
                        <select value={m.role} onChange={e => updateStaff(i, 'role', e.target.value)} className="bg-background border border-border rounded-lg py-2 px-2 text-sm">
                          <option value="sales_staff">Sales</option>
                          <option value="beautician">Beautician</option>
                          <option value="clinic_admin">Admin</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <button onClick={addStaff} className="mt-3 text-sm text-primary hover:underline">+ เพิ่มทีมงาน</button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">เลือกทรีทเมนต์</h2>
                  <p className="text-sm text-muted-foreground mb-6">เลือกทรีทเมนต์ที่คลินิกให้บริการ</p>
                  <div className="grid grid-cols-2 gap-3">
                    {TREATMENTS.map((t, i) => (
                      <button key={i} onClick={() => toggle(i)} className={`p-4 rounded-xl border text-left transition-all ${selected.has(i) ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{t.name}</span>
                          {selected.has(i) && <CheckCircle weight="fill" className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] uppercase">{t.category}</span>
                          <span>฿{t.price.toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle weight="fill" className="w-10 h-10 text-green-500" />
                  </div>
                  <h1 className="text-3xl font-bold mb-3">ตั้งค่าเสร็จสมบูรณ์!</h1>
                  <p className="text-muted-foreground mb-8">คลินิกของคุณพร้อมใช้งานแล้ว</p>
                  <button onClick={() => window.location.href = `/${locale}/clinic`} className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2">
                    เข้าสู่ Dashboard <ArrowRight weight="bold" className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <button onClick={back} disabled={step === 0} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
              </button>
              <button onClick={next} disabled={step === 1 && !profile.name.trim()} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {loading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : step === 3 ? 'บันทึกและเสร็จสิ้น' : 'ถัดไป'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
