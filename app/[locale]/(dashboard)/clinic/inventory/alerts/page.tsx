'use client';

import { useState, useEffect } from 'react';
import { Warning, Package, Check, Bell, Funnel } from '@phosphor-icons/react';

interface Alert {
  id: string;
  product_id: string;
  alert_type: string;
  current_quantity: number;
  threshold_quantity: number;
  status: string;
  created_at: string;
}

export default function InventoryAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/alerts?status=${filter}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (id: string, action: string) => {
    await fetch('/api/inventory/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id, action })
    });
    fetchData();
  };

  const getTypeStyle = (type: string) => {
    if (type === 'out_of_stock') return 'bg-red-100 text-red-700';
    if (type === 'low_stock') return 'bg-yellow-100 text-yellow-700';
    if (type === 'expiring_soon') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    if (type === 'out_of_stock') return 'หมดสต็อก';
    if (type === 'low_stock') return 'สต็อกต่ำ';
    if (type === 'expiring_soon') return 'ใกล้หมดอายุ';
    if (type === 'expired') return 'หมดอายุ';
    return type;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-yellow-500" /> Inventory Alerts
          </h1>
          <p className="text-gray-600">การแจ้งเตือนสินค้าคงคลัง</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">รอดำเนินการ</p>
          <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">หมดสต็อก</p>
          <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.alert_type === 'out_of_stock').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">สต็อกต่ำ</p>
          <p className="text-2xl font-bold text-orange-600">{alerts.filter(a => a.alert_type === 'low_stock').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">ใกล้หมดอายุ</p>
          <p className="text-2xl font-bold text-purple-600">{alerts.filter(a => a.alert_type === 'expiring_soon').length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['active', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            {f === 'active' ? 'รอดำเนินการ' : f === 'resolved' ? 'แก้ไขแล้ว' : 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">สินค้า</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ประเภท</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">คงเหลือ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ขั้นต่ำ</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{alert.product_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getTypeStyle(alert.alert_type)}`}>
                      {getTypeLabel(alert.alert_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-red-600">{alert.current_quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{alert.threshold_quantity}</td>
                  <td className="px-4 py-3">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAction(alert.id, 'resolve')}
                        className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                      >
                        <Check className="w-4 h-4" /> แก้ไขแล้ว
                      </button>
                    )}
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
