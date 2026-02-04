'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Send, Clock, Eye, Users, TrendingUp } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusStyle = (s: string) => {
    if (s === 'sent') return 'bg-green-100 text-green-700';
    if (s === 'scheduled') return 'bg-blue-100 text-blue-700';
    if (s === 'sending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'draft') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (s: string) => {
    if (s === 'sent') return 'ส่งแล้ว';
    if (s === 'scheduled') return 'กำหนดเวลา';
    if (s === 'sending') return 'กำลังส่ง';
    if (s === 'draft') return 'ร่าง';
    return s;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-7 h-7 text-indigo-600" /> Email Campaigns
          </h1>
          <p className="text-gray-600">สร้างและจัดการแคมเปญอีเมล</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
          <Plus className="w-5 h-5" /> สร้างแคมเปญ
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">แคมเปญทั้งหมด</p>
              <p className="text-xl font-bold">{campaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ส่งแล้ว</p>
              <p className="text-xl font-bold text-green-600">{campaigns.filter(c => c.status === 'sent').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">กำหนดเวลา</p>
              <p className="text-xl font-bold text-blue-600">{campaigns.filter(c => c.status === 'scheduled').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ร่าง</p>
              <p className="text-xl font-bold">{campaigns.filter(c => c.status === 'draft').length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีแคมเปญ</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-indigo-600 hover:underline">
            สร้างแคมเปญแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl border p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{campaign.subject}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDate(campaign.created_at)}</span>
                <div className="flex gap-2">
                  <button className="text-indigo-600 hover:underline">แก้ไข</button>
                  {campaign.status === 'draft' && (
                    <button className="text-green-600 hover:underline">ส่ง</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">สร้างแคมเปญใหม่</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await fetch('/api/email-campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: fd.get('name'),
                  subject: fd.get('subject'),
                  contentHtml: `<p>${fd.get('content')}</p>`
                })
              });
              setShowCreate(false);
              fetchData();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อแคมเปญ</label>
                  <input name="name" required className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">หัวเรื่อง</label>
                  <input name="subject" required className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">เนื้อหา</label>
                  <textarea name="content" rows={4} required className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border rounded-lg">ยกเลิก</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">สร้าง</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
