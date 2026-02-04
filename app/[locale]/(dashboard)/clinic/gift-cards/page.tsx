'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Search, Copy, Mail, Download, Eye, MoreHorizontal } from 'lucide-react';

interface GiftCard {
  id: string;
  code: string;
  type: 'value' | 'service' | 'percentage';
  initial_value: number;
  current_balance: number;
  valid_until: string;
  is_active: boolean;
  recipient_name?: string;
  recipient_email?: string;
  purchased_by?: { full_name: string };
  created_at: string;
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'depleted'>('all');

  useEffect(() => {
    fetchGiftCards();
  }, [filter]);

  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      
      const res = await fetch(`/api/gift-cards?${params}`);
      const data = await res.json();
      setGiftCards(data.giftCards || []);
    } catch (error) {
      console.error('Failed to fetch gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCards = giftCards.filter(card =>
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-indigo-600" />
            Gift Cards
          </h1>
          <p className="text-gray-600">จัดการ Gift Cards และบัตรกำนัล</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          สร้าง Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">Gift Cards ทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900">{giftCards.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">ใช้งานได้</p>
          <p className="text-2xl font-bold text-green-600">
            {giftCards.filter(c => c.is_active && c.current_balance > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">มูลค่าคงเหลือรวม</p>
          <p className="text-2xl font-bold text-indigo-600">
            {formatPrice(giftCards.reduce((sum, c) => sum + c.current_balance, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">ใช้ไปแล้ว</p>
          <p className="text-2xl font-bold text-gray-600">
            {formatPrice(giftCards.reduce((sum, c) => sum + (c.initial_value - c.current_balance), 0))}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสหรือชื่อผู้รับ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expired', 'depleted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' : f === 'active' ? 'ใช้งานได้' : f === 'expired' ? 'หมดอายุ' : 'ใช้หมดแล้ว'}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Cards Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ไม่พบ Gift Cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={`bg-white rounded-xl border p-4 ${
                !card.is_active || card.current_balance === 0 ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{card.code}</span>
                    <button
                      onClick={() => copyCode(card.code)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                    card.type === 'value' ? 'bg-green-100 text-green-700' :
                    card.type === 'service' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {card.type === 'value' ? 'มูลค่า' : card.type === 'service' ? 'บริการ' : 'ส่วนลด %'}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600">มูลค่าคงเหลือ</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatPrice(card.current_balance)}
                  <span className="text-sm text-gray-400 font-normal ml-1">
                    / {formatPrice(card.initial_value)}
                  </span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(card.current_balance / card.initial_value) * 100}%` }}
                  />
                </div>
              </div>

              {card.recipient_name && (
                <p className="text-sm text-gray-600 mb-2">
                  ผู้รับ: {card.recipient_name}
                </p>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>หมดอายุ: {formatDate(card.valid_until)}</span>
                <div className="flex gap-2">
                  <button className="hover:text-indigo-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="hover:text-indigo-600">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="hover:text-indigo-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal - Simplified */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">สร้าง Gift Card ใหม่</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const res = await fetch('/api/gift-cards', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: formData.get('type'),
                    value: Number(formData.get('value')),
                    recipientName: formData.get('recipientName'),
                    recipientEmail: formData.get('recipientEmail'),
                    validDays: Number(formData.get('validDays')) || 365
                  })
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  fetchGiftCards();
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ประเภท</label>
                  <select name="type" className="w-full border rounded-lg px-3 py-2">
                    <option value="value">มูลค่าเงิน</option>
                    <option value="percentage">ส่วนลด %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">มูลค่า (บาท)</label>
                  <input
                    type="number"
                    name="value"
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อผู้รับ</label>
                  <input
                    type="text"
                    name="recipientName"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">อีเมลผู้รับ</label>
                  <input
                    type="email"
                    name="recipientEmail"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">อายุการใช้งาน (วัน)</label>
                  <input
                    type="number"
                    name="validDays"
                    defaultValue={365}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  สร้าง Gift Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
