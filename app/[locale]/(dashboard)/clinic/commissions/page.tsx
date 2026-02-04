'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Calendar, CheckCircle, Clock, Filter } from 'lucide-react';

interface CommissionRecord {
  id: string;
  staff_id: string;
  transaction_type: string;
  transaction_amount: number;
  commission_amount: number;
  status: string;
  transaction_date: string;
}

interface Payout {
  id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  net_amount: number;
  status: string;
}

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'payouts' | 'rules'>('overview');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commissions/payouts');
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);
  
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusStyle = (s: string) => {
    if (s === 'paid') return 'bg-green-100 text-green-700';
    if (s === 'approved') return 'bg-blue-100 text-blue-700';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.net_amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" /> Commission Management
          </h1>
          <p className="text-gray-600">จัดการค่าคอมมิชชั่นพนักงาน</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="monthly">รายเดือน</option>
            <option value="weekly">รายสัปดาห์</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">สร้าง Payout</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">รอจ่าย</p>
              <p className="text-xl font-bold">{formatPrice(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">จ่ายแล้ว</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">พนักงาน</p>
              <p className="text-xl font-bold">{new Set(payouts.map(p => p.staff_id)).size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Payouts</p>
              <p className="text-xl font-bold">{payouts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        {(['overview', 'records', 'payouts', 'rules'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 font-medium ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            {tab === 'overview' ? 'ภาพรวม' : tab === 'records' ? 'รายการ' : tab === 'payouts' ? 'การจ่าย' : 'กฎ'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : activeTab === 'payouts' ? (
        payouts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีรายการจ่าย</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ช่วงเวลา</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ยอดรวม</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ยอดสุทธิ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">สถานะ</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{payout.staff_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                    </td>
                    <td className="px-4 py-3">{formatPrice(payout.total_amount)}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatPrice(payout.net_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(payout.status)}`}>
                        {payout.status === 'pending' ? 'รอจ่าย' : payout.status === 'approved' ? 'อนุมัติ' : 'จ่ายแล้ว'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payout.status === 'pending' && (
                        <button className="text-sm text-indigo-600 hover:underline">อนุมัติ</button>
                      )}
                      {payout.status === 'approved' && (
                        <button className="text-sm text-green-600 hover:underline">จ่าย</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'rules' ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-4">กฎการคำนวณ Commission</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">บริการทั่วไป</p>
                <p className="text-sm text-gray-500">ทุกบริการ</p>
              </div>
              <span className="text-lg font-bold text-indigo-600">10%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">ขายสินค้า</p>
                <p className="text-sm text-gray-500">ผลิตภัณฑ์ทั้งหมด</p>
              </div>
              <span className="text-lg font-bold text-indigo-600">5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">ลูกค้าใหม่</p>
                <p className="text-sm text-gray-500">โบนัสลูกค้าใหม่</p>
              </div>
              <span className="text-lg font-bold text-green-600">฿200</span>
            </div>
          </div>
          <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
            + เพิ่มกฎใหม่
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">เลือกแท็บเพื่อดูรายละเอียด</p>
        </div>
      )}
    </div>
  );
}
