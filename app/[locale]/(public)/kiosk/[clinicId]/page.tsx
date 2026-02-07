'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, Phone, CalendarDots, QrCode, CheckCircle, 
  Clock, ArrowLeft, SpinnerGap, MagnifyingGlass,
  IdentificationCard
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';

interface Appointment {
  id: string;
  time: string;
  service_name: string;
  customer_name?: string;
}

interface CustomerMatch {
  id: string;
  full_name: string;
  phone: string;
  appointments: Appointment[];
}

type Step = 'welcome' | 'method' | 'phone' | 'appointment_lookup' | 'appointment_select' | 'qr_display' | 'processing' | 'success';

export default function KioskPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [settings, setSettings] = useState<{
    welcome_message?: { th?: string; en?: string };
    logo_url?: string;
    theme?: { primaryColor?: string };
  } | null>(null);
  const [clinic, setClinic] = useState<{ display_name?: { th?: string } } | null>(null);
  const [step, setStep] = useState<Step>('welcome');
  const [phone, setPhone] = useState('');
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerMatch, setCustomerMatch] = useState<CustomerMatch | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchWaitingCount();
    const interval = setInterval(fetchWaitingCount, 30000);
    return () => clearInterval(interval);
  }, [clinicId]);

  // Auto-reset countdown on success
  useEffect(() => {
    if (step === 'success') {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            resetKiosk();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}`);
      const data = await res.json();
      setSettings(data.settings);
      setClinic(data.clinic);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchWaitingCount = async () => {
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}&action=queue`);
      const data = await res.json();
      setWaitingCount(data.queue?.length || 0);
    } catch (e) { /* silent */ }
  };

  const handleCheckIn = async (method: string, appointmentId?: string) => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          method,
          phone: method === 'phone' ? phone : undefined,
          appointmentId,
          customerId: customerMatch?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setQueueNumber(data.queueNumber);
        setStep('success');
        fetchWaitingCount();
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (e) {
      setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่');
    }
    setProcessing(false);
  };

  const lookupCustomer = async () => {
    if (phone.length < 9) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}&action=lookup&phone=${phone}`);
      const data = await res.json();
      if (data.customer) {
        setCustomerMatch(data.customer);
        if (data.customer.appointments?.length > 0) {
          setStep('appointment_select');
        } else {
          // No appointments, check in directly
          await handleCheckIn('phone');
        }
      } else {
        // No customer found, check in as new
        await handleCheckIn('phone');
      }
    } catch (e) {
      await handleCheckIn('phone');
    }
    setProcessing(false);
  };

  const resetKiosk = useCallback(() => {
    setStep('welcome');
    setPhone('');
    setQueueNumber(null);
    setCustomerMatch(null);
    setError('');
    setCountdown(15);
  }, []);

  const primaryColor = settings?.theme?.primaryColor || '#6366f1';
  const kioskUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/th/kiosk/${clinicId}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-6">
          <SpinnerGap className="w-16 h-16 animate-spin" style={{ color: primaryColor }} />
          <p className="text-lg text-slate-500 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="flex items-center gap-4">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-12 object-contain" />
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {clinic?.display_name?.th || 'คลินิก'}
            </h2>
            <p className="text-xs text-slate-500">ระบบเช็คอินอัตโนมัติ</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium tabular-nums">
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        
        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <div className="text-center max-w-2xl animate-fadeIn">
            <div className="mb-8">
              <div className="w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center" 
                   style={{ backgroundColor: primaryColor + '15' }}>
                <IdentificationCard className="w-14 h-14" style={{ color: primaryColor }} weight="duotone" />
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
                {settings?.welcome_message?.th || 'ยินดีต้อนรับ'}
              </h1>
              <p className="text-xl text-slate-500">
                กรุณาเช็คอินเพื่อเข้ารับบริการ
              </p>
              {waitingCount > 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  ขณะนี้มีผู้รอ {waitingCount} คิว
                </p>
              )}
            </div>
            <button
              onClick={() => setStep('method')}
              style={{ backgroundColor: primaryColor }}
              className="px-16 py-6 text-2xl text-white rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all font-bold"
            >
              เช็คอิน
            </button>
          </div>
        )}

        {/* ── Method Selection ── */}
        {step === 'method' && (
          <div className="text-center max-w-3xl animate-fadeIn">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">เลือกวิธีเช็คอิน</h2>
            <p className="text-lg text-slate-500 mb-10">กรุณาเลือกวิธีที่สะดวกที่สุด</p>
            
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Phone */}
              <button
                onClick={() => setStep('phone')}
                className="flex flex-col items-center gap-5 p-10 bg-white rounded-3xl shadow-md hover:shadow-xl active:scale-[0.97] transition-all border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Phone className="w-10 h-10 text-blue-600" weight="duotone" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-800 block">เบอร์โทรศัพท์</span>
                  <span className="text-sm text-slate-400">ค้นหาด้วยเบอร์มือถือ</span>
                </div>
              </button>

              {/* Walk-in */}
              <button
                onClick={() => handleCheckIn('walk_in')}
                disabled={processing}
                className="flex flex-col items-center gap-5 p-10 bg-white rounded-3xl shadow-md hover:shadow-xl active:scale-[0.97] transition-all border-2 border-transparent hover:border-emerald-200"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <User className="w-10 h-10 text-emerald-600" weight="duotone" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-800 block">Walk-in</span>
                  <span className="text-sm text-slate-400">ไม่มีนัดล่วงหน้า</span>
                </div>
              </button>

              {/* Appointment */}
              <button
                onClick={() => setStep('appointment_lookup')}
                className="flex flex-col items-center gap-5 p-10 bg-white rounded-3xl shadow-md hover:shadow-xl active:scale-[0.97] transition-all border-2 border-transparent hover:border-amber-200"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <CalendarDots className="w-10 h-10 text-amber-600" weight="duotone" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-800 block">มีนัดหมาย</span>
                  <span className="text-sm text-slate-400">ค้นหานัดหมายวันนี้</span>
                </div>
              </button>

              {/* QR Code */}
              <button
                onClick={() => setStep('qr_display')}
                className="flex flex-col items-center gap-5 p-10 bg-white rounded-3xl shadow-md hover:shadow-xl active:scale-[0.97] transition-all border-2 border-transparent hover:border-purple-200"
              >
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-purple-600" weight="duotone" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-800 block">QR Code</span>
                  <span className="text-sm text-slate-400">สแกนเช็คอินด้วยมือถือ</span>
                </div>
              </button>
            </div>

            <button onClick={resetKiosk} className="mt-10 text-slate-400 hover:text-slate-600 text-lg flex items-center gap-2 mx-auto transition">
              <ArrowLeft className="w-5 h-5" />
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* ── Phone Input ── */}
        {step === 'phone' && (
          <div className="text-center max-w-lg animate-fadeIn">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-blue-600" weight="duotone" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">กรอกเบอร์โทรศัพท์</h2>
            <p className="text-slate-500 mb-8">ระบบจะค้นหาข้อมูลและนัดหมายของคุณ</p>
            
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="0812345678"
              autoFocus
              className="text-5xl text-center w-full px-6 py-5 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 tabular-nums tracking-wider transition"
              maxLength={10}
            />

            {error && (
              <p className="mt-4 text-red-500 font-medium">{error}</p>
            )}

            <div className="mt-8 flex gap-4 justify-center">
              <button onClick={() => { setStep('method'); setPhone(''); setError(''); }} 
                className="px-10 py-5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xl font-medium text-slate-700 transition">
                กลับ
              </button>
              <button
                onClick={lookupCustomer}
                disabled={phone.length < 9 || processing}
                style={{ backgroundColor: phone.length >= 9 ? primaryColor : '#cbd5e1' }}
                className="px-10 py-5 text-white rounded-2xl text-xl font-bold flex items-center gap-3 transition"
              >
                {processing ? (
                  <SpinnerGap className="w-6 h-6 animate-spin" />
                ) : (
                  <MagnifyingGlass className="w-6 h-6" weight="bold" />
                )}
                {processing ? 'กำลังค้นหา...' : 'ค้นหา'}
              </button>
            </div>
          </div>
        )}

        {/* ── Appointment Lookup (by phone) ── */}
        {step === 'appointment_lookup' && (
          <div className="text-center max-w-lg animate-fadeIn">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CalendarDots className="w-10 h-10 text-amber-600" weight="duotone" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">ค้นหานัดหมาย</h2>
            <p className="text-slate-500 mb-8">กรอกเบอร์โทรเพื่อค้นหานัดหมายวันนี้</p>
            
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="0812345678"
              autoFocus
              className="text-5xl text-center w-full px-6 py-5 border-2 border-slate-200 rounded-2xl focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-100 tabular-nums tracking-wider transition"
              maxLength={10}
            />

            <div className="mt-8 flex gap-4 justify-center">
              <button onClick={() => { setStep('method'); setPhone(''); setError(''); }}
                className="px-10 py-5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xl font-medium text-slate-700 transition">
                กลับ
              </button>
              <button
                onClick={lookupCustomer}
                disabled={phone.length < 9 || processing}
                style={{ backgroundColor: phone.length >= 9 ? primaryColor : '#cbd5e1' }}
                className="px-10 py-5 text-white rounded-2xl text-xl font-bold flex items-center gap-3 transition"
              >
                {processing ? <SpinnerGap className="w-6 h-6 animate-spin" /> : <MagnifyingGlass className="w-6 h-6" weight="bold" />}
                {processing ? 'กำลังค้นหา...' : 'ค้นหานัดหมาย'}
              </button>
            </div>
          </div>
        )}

        {/* ── Appointment Select ── */}
        {step === 'appointment_select' && customerMatch && (
          <div className="text-center max-w-2xl animate-fadeIn">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CalendarDots className="w-10 h-10 text-amber-600" weight="duotone" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              สวัสดีคุณ{customerMatch.full_name}
            </h2>
            <p className="text-slate-500 mb-8">เลือกนัดหมายของคุณวันนี้</p>

            <div className="space-y-4 max-w-xl mx-auto">
              {customerMatch.appointments.map(apt => (
                <button
                  key={apt.id}
                  onClick={() => handleCheckIn('appointment', apt.id)}
                  disabled={processing}
                  className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-amber-300 transition-all text-left flex items-center gap-5 active:scale-[0.97]"
                >
                  <div className="w-16 h-16 bg-amber-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-lg font-black text-amber-700">{apt.time?.split(':')[0] || '--'}</span>
                    <span className="text-[10px] font-bold text-amber-500">:{apt.time?.split(':')[1] || '00'}</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">{apt.service_name || 'บริการ'}</p>
                    <p className="text-sm text-slate-400">เวลานัด {apt.time || '-'}</p>
                  </div>
                </button>
              ))}

              {/* Check in without specific appointment */}
              <button
                onClick={() => handleCheckIn('phone')}
                disabled={processing}
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 text-slate-500 font-medium text-lg transition"
              >
                เช็คอินโดยไม่เลือกนัดหมาย
              </button>
            </div>

            <button onClick={() => { setStep('method'); setCustomerMatch(null); setPhone(''); }}
              className="mt-8 text-slate-400 hover:text-slate-600 text-lg flex items-center gap-2 mx-auto transition">
              <ArrowLeft className="w-5 h-5" />
              กลับ
            </button>
          </div>
        )}

        {/* ── QR Code Display ── */}
        {step === 'qr_display' && (
          <div className="text-center max-w-lg animate-fadeIn">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-purple-600" weight="duotone" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">สแกน QR Code</h2>
            <p className="text-slate-500 mb-8">ใช้กล้องมือถือสแกนเพื่อเช็คอิน</p>
            
            <div className="bg-white p-8 rounded-3xl shadow-lg inline-block mx-auto border border-slate-100">
              <QRCodeSVG 
                value={kioskUrl + '?auto_checkin=true'}
                size={280}
                level="H"
                includeMargin={false}
                fgColor="#1e293b"
              />
            </div>

            <p className="text-sm text-slate-400 mt-6">หรือเปิดลิงก์:<br/>
              <span className="font-mono text-xs text-slate-300">{kioskUrl}</span>
            </p>

            <button onClick={() => setStep('method')}
              className="mt-8 text-slate-400 hover:text-slate-600 text-lg flex items-center gap-2 mx-auto transition">
              <ArrowLeft className="w-5 h-5" />
              กลับ
            </button>
          </div>
        )}

        {/* ── Processing ── */}
        {step === 'processing' && (
          <div className="text-center animate-fadeIn">
            <SpinnerGap className="w-20 h-20 animate-spin mx-auto mb-6" style={{ color: primaryColor }} />
            <h2 className="text-3xl font-bold text-slate-900">กำลังดำเนินการ...</h2>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="text-center animate-fadeIn">
            <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500" weight="duotone" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">เช็คอินสำเร็จ!</h2>
            {customerMatch && (
              <p className="text-xl text-slate-500 mb-4">คุณ{customerMatch.full_name}</p>
            )}
            
            <div className="my-8">
              <p className="text-lg text-slate-400 mb-2 uppercase tracking-widest font-bold">คิวของคุณ</p>
              <div className="text-9xl font-black tabular-nums leading-none" style={{ color: primaryColor }}>
                {queueNumber}
              </div>
            </div>

            {waitingCount > 1 && (
              <p className="text-lg text-slate-500 mb-2">
                มีผู้รอก่อนคุณ <span className="font-bold">{waitingCount - 1}</span> คิว
              </p>
            )}
            <p className="text-slate-400">กรุณารอเรียกคิว</p>

            <div className="mt-8">
              <div className="w-40 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ 
                    width: `${(countdown / 15) * 100}%`,
                    backgroundColor: primaryColor 
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                กลับหน้าหลักใน {countdown} วินาที
              </p>
            </div>

            <button onClick={resetKiosk}
              className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline transition">
              กลับหน้าหลักทันที
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-8 py-3 text-center text-xs text-slate-300 border-t border-slate-50">
        Powered by BN-Aura &bull; Kiosk System v2.0
      </div>

      {/* Inline animation style */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
