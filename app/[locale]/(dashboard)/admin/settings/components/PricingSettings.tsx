'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Edit2, DollarSign, Users, Zap, Package, Percent, Clock } from 'lucide-react';
import { useSettingsContext } from '../context';
import { SystemSettings } from '../types';

interface Plan {
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_users: number;
    max_branches: number;
    max_ai_requests: number;
    storage_gb: number;
  };
  is_active: boolean;
  trial_days: number;
  discount_yearly: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'one_time';
  description: string;
  is_active: boolean;
}

interface PricingSettingsProps {
  onSettingsChange?: (updates: Partial<SystemSettings>) => void;
}

export default function PricingSettings({ onSettingsChange }: PricingSettingsProps) {
  const { settings, updateSettings, loading } = useSettingsContext();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddOn, setShowAddOn] = useState(false);

  const [plans, setPlans] = useState<Record<string, Plan>>(settings?.subscription_plans || {});
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: 'extra_ai',
      name: 'Extra AI Requests',
      price: 1000,
      billing_cycle: 'monthly',
      description: 'Additional 100 AI analysis requests per month',
      is_active: true
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      price: 5000,
      billing_cycle: 'monthly',
      description: '24/7 priority support with dedicated account manager',
      is_active: true
    },
    {
      id: 'custom_integration',
      name: 'Custom Integration',
      price: 50000,
      billing_cycle: 'one_time',
      description: 'One-time setup for custom API integrations',
      is_active: false
    }
  ]);

  const [newPlan, setNewPlan] = useState<Plan>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    limits: {
      max_users: 1,
      max_branches: 1,
      max_ai_requests: 100,
      storage_gb: 5
    },
    is_active: true,
    trial_days: 14,
    discount_yearly: 20
  });

  const [newAddOn, setNewAddOn] = useState<AddOn>({
    id: '',
    name: '',
    price: 0,
    billing_cycle: 'monthly',
    description: '',
    is_active: true
  });

  const handleSavePlans = async () => {
    try {
      await updateSettings({
        subscription_plans: plans
      });
    } catch (error) {
      console.error('Failed to save plans:', error);
    }
  };

  const handleUpdatePlan = (planKey: string, field: keyof Plan, value: any) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: value
      }
    }));
  };

  const handleAddPlan = () => {
    if (newPlan.name) {
      const key = newPlan.name.toLowerCase().replace(/\s+/g, '_');
      setPlans(prev => ({
        ...prev,
        [key]: newPlan
      }));
      setNewPlan({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        features: [],
        limits: {
          max_users: 1,
          max_branches: 1,
          max_ai_requests: 100,
          storage_gb: 5
        },
        is_active: true,
        trial_days: 14,
        discount_yearly: 20
      });
      setShowAddPlan(false);
    }
  };

  const handleDeletePlan = (planKey: string) => {
    if (confirm(`Are you sure you want to delete the ${planKey} plan?`)) {
      setPlans(prev => {
        const newPlans = { ...prev };
        delete newPlans[planKey];
        return newPlans;
      });
    }
  };

  const handleAddAddOn = () => {
    if (newAddOn.name) {
      setAddOns(prev => [...prev, { ...newAddOn, id: newAddOn.name.toLowerCase().replace(/\s+/g, '_') }]);
      setNewAddOn({
        id: '',
        name: '',
        price: 0,
        billing_cycle: 'monthly',
        description: '',
        is_active: true
      });
      setShowAddOn(false);
    }
  };

  const handleDeleteAddOn = (id: string) => {
    setAddOns(prev => prev.filter(addon => addon.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-primary" />
          Pricing Configuration
        </h2>
        <button
          onClick={handleSavePlans}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Subscription Plans</h3>
          <button
            onClick={() => setShowAddPlan(true)}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>

        {Object.entries(plans).map(([key, plan]) => (
          <div key={key} className="p-6 bg-white/5 rounded-xl border border-white/10">
            {editingPlan === key ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => handleUpdatePlan(key, 'name', e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-white/80">
                      <input
                        type="checkbox"
                        checked={plan.is_active}
                        onChange={(e) => handleUpdatePlan(key, 'is_active', e.target.checked)}
                        className="rounded"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-white/80">
                      <Clock className="w-4 h-4" />
                      <input
                        type="number"
                        value={plan.trial_days}
                        onChange={(e) => handleUpdatePlan(key, 'trial_days', parseInt(e.target.value))}
                        className="w-20 bg-white/10 border border-white/10 rounded py-1 px-2 text-white text-sm"
                      />
                      days trial
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Monthly Price (THB)</label>
                    <input
                      type="number"
                      value={plan.price_monthly}
                      onChange={(e) => handleUpdatePlan(key, 'price_monthly', parseInt(e.target.value))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Yearly Price (THB)</label>
                    <input
                      type="number"
                      value={plan.price_yearly}
                      onChange={(e) => handleUpdatePlan(key, 'price_yearly', parseInt(e.target.value))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Features (one per line)</label>
                  <textarea
                    value={plan.features.join('\n')}
                    onChange={(e) => handleUpdatePlan(key, 'features', e.target.value.split('\n').filter(f => f.trim()))}
                    rows={4}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Max Users</label>
                    <input
                      type="number"
                      value={plan.limits.max_users}
                      onChange={(e) => handleUpdatePlan(key, 'limits', { ...plan.limits, max_users: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Max Branches</label>
                    <input
                      type="number"
                      value={plan.limits.max_branches}
                      onChange={(e) => handleUpdatePlan(key, 'limits', { ...plan.limits, max_branches: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">AI Requests</label>
                    <input
                      type="number"
                      value={plan.limits.max_ai_requests}
                      onChange={(e) => handleUpdatePlan(key, 'limits', { ...plan.limits, max_ai_requests: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Storage (GB)</label>
                    <input
                      type="number"
                      value={plan.limits.storage_gb}
                      onChange={(e) => handleUpdatePlan(key, 'limits', { ...plan.limits, storage_gb: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      {plan.name}
                      {plan.is_active ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>
                      )}
                    </h4>
                    <p className="text-white/60 text-sm">{plan.trial_days} days trial</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPlan(key)}
                      className="p-2 text-white/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(key)}
                      className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatPrice(plan.price_monthly)}</p>
                    <p className="text-white/60 text-sm">per month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatPrice(plan.price_yearly)}</p>
                    <p className="text-white/60 text-sm">per year</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-white/80 text-sm">
                      <Package className="w-3 h-3 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="w-4 h-4" />
                    <span>{plan.limits.max_users === -1 ? 'Unlimited' : plan.limits.max_users} users</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Package className="w-4 h-4" />
                    <span>{plan.limits.max_branches === -1 ? 'Unlimited' : plan.limits.max_branches} branches</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Zap className="w-4 h-4" />
                    <span>{plan.limits.max_ai_requests === -1 ? 'Unlimited' : plan.limits.max_ai_requests} AI requests</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Package className="w-4 h-4" />
                    <span>{plan.limits.storage_gb === -1 ? 'Unlimited' : plan.limits.storage_gb} GB storage</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Plan Modal */}
        {showAddPlan && (
          <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
            <h4 className="text-lg font-semibold text-white mb-4">Add New Plan</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                    placeholder="e.g., Business"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Trial Days</label>
                  <input
                    type="number"
                    value={newPlan.trial_days}
                    onChange={(e) => setNewPlan({ ...newPlan, trial_days: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Monthly Price (THB)</label>
                  <input
                    type="number"
                    value={newPlan.price_monthly}
                    onChange={(e) => setNewPlan({ ...newPlan, price_monthly: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Yearly Price (THB)</label>
                  <input
                    type="number"
                    value={newPlan.price_yearly}
                    onChange={(e) => setNewPlan({ ...newPlan, price_yearly: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddPlan}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
                >
                  Add Plan
                </button>
                <button
                  onClick={() => setShowAddPlan(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add-ons */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Add-ons & Extras</h3>
          <button
            onClick={() => setShowAddOn(true)}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Add-on
          </button>
        </div>

        {addOns.map((addon) => (
          <div key={addon.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{addon.name}</h4>
                  {addon.is_active ? (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>
                  )}
                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                    {addon.billing_cycle}
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-2">{addon.description}</p>
                <p className="text-xl font-bold text-primary">{formatPrice(addon.price)}</p>
              </div>
              <button
                onClick={() => handleDeleteAddOn(addon.id)}
                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Add-on Modal */}
        {showAddOn && (
          <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
            <h4 className="text-lg font-semibold text-white mb-4">Add New Add-on</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">Add-on Name</label>
                <input
                  type="text"
                  value={newAddOn.name}
                  onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  placeholder="e.g., Extra Storage"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Price (THB)</label>
                  <input
                    type="number"
                    value={newAddOn.price}
                    onChange={(e) => setNewAddOn({ ...newAddOn, price: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Billing Cycle</label>
                  <select
                    value={newAddOn.billing_cycle}
                    onChange={(e) => setNewAddOn({ ...newAddOn, billing_cycle: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Description</label>
                <input
                  type="text"
                  value={newAddOn.description}
                  onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  placeholder="Brief description of the add-on"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddAddOn}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
                >
                  Add Add-on
                </button>
                <button
                  onClick={() => setShowAddOn(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discount Rules */}
      <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Discount Rules
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Yearly subscription discount</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={20}
                className="w-20 bg-white/10 border border-white/10 rounded py-1 px-2 text-white text-center"
                readOnly
              />
              <span className="text-white/60">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Multi-clinic discount (3+ branches)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={15}
                className="w-20 bg-white/10 border border-white/10 rounded py-1 px-2 text-white text-center"
                readOnly
              />
              <span className="text-white/60">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Non-profit discount</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={25}
                className="w-20 bg-white/10 border border-white/10 rounded py-1 px-2 text-white text-center"
                readOnly
              />
              <span className="text-white/60">%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
