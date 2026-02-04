'use client';

import { useState, useEffect } from 'react';
import { Video, Calendar, Plus, ExternalLink, Clock, User } from 'lucide-react';

interface Consultation {
  id: string;
  room_id: string;
  room_url: string;
  status: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  customer?: { full_name: string; phone: string; email: string };
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ customerId: '', scheduledAt: '', notes: '' });
  const [customers, setCustomers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => { 
    fetchConsultations(); 
    fetchCustomers();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consultations');
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=100');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { console.error(e); }
  };

  const createConsultation = async () => {
    if (!formData.customerId || !formData.scheduledAt) return;
    await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: formData.customerId,
        scheduledAt: formData.scheduledAt,
        notes: formData.notes
      })
    });
    setShowModal(false);
    setFormData({ customerId: '', scheduledAt: '', notes: '' });
    fetchConsultations();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: id, status })
    });
    fetchConsultations();
  };

  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  });

  const getStatusStyle = (s: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      waiting: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return styles[s] || 'bg-gray-100';
  };

  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = {
      scheduled: 'นัดหมาย', waiting: 'รอเข้าร่วม', in_progress: 'กำลังสนทนา',
      completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก', no_show: 'ไม่มา'
    };
    return labels[s] || s;
  };

  const upcoming = consultations.filter(c => c.status === 'scheduled' || c.status === 'waiting');
  const past = consultations.filter(c => c.status === 'completed' || c.status === 'cancelled');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-7 h-7 text-indigo-600" /> Virtual Consultations
          </h1>
          <p className="text-gray-600">ปรึกษาออนไลน์ผ่านวิดีโอคอล</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" /> สร้างห้องปรึกษา
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">รอดำเนินการ</p>
          <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">เสร็จสิ้นแล้ว</p>
          <p className="text-2xl font-bold text-green-600">{past.filter(c => c.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">วันนี้</p>
          <p className="text-2xl font-bold">{consultations.filter(c => new Date(c.scheduled_at).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : consultations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีการปรึกษาออนไลน์</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(c => (
            <div key={c.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.customer?.full_name || 'ลูกค้า'}</p>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(c.status)}`}>
                        {getStatusLabel(c.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> {formatDateTime(c.scheduled_at)}
                    </p>
                    {c.notes && <p className="text-sm text-gray-600 mt-1">{c.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(c.status === 'scheduled' || c.status === 'waiting') && (
                    <>
                      <a
                        href={c.room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" /> เข้าห้อง
                      </a>
                      <button
                        onClick={() => updateStatus(c.id, 'in_progress')}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        เริ่ม
                      </button>
                    </>
                  )}
                  {c.status === 'in_progress' && (
                    <button
                      onClick={() => updateStatus(c.id, 'completed')}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      จบการสนทนา
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">สร้างห้องปรึกษาใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ลูกค้า</label>
                <select
                  value={formData.customerId}
                  onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">เลือกลูกค้า</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วันเวลา</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">
                ยกเลิก
              </button>
              <button 
                onClick={createConsultation} 
                disabled={!formData.customerId || !formData.scheduledAt}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
