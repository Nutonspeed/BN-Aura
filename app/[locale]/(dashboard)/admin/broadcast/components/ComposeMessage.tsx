'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PaperPlaneTilt, TestTube, CalendarDots, Users, Buildings } from '@phosphor-icons/react';
import { useBroadcastContext } from '../context';
import { BroadcastFormData } from '../types';

export default function ComposeMessage() {
  const { createMessage, sendTestMessage, creating, clinics } = useBroadcastContext();
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    content: '',
    message_type: 'notification',
    target_type: 'all',
    target_plans: [],
    target_clinics: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMessage(formData);
      // Reset form
      setFormData({
        title: '',
        content: '',
        message_type: 'notification',
        target_type: 'all',
        target_plans: [],
        target_clinics: []
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTest = async () => {
    try {
      await sendTestMessage(formData);
    } catch (error) {
      console.error('Failed to send test:', error);
    }
  };

  const plans = ['starter', 'professional', 'premium', 'enterprise'];
  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  const selectedClinicCount = formData.target_type === 'specific' 
    ? formData.target_clinics.length 
    : formData.target_type === 'plan' 
    ? clinics.filter(c => formData.target_plans.includes(c.plan)).length
    : clinics.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <PaperPlaneTilt className="w-6 h-6 text-primary" />
        Compose New Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Message Title */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Message Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter message title"
            required
          />
        </div>

        {/* Message Content */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Message Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Type your message here..."
            required
          />
        </div>

        {/* Message Type */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Delivery Method
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'notification', label: 'In-App Notification', desc: 'Show in dashboard' },
              { value: 'email', label: 'Email', desc: 'Send to email addresses' },
              { value: 'sms', label: 'SMS', desc: 'Send to phone numbers' }
            ].map((type) => (
              <label
                key={type.value}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.message_type === type.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="message_type"
                  value={type.value}
                  checked={formData.message_type === type.value}
                  onChange={(e) => setFormData({ ...formData, message_type: e.target.value as any })}
                  className="sr-only"
                />
                <div className="font-medium">{type.label}</div>
                <div className="text-sm opacity-70">{type.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { value: 'all', label: 'All Clinics', icon: Users },
              { value: 'plan', label: 'By Plan', icon: Buildings },
              { value: 'specific', label: 'Specific Clinics', icon: Users }
            ].map((target) => (
              <label
                key={target.value}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.target_type === target.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="target_type"
                  value={target.value}
                  checked={formData.target_type === target.value}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                  className="sr-only"
                />
                <target.icon className="w-5 h-5 mb-2" />
                <div className="font-medium">{target.label}</div>
              </label>
            ))}
          </div>

          {/* Target Plans */}
          {formData.target_type === 'plan' && (
            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-white/60 text-sm mb-3">Select Plans:</label>
              <div className="grid grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <label key={plan} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_plans.includes(plan)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            target_plans: [...formData.target_plans, plan]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            target_plans: formData.target_plans.filter(p => p !== plan)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-white/80">{planLabels[plan as keyof typeof planLabels]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Specific Clinics */}
          {formData.target_type === 'specific' && (
            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-white/60 text-sm mb-3">Select Clinics:</label>
              <select
                multiple
                value={formData.target_clinics}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, target_clinics: selected });
                }}
                className="w-full h-32 bg-white/10 border border-white/10 rounded-xl py-2 px-3 text-white"
              >
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id} className="bg-slate-800">
                    {clinic.name} ({clinic.plan})
                  </option>
                ))}
              </select>
              <p className="text-white/40 text-xs mt-2">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}

          {/* Audience Summary */}
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-primary font-medium">Recipients:</span>
              <span className="text-white font-bold">{selectedClinicCount} clinics</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <CalendarDots className="w-4 h-4 inline mr-2" />
            Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduled_at || ''}
            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-white/40 text-sm mt-2">Leave empty to send immediately</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={creating || !formData.title || !formData.content}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PaperPlaneTilt className="w-4 h-4" />
            {creating ? 'Sending...' : 'Send Message'}
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={creating || !formData.title || !formData.content}
            className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            Send Test
          </button>
        </div>
      </form>
    </motion.div>
  );
}
