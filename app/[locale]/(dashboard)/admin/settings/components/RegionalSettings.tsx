'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe,
  Clock,
  CurrencyDollar,
  CalendarDots,
  Translate
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
    tax_rate: 7,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        default_language: settings.default_language || 'th',
        default_timezone: settings.default_timezone || 'Asia/Bangkok',
        default_currency: settings.default_currency || 'THB',
        tax_rate: settings.tax_rate || 7,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string | number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const languages = [
    { value: 'th', label: 'Thai' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
  ];

  const timezones = [
    { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
  ];

  const currencies = [
    { value: 'THB', label: 'Thai Baht (฿)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'SGD', label: 'Singapore Dollar (S$)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden">
        <CardHeader className="p-10 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Globe weight="duotone" className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Regional Matrix</CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Localization & regional protocol settings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Primary Language Node</label>
              <div className="relative">
                <Translate weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                <select
                  value={formData.default_language}
                  onChange={(e) => handleChange('default_language', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary appearance-none font-bold"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Temporal Zone</label>
              <div className="relative">
                <Clock weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                <select
                  value={formData.default_timezone}
                  onChange={(e) => handleChange('default_timezone', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary appearance-none font-bold"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Currency Protocol</label>
              <div className="relative">
                <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                <select
                  value={formData.default_currency}
                  onChange={(e) => handleChange('default_currency', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary appearance-none font-bold"
                >
                  {currencies.map((curr) => (
                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Tax Rate (%)</label>
              <div className="relative">
                <CalendarDots weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tax_rate}
                  onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary font-bold tabular-nums"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
