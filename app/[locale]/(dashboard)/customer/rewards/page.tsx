'use client';

import { useEffect, useState } from 'react';

type Reward = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  type: string;
  tier_requirement?: string | null;
  monetary_value?: number;
};

type Redemption = {
  id: string;
  code: string;
  status: string;
  pointsCost: number;
  issuedAt: string;
  appliedAt?: string | null;
  appliedPosTransactionId?: string | null;
  reward?: {
    id: string;
    name: string;
    type: string;
    monetary_value?: number;
  } | null;
};

type PointTxn = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

export default function CustomerRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [currentTier, setCurrentTier] = useState('bronze');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [lastRedemptionCode, setLastRedemptionCode] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [transactions, setTransactions] = useState<PointTxn[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'coupons' | 'history'>('rewards');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loyalty/rewards');
      const json = await res.json();
      if (json.success) {
        setAvailablePoints(json.data.availablePoints || 0);
        setCurrentTier(json.data.currentTier || 'bronze');
        setRewards(json.data.rewards || []);
      }
    } catch (e) {
      console.error(e);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/loyalty/history?limit=20');
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load history');
      }

      setRedemptions(json.data.redemptions || []);
      setTransactions(json.data.transactions || []);
    } catch (e) {
      console.error(e);
      setRedemptions([]);
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadHistory();
  }, []);

  const redeem = async (rewardId: string) => {
    try {
      setRedeemingId(rewardId);
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ rewardId })
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Redeem failed');
      }

      setLastRedemptionCode(json.data?.redemptionCode || null);
      await load();
      await loadHistory();
    } catch (e) {
      console.error(e);
      alert('Redeem failed');
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
        <div className="text-white text-xl font-bold">Rewards</div>
        <div className="text-gray-400 text-sm mt-1">Tier: {currentTier}</div>
        <div className="text-primary text-2xl font-bold mt-3">{availablePoints.toLocaleString()} points</div>
        {lastRedemptionCode && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400">Your redemption code</div>
            <div className="text-white font-bold text-lg mt-1">{lastRedemptionCode}</div>
            <div className="text-xs text-gray-500 mt-1">Use this code at the counter (POS)</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 w-fit">
        {(['rewards', 'coupons', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'coupons' ? 'My Coupons' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((r: Reward) => {
              const canRedeem = availablePoints >= r.points_cost;
              return (
                <div key={r.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between group hover:border-primary/50 transition-all">
                  <div>
                    <div className="text-white font-bold text-lg">{r.name}</div>
                    <div className="text-gray-400 text-sm mt-2 line-clamp-2">{r.description}</div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                    <div className="text-primary font-bold text-lg">{r.points_cost.toLocaleString()} pts</div>
                    <button
                      onClick={() => redeem(r.id)}
                      disabled={!canRedeem || redeemingId === r.id}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        canRedeem
                          ? 'bg-white text-black hover:bg-primary hover:text-white'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {redeemingId === r.id ? 'Processing...' : 'Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
            {rewards.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-12">No rewards available</div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <div className="text-white font-bold text-lg">My Coupons</div>
            <div className="text-gray-400 text-sm mt-1">Show your issued codes and use them at POS.</div>

            {historyLoading ? (
              <div className="text-gray-500 text-sm mt-3">Loading...</div>
            ) : redemptions.filter(r => r.status === 'issued').length === 0 ? (
              <div className="text-gray-500 text-sm mt-3">No active coupons</div>
            ) : (
              <div className="space-y-3 mt-4">
                {redemptions
                  .filter(r => r.status === 'issued')
                  .map((r: Redemption) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-bold">{r.reward?.name || 'Reward Coupon'}</div>
                          <div className="text-gray-400 text-xs mt-1">Code: {r.code}</div>
                          <div className="text-gray-500 text-xs mt-1">Issued: {new Date(r.issuedAt).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(r.code);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
              <div className="text-white font-bold text-lg">Redemption History</div>
              {historyLoading ? (
                <div className="text-gray-500 text-sm mt-3">Loading...</div>
              ) : redemptions.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No redemptions yet</div>
              ) : (
                <div className="space-y-3 mt-4">
                  {redemptions.map((r: Redemption) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-bold">{r.reward?.name || 'Reward'}</div>
                          <div className="text-gray-400 text-xs mt-1">Code: {r.code}</div>
                          <div className="text-gray-500 text-xs mt-1">Issued: {new Date(r.issuedAt).toLocaleString()}</div>
                          {r.appliedAt && (
                            <div className="text-gray-500 text-xs mt-1">Applied: {new Date(r.appliedAt).toLocaleString()}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-bold">-{r.pointsCost.toLocaleString()} pts</div>
                          <div className="text-xs text-gray-400 mt-1">{r.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
              <div className="text-white font-bold text-lg">Recent Point Activity</div>
              {historyLoading ? (
                <div className="text-gray-500 text-sm mt-3">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No activity yet</div>
              ) : (
                <div className="space-y-3 mt-4">
                  {transactions.map((t: PointTxn) => (
                    <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-bold">{t.description || 'Point transaction'}</div>
                          <div className="text-gray-500 text-xs mt-1">{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${t.type === 'redeemed' ? 'text-red-400' : 'text-green-400'}`}>
                            {t.type === 'redeemed' ? '-' : '+'}{t.amount.toLocaleString()} pts
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{t.type}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
