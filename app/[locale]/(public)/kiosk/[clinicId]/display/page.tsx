'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Bell, CheckCircle, Users, SpinnerGap, Queue } from '@phosphor-icons/react';

interface QueueItem {
  id: string;
  queue_number: number;
  status: string;
  check_in_method: string;
  phone_lookup?: string;
  checked_in_at: string;
  called_at?: string;
  customer?: { full_name: string } | null;
}

export default function QueueDisplayPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [clinic, setClinic] = useState<{ display_name?: { th?: string } } | null>(null);
  const [settings, setSettings] = useState<{ logo_url?: string; theme?: { primaryColor?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCalledRef = useRef<Set<string>>(new Set());

  // Fetch settings once
  useEffect(() => {
    fetchSettings();
  }, [clinicId]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll queue every 3 seconds for near-real-time
  useEffect(() => {
    if (!clinicId) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [clinicId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}`);
      const data = await res.json();
      setSettings(data.settings);
      setClinic(data.clinic);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}&action=queue`);
      const data = await res.json();
      const items: QueueItem[] = (data.queue || []).map((d: any) => ({
        id: d.id,
        queue_number: d.queue_number || 0,
        status: d.status,
        check_in_method: d.check_in_method || 'walk_in',
        phone_lookup: d.phone_lookup,
        checked_in_at: d.checked_in_at,
        called_at: d.called_at,
        customer: d.customer,
      }));

      // Detect newly called numbers for notification
      const calledIds = new Set(items.filter(i => i.status === 'called').map(i => i.id));
      const newCalls = items.filter(i => i.status === 'called' && !prevCalledRef.current.has(i.id));
      if (newCalls.length > 0) {
        setLastCalledNumber(newCalls[0].queue_number);
        playNotificationSound();
        // Auto-clear highlight after 10 seconds
        setTimeout(() => setLastCalledNumber(null), 10000);
      }
      prevCalledRef.current = calledIds;

      setQueue(items);
    } catch (e) { /* silent */ }
  };

  const playNotificationSound = () => {
    try {
      // Use Web Audio API for a simple notification chime
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* Audio not available */ }
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const called = queue.filter(q => q.status === 'called');
  const primaryColor = settings?.theme?.primaryColor || '#6366f1';

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const getWaitMinutes = (checkedInAt: string) => {
    const diff = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <SpinnerGap className="w-16 h-16 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-4">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-10 object-contain brightness-110" />
          )}
          <div>
            <h1 className="text-xl font-bold text-white">
              {clinic?.display_name?.th || 'คลินิก'}
            </h1>
            <p className="text-xs text-white/40">ระบบแสดงคิว Real-time</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums tracking-tight" style={{ color: primaryColor }}>
            {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-white/40">
            {currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* Left: Currently Calling (BIG) */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Bell weight="duotone" className="w-6 h-6" style={{ color: primaryColor }} />
            <h2 className="text-lg font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
              กำลังเรียก
            </h2>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {called.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-20">
                <Bell className="w-24 h-24 mx-auto mb-4" />
                <p className="text-xl font-bold uppercase tracking-widest">รอเรียกคิว</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid gap-4" style={{ 
              gridTemplateColumns: called.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gridTemplateRows: called.length <= 2 ? '1fr' : 'repeat(2, 1fr)' 
            }}>
              {called.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  className={`rounded-3xl border-2 flex flex-col items-center justify-center p-6 transition-all duration-500 ${
                    item.queue_number === lastCalledNumber
                      ? 'animate-pulse scale-[1.02]'
                      : ''
                  }`}
                  style={{
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '15',
                    boxShadow: item.queue_number === lastCalledNumber
                      ? `0 0 60px ${primaryColor}40`
                      : 'none'
                  }}
                >
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                    คิวหมายเลข
                  </p>
                  <p className="text-[120px] font-black leading-none tabular-nums" style={{ color: primaryColor }}>
                    {item.queue_number}
                  </p>
                  <p className="text-lg text-white/70 mt-2 font-medium">
                    {item.customer?.full_name || item.phone_lookup || ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Waiting List */}
        <div className="w-[340px] flex flex-col bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock weight="duotone" className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">
                รอเรียก
              </h3>
            </div>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{waiting.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {waiting.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-40 opacity-20">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">ไม่มีคิวรอ</p>
                </div>
              </div>
            ) : (
              waiting.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-black text-amber-400 tabular-nums">
                      {item.queue_number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/90 truncate">
                      {item.customer?.full_name || item.phone_lookup || 'ลูกค้า'}
                    </p>
                    <p className="text-xs text-white/40">
                      รอ {getWaitMinutes(item.checked_in_at)} นาที
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
                      ถัดไป
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Average Wait Time */}
          {waiting.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 text-center">
              <p className="text-xs text-white/30">เวลารอเฉลี่ย</p>
              <p className="text-lg font-bold text-white/60 tabular-nums">
                ~{Math.round(waiting.reduce((sum, w) => sum + getWaitMinutes(w.checked_in_at), 0) / waiting.length)} นาที
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats Bar */}
      <div className="flex items-center justify-between px-8 py-3 bg-black/30 border-t border-white/5 text-xs text-white/30">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            รอ: <span className="font-bold text-amber-400">{waiting.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            เรียก: <span className="font-bold" style={{ color: primaryColor }}>{called.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            เสร็จ: <span className="font-bold text-emerald-400">{queue.filter(q => q.status === 'serving').length}</span>
          </span>
        </div>
        <span>BN-Aura Queue Display &bull; Auto-refresh 3s</span>
      </div>
    </div>
  );
}
