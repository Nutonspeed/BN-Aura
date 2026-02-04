'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Phone, Bell, Check, X, Plus, MagnifyingGlass } from '@phosphor-icons/react';

interface WaitlistEntry {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer?: { full_name: string; phone: string };
  service?: { name: { th: string } };
  preferred_dates: string[];
  preferred_time_range: { start: string; end: string };
  priority: number;
  status: string;
  notified_count: number;
  created_at: string;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('waiting');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?status=${filter}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: id, status })
    });
    fetchData();
  };

  const notify = async () => {
    if (!selected.length) return;
    await fetch('/api/waitlist/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryIds: selected,
        availableSlot: { date: new Date().toISOString().split('T')[0], time: '14:00' }
      })
    });
    setSelected([]);
    fetchData();
  };

  const filtered = entries.filter(e => {
    const name = e.customer?.full_name || e.customer_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusStyle = (s: string) => {
    if (s === 'waiting') return 'bg-blue-100 text-blue-700';
    if (s === 'notified') return 'bg-yellow-100 text-yellow-700';
    if (s === 'converted') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" /> Waitlist
          </h1>
          <p className="text-gray-600">จัดการรายชื่อรอคิว</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={notify} className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg">
              <Bell className="w-5 h-5" /> แจ้ง ({selected.length})
            </button>
          )}
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
            <Plus className="w-5 h-5" /> เพิ่มคิว
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">รอคิว</p>
          <p className="text-2xl font-bold">{entries.filter(e => e.status === 'waiting').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">แจ้งแล้ว</p>
          <p className="text-2xl font-bold text-yellow-600">{entries.filter(e => e.status === 'notified').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">จองสำเร็จ</p>
          <p className="text-2xl font-bold text-green-600">{entries.filter(e => e.status === 'converted').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-600">Conversion</p>
          <p className="text-2xl font-bold text-indigo-600">
            {entries.length ? Math.round((entries.filter(e => e.status === 'converted').length / entries.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          {['waiting', 'notified', 'converted'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              {f === 'waiting' ? 'รอคิว' : f === 'notified' ? 'แจ้งแล้ว' : 'จองแล้ว'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ไม่มีรายการ</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.filter(e => e.status === 'waiting').length}
                    onChange={e => setSelected(e.target.checked ? filtered.filter(x => x.status === 'waiting').map(x => x.id) : [])}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ลูกค้า</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">บริการ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ลำดับ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">สถานะ</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {entry.status === 'waiting' && (
                      <input
                        type="checkbox"
                        checked={selected.includes(entry.id)}
                        onChange={e => setSelected(e.target.checked ? [...selected, entry.id] : selected.filter(id => id !== entry.id))}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{entry.customer?.full_name || entry.customer_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {entry.customer?.phone || entry.customer_phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">{entry.service?.name?.th || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${entry.priority <= 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                      #{entry.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(entry.status)}`}>
                      {entry.status === 'waiting' ? 'รอคิว' : entry.status === 'notified' ? 'แจ้งแล้ว' : 'จองแล้ว'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === 'waiting' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(entry.id, 'converted')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(entry.id, 'cancelled')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
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
