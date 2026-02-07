/**
 * Unified Commission Tracker
 * แสดง commissions จาก workflow system พร้อม realtime updates
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { workflowBridge } from '@/lib/workflow/workflowBridge';
import { 
  CurrencyDollar,
  TrendUp,
  CalendarDots,
  Clock,
  CheckCircle,
  WarningCircle,
  Download,
  Funnel
} from '@phosphor-icons/react';
interface CommissionRecord {
  id: string;
  sales_staff_id: string;
  customer_id: string;
  transaction_type: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  transaction_date: string;
  workflow_id?: string;
  customer_name?: string;
}

interface CommissionSummary {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  transactionCount: number;
  averageCommission: number;
}

export default function UnifiedCommissionTracker() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  
  const { events } = useWorkflowEvents({
    onCommissionEarned: async (workflowId, amount) => {
      // Refresh commissions when new commission is earned
      await loadCommissions();
      await loadSummary();
    }
  });

  // Load commissions
  const loadCommissions = async () => {
    if (!user?.id) return;

    try {
      const supabase = createClient();
      
      let query = supabase
        .from('sales_commissions')
        .select(`
          *,
          customers!inner(
            full_name
          )
        `)
        .eq('sales_staff_id', user.id);

      // Apply period filter
      const startDate = getStartDate(period);
      query = query.gte('transaction_date', startDate);

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('payment_status', filter);
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;

      const commissionRecords: CommissionRecord[] = (data || []).map(record => ({
        id: record.id,
        sales_staff_id: record.sales_staff_id,
        customer_id: record.customer_id,
        transaction_type: record.transaction_type,
        base_amount: record.base_amount,
        commission_rate: record.commission_rate,
        commission_amount: record.commission_amount,
        payment_status: record.payment_status,
        transaction_date: record.transaction_date,
        workflow_id: record.workflow_id,
        customer_name: record.customers?.full_name || 'Unknown Customer'
      }));

      setCommissions(commissionRecords);
    } catch (error) {
      console.error('Failed to load commissions:', error);
    }
  };

  // Load summary using workflow bridge
  const loadSummary = async () => {
    if (!user?.id) return;

    try {
      const summaryData = await workflowBridge.getCommissionSummary(user.id, period);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([loadCommissions(), loadSummary()])
        .finally(() => setLoading(false));
    }
  }, [user?.id, period, filter]);

  // Get start date based on period
  const getStartDate = (period: 'daily' | 'weekly' | 'monthly'): string => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
    }

    return start.toISOString();
  };

  // Export commissions
  const exportCommissions = () => {
    const csv = [
      ['Date', 'Customer', 'Type', 'Base Amount', 'Commission Rate', 'Commission', 'Status'],
      ...commissions.map(c => [
        new Date(c.transaction_date).toLocaleDateString(),
        c.customer_name,
        c.transaction_type,
        c.base_amount.toString(),
        `${c.commission_rate}%`,
        c.commission_amount.toString(),
        c.payment_status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Commission Tracker</h1>
        <p className="text-gray-400">Track your earnings and commission payments</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <CurrencyDollar className="w-8 h-8 text-green-400" />
              <TrendUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Commission</p>
            <p className="text-2xl font-bold text-white">
              ฿{summary.totalCommission.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-400" />
              <WarningCircle className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Pending</p>
            <p className="text-2xl font-bold text-white">
              ฿{summary.pendingCommission.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-400" />
              <CalendarDots className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Paid</p>
            <p className="text-2xl font-bold text-white">
              ฿{summary.paidCommission.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendUp className="w-8 h-8 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">AVG</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Average</p>
            <p className="text-2xl font-bold text-white">
              ฿{Math.round(summary.averageCommission).toLocaleString()}
            </p>
          </motion.div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>

          <button
            onClick={exportCommissions}
            className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Commission List */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                <th className="text-left p-4 text-gray-400 font-medium">Customer</th>
                <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                <th className="text-right p-4 text-gray-400 font-medium">Base Amount</th>
                <th className="text-right p-4 text-gray-400 font-medium">Rate</th>
                <th className="text-right p-4 text-gray-400 font-medium">Commission</th>
                <th className="text-center p-4 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission, index) => (
                <motion.tr
                  key={commission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-gray-300">
                    {new Date(commission.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-white font-medium">
                    {commission.customer_name}
                  </td>
                  <td className="p-4 text-gray-300">
                    {commission.transaction_type.replace('_', ' ')}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    ฿{commission.base_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {commission.commission_rate}%
                  </td>
                  <td className="p-4 text-right font-medium text-green-400">
                    ฿{commission.commission_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      commission.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : commission.payment_status === 'pending'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {commission.payment_status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {commissions.length === 0 && (
            <div className="text-center py-12">
              <CurrencyDollar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No commissions found for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}