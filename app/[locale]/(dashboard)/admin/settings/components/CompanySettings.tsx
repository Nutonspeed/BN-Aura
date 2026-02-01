'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, X } from 'lucide-react';
import { useSettingsContext } from '../context';

interface CompanySettingsProps {
  onSettingsChange: (updates: any) => void;
}

export default function CompanySettings({ onSettingsChange }: CompanySettingsProps) {
  const { settings } = useSettingsContext();
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo_url: '',
    contact_email: '',
    contact_phone: '',
    support_email: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_logo_url: settings.company_logo_url || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        support_email: settings.support_email || ''
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to storage and get URL
      const url = URL.createObjectURL(file);
      handleChange('company_logo_url', url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-white">Company Information</h2>
          <p className="text-white/60">Basic company details and branding</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Company Logo */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-4">
            Company Logo
          </label>
          <div className="flex items-center gap-6">
            {formData.company_logo_url ? (
              <div className="relative">
                <img
                  src={formData.company_logo_url}
                  alt="Company Logo"
                  className="w-24 h-24 rounded-xl object-cover border border-white/10"
                />
                <button
                  onClick={() => handleChange('company_logo_url', '')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white/40" />
              </div>
            )}
            
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Logo
              </label>
              <p className="text-white/40 text-sm mt-2">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter company name"
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="+66-2-xxx-xxxx"
            />
          </div>
        </div>

        {/* Support Email */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={formData.support_email}
            onChange={(e) => handleChange('support_email', e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="support@company.com"
          />
          <p className="text-white/40 text-sm mt-2">
            This email will be used for customer support communications
          </p>
        </div>
      </div>
    </motion.div>
  );
}
