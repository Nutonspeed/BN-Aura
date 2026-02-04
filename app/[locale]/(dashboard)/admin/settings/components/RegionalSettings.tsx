'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe } from '@phosphor-icons/react';
import { useSettingsContext } from '../context';

interface RegionalSettingsProps {
  onSettingsChange: (updates: any) => void;
}

export default function RegionalSettings({ onSettingsChange }: RegionalSettingsProps) {
  const { settings } = useSettingsContext();
  const [formData, setFormData] = useState({
    default_language: 'th',
    default_timezone: 'Asia/Bangkok',
    default_currency: 'THB',
    tax_rate: 7.0
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        default_language: settings.default_language || 'th',
        default_timezone: settings.default_timezone || 'Asia/Bangkok',
        default_currency: settings.default_currency || 'THB',
        tax_rate: settings.tax_rate || 7.0
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string | number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const languages = [
    { code: 'th', name: 'ไทย (Thai)' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' }
  ];

  const timezones = [
    { value: 'Asia/Bangkok', name: 'Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', name: 'Singapore (GMT+8)' },
    { value: 'Asia/Jakarta', name: 'Jakarta (GMT+7)' },
    { value: 'Asia/Kuala_Lumpur', name: 'Kuala Lumpur (GMT+8)' },
    { value: 'Asia/Manila', name: 'Manila (GMT+8)' },
    { value: 'UTC', name: 'UTC (GMT+0)' }
  ];

  const currencies = [
    { code: 'THB', name: 'Thai Baht (฿)', symbol: '฿' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
    { code: 'MYR', name: 'Malaysian Ringgit (RM)', symbol: 'RM' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-center gap-3 mb-8">
        <Globe className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-white">Regional Settings</h2>
          <p className="text-white/60">Language, timezone, and currency preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Default Language */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Default Language
          </label>
          <select
            value={formData.default_language}
            onChange={(e) => handleChange('default_language', e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-800">
                {lang.name}
              </option>
            ))}
          </select>
          <p className="text-white/40 text-sm mt-2">
            Default language for new users and system messages
          </p>
        </div>

        {/* Default Timezone */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Default Timezone
          </label>
          <select
            value={formData.default_timezone}
            onChange={(e) => handleChange('default_timezone', e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-slate-800">
                {tz.name}
              </option>
            ))}
          </select>
          <p className="text-white/40 text-sm mt-2">
            Default timezone for appointments and reports
          </p>
        </div>

        {/* Default Currency */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Default Currency
          </label>
          <select
            value={formData.default_currency}
            onChange={(e) => handleChange('default_currency', e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code} className="bg-slate-800">
                {curr.name}
              </option>
            ))}
          </select>
          <p className="text-white/40 text-sm mt-2">
            Default currency for pricing and payments
          </p>
        </div>

        {/* Tax Rate */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Tax Rate (%)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.tax_rate}
              onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="100"
              className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 pr-8 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="7.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm">
              %
            </span>
          </div>
          <p className="text-white/40 text-sm mt-2">
            Default tax rate for invoices and payments
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <h4 className="text-white font-medium mb-3">Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Language:</span>
              <span className="text-white ml-2">
                {languages.find(l => l.code === formData.default_language)?.name}
              </span>
            </div>
            <div>
              <span className="text-white/60">Timezone:</span>
              <span className="text-white ml-2">
                {timezones.find(tz => tz.value === formData.default_timezone)?.name}
              </span>
            </div>
            <div>
              <span className="text-white/60">Currency:</span>
              <span className="text-white ml-2">
                {currencies.find(c => c.code === formData.default_currency)?.symbol} {formData.default_currency}
              </span>
            </div>
            <div>
              <span className="text-white/60">Tax Rate:</span>
              <span className="text-white ml-2">{formData.tax_rate}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
