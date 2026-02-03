'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Mail, Phone, Calendar, MoreVertical } from 'lucide-react';

interface Customer {
  customer_id: string;
  assigned_at: string;
  is_active: boolean;
  users: {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/sales/customers');
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
      } else {
        setError(data.error || 'Failed to fetch customers');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.users.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ลูกค้าของฉัน</h1>
              <p className="text-blue-200">จัดการลูกค้าทั้งหมดของคุณ</p>
            </div>
          </div>
          <Link
            href="/th/sales/customers/create"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            สร้างลูกค้าใหม่
          </Link>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-blue-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ค้นหาลูกค้า..."
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-blue-200">กำลังโหลด...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}
            </h3>
            <p className="text-blue-200 mb-6">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างลูกค้าคนแรกของคุณวันนี้'}
            </p>
            {!searchTerm && (
              <Link
                href="/th/sales/customers/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                สร้างลูกค้าใหม่
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {customer.users.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {customer.users.full_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-blue-200 text-sm">
                          <Mail className="w-4 h-4" />
                          {customer.users.email}
                        </span>
                        <span className="flex items-center gap-1 text-blue-200 text-sm">
                          <Calendar className="w-4 h-4" />
                          สร้างเมื่อ {new Date(customer.assigned_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-blue-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
