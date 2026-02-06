'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Users,
  Crown,
  Star,
  TrendUp,
  SpinnerGap,
  MagnifyingGlass,
  Plus,
  ArrowLeft,
  CurrencyDollar,
  CalendarDots,
  CheckCircle,
  XCircle,
  Clock
} from '@phosphor-icons/react';

interface Membership {
  id: string;
  customer_id: string;
  customer_name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  status: 'active' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
  total_spent: number;
}

export default function MembershipsPage() {
  const t = useTranslations();
  const { handleBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMemberships([
        {
          id: '1',
          customer_id: 'c1',
          customer_name: 'คุณสมศรี มั่งมี',
          tier: 'gold',
          points: 15000,
          status: 'active',
          start_date: '2024-01-15',
          end_date: '2025-01-15',
          total_spent: 150000
        },
        {
          id: '2',
          customer_id: 'c2',
          customer_name: 'คุณวิภา รักสวย',
          tier: 'platinum',
          points: 45000,
          status: 'active',
          start_date: '2023-06-01',
          end_date: '2024-06-01',
          total_spent: 450000
        },
        {
          id: '3',
          customer_id: 'c3',
          customer_name: 'คุณนภา ใจดี',
          tier: 'silver',
          points: 5000,
          status: 'active',
          start_date: '2024-03-01',
          end_date: '2025-03-01',
          total_spent: 50000
        }
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => ({
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    totalPoints: memberships.reduce((sum, m) => sum + m.points, 0),
    totalRevenue: memberships.reduce((sum, m) => sum + m.total_spent, 0)
  }), [memberships]);

  const filteredMemberships = useMemo(() => {
    return memberships.filter(m => {
      const matchesSearch = m.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = filterTier === 'all' || m.tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [memberships, searchQuery, filterTier]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'gold': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'silver': return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
      default: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle weight="fill" className="w-4 h-4 text-green-500" />;
      case 'expired': return <XCircle weight="fill" className="w-4 h-4 text-red-500" />;
      default: return <Clock weight="fill" className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SpinnerGap className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <Breadcrumb
        items={[
          { label: 'Clinic', href: '/clinic' },
          { label: 'Memberships' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membership Matrix</h1>
            <p className="text-muted-foreground text-sm mt-1">Loyalty program management</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.total}
          icon={<Users weight="duotone" className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Members"
          value={stats.active}
          icon={<Crown weight="duotone" className="w-6 h-6" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Points"
          value={stats.totalPoints.toLocaleString()}
          icon={<Star weight="duotone" className="w-6 h-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`฿${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={<CurrencyDollar weight="duotone" className="w-6 h-6" />}
          trend={{ value: 18, isPositive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members Directory</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredMemberships.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-secondary/30 rounded-2xl border border-border hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Crown weight="duotone" className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.customer_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn('text-xs', getTierColor(member.tier))}>
                            {member.tier.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {getStatusIcon(member.status)}
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{member.points.toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">
                        ฿{member.total_spent.toLocaleString()} spent
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
