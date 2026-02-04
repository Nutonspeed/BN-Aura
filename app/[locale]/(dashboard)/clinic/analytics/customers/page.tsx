'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Star, DollarSign, Calendar } from 'lucide-react';

interface CustomerAnalytics {
  id: string;
  customer_id: string;
  customer?: { full_name: string; phone: string };
  lifetime_value: number;
  total_visits: number;
  average_order_value: number;
  days_since_last_visit: number;
  churn_risk_score: number;
  customer_segment: string;
}

export default function CustomerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CustomerAnalytics[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<string>('');

  useEffect(() => { fetchData(); }, [segment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (segment) params.set('segment', segment);
      const res = await fetch(`/api/analytics/customers?${params}`);
      const data = await res.json();
      setAnalytics(data.analytics || []);
      setSegmentCounts(data.segmentCounts || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);

  const getSegmentStyle = (s: string) => {
    const styles: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-700',
      loyal: 'bg-green-100 text-green-700',
      promising: 'bg-blue-100 text-blue-700',
      new: 'bg-cyan-100 text-cyan-700',
      at_risk: 'bg-yellow-100 text-yellow-700',
      dormant: 'bg-orange-100 text-orange-700',
      lost: 'bg-red-100 text-red-700'
    };
    return styles[s] || 'bg-gray-100 text-gray-700';
  };

  const getSegmentLabel = (s: string) => {
    const labels: Record<string, string> = {
      vip: 'VIP', loyal: 'ขาประจำ', promising: 'มีแนวโน้ม', new: 'ใหม่',
      at_risk: 'เสี่ยง', dormant: 'ห่างหาย', lost: 'สูญเสีย'
    };
    return labels[s] || s;
  };

  const totalCLV = analytics.reduce((sum, a) => sum + (a.lifetime_value || 0), 0);
  const avgCLV = analytics.length ? totalCLV / analytics.length : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-indigo-600" /> Customer Analytics
        </h1>
        <p className="text-gray-600">วิเคราะห์ลูกค้าและ Customer Lifetime Value (CLV)</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">Total CLV</p>
          <p className="text-xl font-bold text-green-600">{formatPrice(totalCLV)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">Average CLV</p>
          <p className="text-xl font-bold">{formatPrice(avgCLV)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">VIP Customers</p>
          <p className="text-xl font-bold text-purple-600">{segmentCounts.vip || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">At Risk</p>
          <p className="text-xl font-bold text-yellow-600">{(segmentCounts.at_risk || 0) + (segmentCounts.dormant || 0)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setSegment('')} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${!segment ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
          ทั้งหมด
        </button>
        {['vip', 'loyal', 'promising', 'new', 'at_risk', 'dormant', 'lost'].map(s => (
          <button key={s} onClick={() => setSegment(s)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${segment === s ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            {getSegmentLabel(s)} ({segmentCounts[s] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ไม่มีข้อมูล</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ลูกค้า</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Segment</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">CLV</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">เข้าใช้</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">AOV</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ห่างหาย</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Churn Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.customer?.full_name || '-'}</p>
                    <p className="text-sm text-gray-500">{a.customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getSegmentStyle(a.customer_segment)}`}>
                      {getSegmentLabel(a.customer_segment)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">{formatPrice(a.lifetime_value)}</td>
                  <td className="px-4 py-3">{a.total_visits} ครั้ง</td>
                  <td className="px-4 py-3">{formatPrice(a.average_order_value)}</td>
                  <td className="px-4 py-3">{a.days_since_last_visit} วัน</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${a.churn_risk_score > 0.7 ? 'bg-red-500' : a.churn_risk_score > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${a.churn_risk_score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(a.churn_risk_score * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
