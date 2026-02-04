'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Users, Plus, MagnifyingGlass, EnvelopeSimple, CalendarDots, DotsThreeVertical, SpinnerGap, UserPlus, Target } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

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
        setCustomers(data.customers || []);
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
    customer.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Target className="w-4 h-4" />
            Sales Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground uppercase tracking-tight"
          >
            My <span className="text-primary">Customers</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm"
          >
            จัดการลูกค้าทั้งหมดที่อยู่ในความดูแลของคุณ
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/sales/customers/create"
            className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold uppercase tracking-wide shadow-lg hover:brightness-110 transition-all active:scale-95 text-sm"
          >
            <UserPlus className="w-5 h-5" />
            สร้างลูกค้าใหม่
          </Link>
        </motion.div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl py-4 pl-14 pr-6 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="ค้นหาลูกค้า..."
            />
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-foreground">{customers.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-7 h-7" />
          </div>
        </motion.div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Customers List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างลูกค้าคนแรกของคุณวันนี้'}
          </p>
          {!searchTerm && (
            <Link
              href="/sales/customers/create"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:brightness-110 transition-all"
            >
              <Plus className="w-5 h-5" />
              สร้างลูกค้าใหม่
            </Link>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid gap-4"
        >
          {filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer.customer_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                    {customer.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {customer.users?.full_name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <EnvelopeSimple className="w-4 h-4" />
                        {customer.users?.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <CalendarDots className="w-4 h-4" />
                        {new Date(customer.assigned_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <DotsThreeVertical className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
