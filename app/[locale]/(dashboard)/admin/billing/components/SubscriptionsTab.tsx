import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, Eye, PencilSimple, Clock, Buildings } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Subscription } from '../hooks/useBillingData';

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  formatCurrency: (amount: number) => string;
}

const planPricing = {
  starter: { price: 2900, name: 'Starter' },
  professional: { price: 4900, name: 'Professional' },
  premium: { price: 7900, name: 'Premium' },
  enterprise: { price: 12900, name: 'Enterprise' }
};

export default function SubscriptionsTab({ subscriptions, formatCurrency }: SubscriptionsTabProps) {
  const t = useTranslations('admin.billing');
  const tCommon = useTranslations('common');
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-500/20';
      case 'past_due': return 'text-amber-400 bg-amber-500/20';
      case 'canceled': return 'text-red-400 bg-red-500/20';
      case 'expired': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'text-gray-400 bg-gray-500/20';
      case 'professional': return 'text-blue-400 bg-blue-500/20';
      case 'premium': return 'text-purple-400 bg-purple-500/20';
      case 'enterprise': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = sub.clinic_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Filters */}
      <div className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">{t('filter_subscriptions')}</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border-2 border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-primary transition-all"
            >
              <option value="all">{t('all_status')}</option>
              <option value="active">{t('active')}</option>
              <option value="past_due">{t('past_due')}</option>
              <option value="canceled">{t('canceled')}</option>
              <option value="expired">{t('expired')}</option>
            </select>
          </div>
          <div className="relative group">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={tCommon('search')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border-2 border-slate-700 rounded-xl py-2 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all w-64 shadow-inner"
            />
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4 font-medium">
          {t('showing_results', { count: filteredSubscriptions.length, total: subscriptions.length })}
        </p>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('clinic')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('plan')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('next_billing')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredSubscriptions.map((subscription) => (
                <motion.tr
                  key={subscription.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm">
                        <Buildings className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-tight">{subscription.clinic_name}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {subscription.clinic_id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getPlanColor(subscription.plan)}`}>
                      {planPricing[subscription.plan]?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(subscription.status)}`}>
                      {subscription.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{formatCurrency(subscription.amount)}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{t('per_month')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">
                        {new Date(subscription.next_billing_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all shadow-sm">
                        <PencilSimple className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
