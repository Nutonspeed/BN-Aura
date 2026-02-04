'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloppyDisk, Eye, CalendarDots, Target, Monitor, Flag, Bell } from '@phosphor-icons/react';
import { useAnnouncementContext } from '../context';
import { AnnouncementFormData } from '../types';

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData> & { id?: string };
  onClose?: () => void;
}

export default function AnnouncementForm({ initialData, onClose }: AnnouncementFormProps) {
  const { createAnnouncement, updateAnnouncement, saving, clinics } = useAnnouncementContext();
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    target_audience: initialData?.target_audience || {
      roles: [],
      clinics: [],
      plans: []
    },
    display_location: initialData?.display_location || 'banner',
    priority: initialData?.priority || 'normal',
    start_date: initialData?.start_date || new Date().toISOString().slice(0, 16),
    end_date: initialData?.end_date || '',
    is_active: initialData?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await updateAnnouncement(initialData.id, formData);
      } else {
        await createAnnouncement(formData);
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'clinic_owner', label: 'Clinic Owner' },
    { value: 'clinic_admin', label: 'Clinic Admin' },
    { value: 'clinic_staff', label: 'Clinic Staff' },
    { value: 'sales_staff', label: 'Sales Staff' },
    { value: 'customer', label: 'Customer' }
  ];

  const plans = ['starter', 'professional', 'premium', 'enterprise'];
  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <FloppyDisk className="w-6 h-6 text-primary" />
        {initialData?.id ? 'Edit Announcement' : 'Create New Announcement'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Announcement Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter announcement title"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Type your announcement content here..."
            required
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Target className="w-4 h-4 inline mr-2" />
            Target Audience
          </label>
          
          {/* Roles */}
          <div className="mb-4">
            <p className="text-white/60 text-sm mb-2">By Role:</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.target_audience.roles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          target_audience: {
                            ...formData.target_audience,
                            roles: [...formData.target_audience.roles, role.value]
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          target_audience: {
                            ...formData.target_audience,
                            roles: formData.target_audience.roles.filter(r => r !== role.value)
                          }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-white/80 text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div className="mb-4">
            <p className="text-white/60 text-sm mb-2">By Subscription Plan:</p>
            <div className="grid grid-cols-2 gap-2">
              {plans.map((plan) => (
                <label key={plan} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.target_audience.plans.includes(plan)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          target_audience: {
                            ...formData.target_audience,
                            plans: [...formData.target_audience.plans, plan]
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          target_audience: {
                            ...formData.target_audience,
                            plans: formData.target_audience.plans.filter(p => p !== plan)
                          }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-white/80 text-sm">{planLabels[plan as keyof typeof planLabels]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specific Clinics */}
          <div>
            <p className="text-white/60 text-sm mb-2">Specific Clinics:</p>
            <select
              multiple
              value={formData.target_audience.clinics}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({
                  ...formData,
                  target_audience: {
                    ...formData.target_audience,
                    clinics: selected
                  }
                });
              }}
              className="w-full h-32 bg-white/10 border border-white/10 rounded-xl py-2 px-3 text-white"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id} className="bg-slate-800">
                  {clinic.name}
                </option>
              ))}
            </select>
            <p className="text-white/40 text-xs mt-2">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>

        {/* Display Location */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Monitor className="w-4 h-4 inline mr-2" />
            Display Location
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'banner', label: 'Banner', desc: 'Top of dashboard' },
              { value: 'modal', label: 'Modal', desc: 'Popup window' },
              { value: 'sidebar', label: 'Sidebar', desc: 'Side panel' }
            ].map((location) => (
              <label
                key={location.value}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.display_location === location.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="display_location"
                  value={location.value}
                  checked={formData.display_location === location.value}
                  onChange={(e) => setFormData({ ...formData, display_location: e.target.value as any })}
                  className="sr-only"
                />
                <div className="font-medium">{location.label}</div>
                <div className="text-sm opacity-70">{location.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Flag className="w-4 h-4 inline mr-2" />
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'low', label: 'Low', color: 'text-blue-400' },
              { value: 'normal', label: 'Normal', color: 'text-yellow-400' },
              { value: 'high', label: 'High', color: 'text-red-400' }
            ].map((priority) => (
              <label
                key={priority.value}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.priority === priority.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="sr-only"
                />
                <div className={`font-medium ${priority.color}`}>{priority.label}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <CalendarDots className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded w-5 h-5"
          />
          <label htmlFor="is_active" className="text-white/80 cursor-pointer flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Announcement is active and visible to users</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !formData.title || !formData.content}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FloppyDisk className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Announcement'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
