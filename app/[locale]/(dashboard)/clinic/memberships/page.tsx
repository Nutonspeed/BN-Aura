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
import { createClient } from '@/lib/supabase/client';
import { 
  Users,
  Crown,
  Star,
  SpinnerGap,
  MagnifyingGlass,
  Plus,
  ArrowLeft,
  CurrencyDollar,
  CheckCircle,
  XCircle,
  Clock
} from '@phosphor-icons/react';
interface MembershipItem {
  id: string;
  customer_id: string;
  customer_name: string;
  tier: string;
  points: number;
  status: 'active' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
  total_spent: number;
}

export default function MembershipsPage() {
  const t = useTranslations();
  const { goBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => { fetchMemberships(); }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff').select('clinic_id')
        .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
      if (!staffData?.clinic_id) return;

      const { data: cmData } = await supabase
        .from('customer_memberships')
        .select('id, customer_id, status, start_date, end_date, membership:memberships(id, name, badge_color, points_multiplier, price), customer:customers(id, full_name, metadata)')
        .eq('clinic_id', staffData.clinic_id)
        .order('created_at', { ascending: false });

      if (cmData) {
        const mapped: MembershipItem[] = cmData.map((cm: any) => {
          const mName = cm.membership?.name?.th || cm.membership?.name?.en || 'Standard';
          const tier = mName.toLowerCase().includes('platinum') ? 'platinum'
            : mName.toLowerCase().includes('gold') ? 'gold'
            : mName.toLowerCase().includes('silver') ? 'silver' : 'bronze';
          const totalSpent = cm.customer?.metadata?.total_spent || 0;
          const points = Math.floor(totalSpent * (cm.membership?.points_multiplier || 1) / 100);
          return { id: cm.id, customer_id: cm.customer_id, customer_name: cm.customer?.full_name || 'Unknown', tier, points, status: cm.status || 'active', start_date: cm.start_date, end_date: cm.end_date, total_spent: totalSpent };
        });
        setMemberships(mapped);
      }
    } catch (e) { console.error('Error fetching memberships:', e); }
    finally { setLoading(false); }
  };

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
    return (<div className="flex items-center justify-center min-h-[60vh]"><SpinnerGap className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  return (
    <div className="space-y-8 p-6">
      { /* @ts-ignore */ }
      <Breadcrumb items={[{ label: 'Clinic', href: '/clinic' }, { label: 'Memberships' }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => goBack('/th/clinic')} className="p-2"><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membership Matrix</h1>
            <p className="text-muted-foreground text-sm mt-1">Loyalty program management</p>
          </div>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats.total} icon={Users} />
        <StatCard title="Active Members" value={stats.active} icon={Crown} />
        <StatCard title="Total Points" value={stats.totalPoints} icon={Star} />
        <StatCard title="Total Revenue" value={Math.round(stats.totalRevenue / 1000)} icon={CurrencyDollar} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members Directory</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none">
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
          {filteredMemberships.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Crown className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No memberships found</p></div>
          ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredMemberships.map((member, index) => (
                <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.1 }} className="p-4 bg-secondary/30 rounded-2xl border border-border hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Crown weight="duotone" className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold">{member.customer_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn('text-xs', getTierColor(member.tier))}>{member.tier.toUpperCase()}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">{getStatusIcon(member.status)} {member.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{member.points.toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">{`\u0E3F`}{member.total_spent.toLocaleString()} spent</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
