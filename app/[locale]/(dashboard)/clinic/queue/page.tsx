'use client';

import { useState, useEffect } from 'react';
import { Users, Bell, CheckCircle, Clock, Phone, RefreshCw } from 'lucide-react';

interface CheckIn {
  id: string;
  queue_number: number;
  status: string;
  check_in_method: string;
  phone_lookup?: string;
  checked_in_at: string;
  customer?: { full_name: string };
  appointment?: { time: string; service_name: string };
}

export default function QueuePage() {
  const [queue, setQueue] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string>('');

  useEffect(() => {
    // Get clinic ID from staff session
    fetchClinicId();
  }, []);

  useEffect(() => {
    if (clinicId) {
      fetchQueue();
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [clinicId]);

  const fetchClinicId = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.clinicId) setClinicId(data.clinicId);
    } catch (e) { console.error(e); }
  };

  const fetchQueue = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kiosk?clinic_id=${clinicId}&action=queue`);
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (checkinId: string, status: string) => {
    await fetch('/api/kiosk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkinId, status })
    });
    fetchQueue();
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const getMethodLabel = (m: string) => {
    const labels: Record<string, string> = {
      phone: 'เบอร์โทร', walk_in: 'Walk-in', appointment: 'นัดหมาย', qr_code: 'QR', membership: 'สมาชิก'
    };
    return labels[m] || m;
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const called = queue.filter(q => q.status === 'called');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" /> Queue Management
          </h1>
          <p className="text-gray-600">จัดการคิวลูกค้า</p>
        </div>
        <button onClick={fetchQueue} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-5 h-5" /> รีเฟรช
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">รอเรียก</p>
          <p className="text-3xl font-bold text-yellow-600">{waiting.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">กำลังเรียก</p>
          <p className="text-3xl font-bold text-blue-600">{called.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">คิวถัดไป</p>
          <p className="text-3xl font-bold text-indigo-600">{waiting[0]?.queue_number || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Waiting */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> รอเรียก ({waiting.length})
          </h2>
          {loading && !queue.length ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : waiting.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">ไม่มีคิว</div>
          ) : (
            <div className="space-y-3">
              {waiting.map(item => (
                <div key={item.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-yellow-600">{item.queue_number}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.customer?.full_name || item.phone_lookup || 'ลูกค้า'}</p>
                      <p className="text-sm text-gray-500">{getMethodLabel(item.check_in_method)} • {formatTime(item.checked_in_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateStatus(item.id, 'called')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Bell className="w-4 h-4" /> เรียก
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Called */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" /> กำลังเรียก ({called.length})
          </h2>
          {called.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">ไม่มีคิว</div>
          ) : (
            <div className="space-y-3">
              {called.map(item => (
                <div key={item.id} className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center animate-pulse">
                      <span className="text-2xl font-bold text-white">{item.queue_number}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.customer?.full_name || item.phone_lookup || 'ลูกค้า'}</p>
                      <p className="text-sm text-gray-500">{getMethodLabel(item.check_in_method)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(item.id, 'serving')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" /> รับ
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'no_show')}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      ไม่มา
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
