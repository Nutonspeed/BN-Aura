'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Phone, Calendar, QrCode, CheckCircle } from 'lucide-react';

export default function KioskPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const [settings, setSettings] = useState<{ welcome_message?: { th?: string }; logo_url?: string; theme?: { primaryColor?: string } } | null>(null);
  const [clinic, setClinic] = useState<{ display_name?: { th?: string } } | null>(null);
  const [step, setStep] = useState<'welcome' | 'method' | 'phone' | 'success'>('welcome');
  const [phone, setPhone] = useState('');
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
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

  const handleCheckIn = async (method: string) => {
    try {
      const res = await fetch('/api/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          method,
          phone: method === 'phone' ? phone : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setQueueNumber(data.queueNumber);
        setStep('success');
        // Auto reset after 10 seconds
        setTimeout(() => {
          setStep('welcome');
          setPhone('');
          setQueueNumber(null);
        }, 10000);
      }
    } catch (e) { console.error(e); }
  };

  const primaryColor = settings?.theme?.primaryColor || '#6366f1';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-8">
      {/* Logo */}
      {settings?.logo_url && (
        <img src={settings.logo_url} alt="Logo" className="h-20 mb-6" />
      )}

      {step === 'welcome' && (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {clinic?.display_name?.th || 'ยินดีต้อนรับ'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {settings?.welcome_message?.th || 'กรุณาเช็คอินเพื่อเข้ารับบริการ'}
          </p>
          <button
            onClick={() => setStep('method')}
            style={{ backgroundColor: primaryColor }}
            className="px-12 py-6 text-2xl text-white rounded-2xl shadow-lg hover:opacity-90 transition"
          >
            เช็คอิน
          </button>
        </div>
      )}

      {step === 'method' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">เลือกวิธีเช็คอิน</h2>
          <div className="grid grid-cols-2 gap-6 max-w-xl">
            <button
              onClick={() => setStep('phone')}
              className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <Phone className="w-16 h-16 text-indigo-600" />
              <span className="text-xl font-medium">เบอร์โทรศัพท์</span>
            </button>
            <button
              onClick={() => handleCheckIn('walk_in')}
              className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <User className="w-16 h-16 text-green-600" />
              <span className="text-xl font-medium">Walk-in</span>
            </button>
            <button
              onClick={() => handleCheckIn('appointment')}
              className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <Calendar className="w-16 h-16 text-blue-600" />
              <span className="text-xl font-medium">มีนัดหมาย</span>
            </button>
            <button
              onClick={() => handleCheckIn('qr_code')}
              className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <QrCode className="w-16 h-16 text-purple-600" />
              <span className="text-xl font-medium">QR Code</span>
            </button>
          </div>
          <button onClick={() => setStep('welcome')} className="mt-8 text-gray-500 hover:underline">
            ← กลับ
          </button>
        </div>
      )}

      {step === 'phone' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">กรอกเบอร์โทรศัพท์</h2>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="0812345678"
            className="text-4xl text-center w-80 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            maxLength={10}
          />
          <div className="mt-8 flex gap-4 justify-center">
            <button onClick={() => setStep('method')} className="px-8 py-4 bg-gray-200 rounded-xl text-xl">
              กลับ
            </button>
            <button
              onClick={() => handleCheckIn('phone')}
              disabled={phone.length < 9}
              style={{ backgroundColor: phone.length >= 9 ? primaryColor : '#ccc' }}
              className="px-8 py-4 text-white rounded-xl text-xl"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">เช็คอินสำเร็จ!</h2>
          <div className="text-8xl font-bold my-8" style={{ color: primaryColor }}>
            {queueNumber}
          </div>
          <p className="text-2xl text-gray-600">คิวของคุณ</p>
          <p className="text-lg text-gray-500 mt-4">กรุณารอเรียกคิว</p>
        </div>
      )}
    </div>
  );
}
