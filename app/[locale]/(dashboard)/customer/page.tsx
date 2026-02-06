'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { User, Heart, Star, CalendarDots, TrendUp, Receipt } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch customer profile
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (customer) {
          setCustomerData(customer);
          setTotalSpent(customer.metadata?.total_spent || 0);
          setTotalPurchases(customer.metadata?.total_purchases || 0);
        }

        // Fetch loyalty points
        const { data: loyaltyData } = await supabase
          .from('loyalty_points')
          .select('points, source, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (loyaltyData) {
          const totalPoints = loyaltyData.reduce((sum, lp) => sum + (lp.points || 0), 0);
          setLoyaltyPoints(totalPoints);
          setRecentTransactions(loyaltyData.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <User weight="duotone" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Customer Portal</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {customerData?.first_name || 'Valued Customer'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), icon: Star, color: 'text-amber-500' },
          { title: 'Total Spent', value: `฿${totalSpent.toLocaleString()}`, icon: TrendUp, color: 'text-emerald-500' },
          { title: 'Purchases', value: totalPurchases.toString(), icon: Receipt, color: 'text-blue-500' },
          { title: 'Rewards Earned', value: Math.floor(loyaltyPoints / 100).toString(), icon: Heart, color: 'text-pink-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 rounded-2xl border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
              </div>
              <stat.icon weight="duotone" className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Treatment History & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <Star weight="duotone" className="w-6 h-6 text-amber-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {transaction.source === 'purchase' ? 'Purchase Reward' : transaction.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.description || 'Loyalty points earned'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-500">+{transaction.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No transactions yet</p>
                  <p className="text-sm mt-2">Make your first purchase to earn loyalty points</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <CalendarDots weight="duotone" className="w-6 h-6 text-blue-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming appointments</p>
                <p className="text-sm mt-2">Schedule your next beauty session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
