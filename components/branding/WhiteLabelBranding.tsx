'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Palette, Upload, Save, RefreshCw, Eye,
  Facebook, Instagram, Globe, Phone, Mail
} from 'lucide-react';
import { ThemeConfig, BrandingConfig, presetThemes, saveClinicTheme } from '@/lib/theme/themeConfig';

interface Props {
  clinicId: string;
  currentTheme?: ThemeConfig;
  onSave?: (theme: ThemeConfig) => void;
}

export function WhiteLabelBranding({ clinicId, currentTheme, onSave }: Props) {
  const [theme, setTheme] = useState<ThemeConfig>(currentTheme || presetThemes[0]);
  const [branding, setBranding] = useState<BrandingConfig>(currentTheme?.branding || {});
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (mode: 'light' | 'dark', key: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: { ...prev.colors[mode], [key]: value },
      },
    }));
  };

  const handleBrandingChange = (key: keyof BrandingConfig, value: string) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedTheme = { ...theme, branding };
    
    const success = await saveClinicTheme(clinicId, updatedTheme);
    if (success) {
      onSave?.(updatedTheme);
    }
    setIsSaving(false);
  };

  const handlePresetSelect = (preset: ThemeConfig) => {
    setTheme({ ...preset, branding });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette size={24} />
            White-Label Branding
          </h2>
          <p className="text-muted-foreground">ปรับแต่งแบรนด์คลินิกของคุณ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye size={16} className="mr-2" />
            {previewMode ? 'แก้ไข' : 'ดูตัวอย่าง'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลแบรนด์</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ชื่อแอป</label>
              <Input
                value={branding.appName || ''}
                onChange={(e) => handleBrandingChange('appName', e.target.value)}
                placeholder="ชื่อคลินิกของคุณ"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tagline</label>
              <Input
                value={branding.tagline || ''}
                onChange={(e) => handleBrandingChange('tagline', e.target.value)}
                placeholder="สโลแกน"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Mail size={14} /> อีเมล
                </label>
                <Input
                  value={branding.contactEmail || ''}
                  onChange={(e) => handleBrandingChange('contactEmail', e.target.value)}
                  placeholder="contact@clinic.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Phone size={14} /> โทรศัพท์
                </label>
                <Input
                  value={branding.contactPhone || ''}
                  onChange={(e) => handleBrandingChange('contactPhone', e.target.value)}
                  placeholder="02-xxx-xxxx"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Logo URL</label>
              <Input
                value={branding.logo || ''}
                onChange={(e) => handleBrandingChange('logo', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>สีหลัก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Themes */}
            <div>
              <label className="text-sm font-medium mb-2 block">ธีมสำเร็จรูป</label>
              <div className="flex gap-2">
                {presetThemes.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      theme.id === preset.id ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${preset.colors.light.primary}, ${preset.colors.light.accent})` }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Primary</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.light.primary}
                    onChange={(e) => handleColorChange('light', 'primary', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.colors.light.primary}
                    onChange={(e) => handleColorChange('light', 'primary', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.light.accent}
                    onChange={(e) => handleColorChange('light', 'accent', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.colors.light.accent}
                    onChange={(e) => handleColorChange('light', 'accent', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="text-sm font-medium mb-2 block">ขอบมุม</label>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as const).map((r) => (
                  <Button
                    key={r}
                    variant={theme.borderRadius === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(prev => ({ ...prev, borderRadius: r }))}
                  >
                    {r === 'sm' ? 'เหลี่ยม' : r === 'md' ? 'ปานกลาง' : 'มน'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>ตัวอย่าง</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg"
              style={{ 
                background: theme.colors.light.background,
                color: theme.colors.light.foreground,
              }}
            >
              <div 
                className="p-4 rounded-lg mb-4"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.light.primary}, ${theme.colors.light.accent})`,
                  borderRadius: theme.borderRadius === 'sm' ? '4px' : theme.borderRadius === 'md' ? '8px' : '12px',
                }}
              >
                <h3 className="text-white text-xl font-bold">{branding.appName || 'ชื่อคลินิก'}</h3>
                <p className="text-white/80">{branding.tagline || 'สโลแกนของคุณ'}</p>
              </div>
              <button
                className="px-6 py-2 text-white font-medium"
                style={{ 
                  background: theme.colors.light.primary,
                  borderRadius: theme.borderRadius === 'sm' ? '4px' : theme.borderRadius === 'md' ? '8px' : '12px',
                }}
              >
                ปุ่มตัวอย่าง
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WhiteLabelBranding;
