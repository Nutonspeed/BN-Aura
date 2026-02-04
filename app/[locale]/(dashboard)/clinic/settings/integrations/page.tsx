'use client';

import { useState, useEffect } from 'react';
import { Settings, Phone, Mail, MessageCircle, Check, X, Eye, EyeOff, Save } from 'lucide-react';

interface Integration {
  id?: string;
  platform: string;
  is_active: boolean;
  account_name?: string;
  connected_at?: string;
  settings?: Record<string, string>;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [twilioConfig, setTwilioConfig] = useState({ accountSid: '', authToken: '', phoneNumber: '' });
  const [sendgridConfig, setSendgridConfig] = useState({ apiKey: '', fromEmail: '', fromName: '' });
  const [lineConfig, setLineConfig] = useState({ channelAccessToken: '', channelSecret: '' });

  useEffect(() => { fetchIntegrations(); }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/social/integrations');
      const data = await res.json();
      setIntegrations(data.integrations || []);

      // Load existing configs
      for (const int of data.integrations || []) {
        if (int.platform === 'twilio' && int.settings) {
          setTwilioConfig(int.settings as typeof twilioConfig);
        }
        if (int.platform === 'sendgrid' && int.settings) {
          setSendgridConfig(int.settings as typeof sendgridConfig);
        }
        if (int.platform === 'line' && int.settings) {
          setLineConfig(prev => ({ ...prev, channelSecret: (int.settings as { channelSecret?: string })?.channelSecret || '' }));
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveIntegration = async (platform: string, settings: Record<string, string>) => {
    setSaving(platform);
    try {
      await fetch('/api/social/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          settings,
          accountName: platform === 'twilio' ? settings.phoneNumber : platform === 'sendgrid' ? settings.fromEmail : 'LINE Bot'
        })
      });
      fetchIntegrations();
    } catch (e) { console.error(e); }
    setSaving(null);
  };

  const disconnectIntegration = async (platform: string) => {
    if (!confirm('ยืนยันการยกเลิกการเชื่อมต่อ?')) return;
    await fetch(`/api/social/integrations?platform=${platform}`, { method: 'DELETE' });
    fetchIntegrations();
  };

  const isConnected = (platform: string) => integrations.some(i => i.platform === platform && i.is_active);

  const toggleSecret = (key: string) => setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const maskValue = (value: string) => value ? '•'.repeat(Math.min(value.length, 20)) : '';

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" /> Integrations
        </h1>
        <p className="text-gray-600">เชื่อมต่อบริการภายนอก (SMS, Email, LINE)</p>
      </div>

      <div className="space-y-6">
        {/* Twilio SMS */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold">Twilio SMS</h3>
                <p className="text-sm text-gray-500">ส่ง SMS และรับข้อความตอบกลับ</p>
              </div>
            </div>
            {isConnected('twilio') ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="text-gray-400 text-sm">ยังไม่เชื่อมต่อ</span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Account SID</label>
              <input
                type="text"
                value={twilioConfig.accountSid}
                onChange={e => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Auth Token</label>
              <div className="relative">
                <input
                  type={showSecrets.twilioAuth ? 'text' : 'password'}
                  value={twilioConfig.authToken}
                  onChange={e => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <button onClick={() => toggleSecret('twilioAuth')} className="absolute right-3 top-2.5 text-gray-400">
                  {showSecrets.twilioAuth ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={twilioConfig.phoneNumber}
                onChange={e => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="+1234567890"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => saveIntegration('twilio', twilioConfig)}
                disabled={saving === 'twilio' || !twilioConfig.accountSid}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving === 'twilio' ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              {isConnected('twilio') && (
                <button onClick={() => disconnectIntegration('twilio')} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  ยกเลิกการเชื่อมต่อ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SendGrid Email */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold">SendGrid Email</h3>
                <p className="text-sm text-gray-500">ส่งอีเมลแคมเปญและแจ้งเตือน</p>
              </div>
            </div>
            {isConnected('sendgrid') ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="text-gray-400 text-sm">ยังไม่เชื่อมต่อ</span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showSecrets.sendgridKey ? 'text' : 'password'}
                  value={sendgridConfig.apiKey}
                  onChange={e => setSendgridConfig({ ...sendgridConfig, apiKey: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <button onClick={() => toggleSecret('sendgridKey')} className="absolute right-3 top-2.5 text-gray-400">
                  {showSecrets.sendgridKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">From Email</label>
                <input
                  type="email"
                  value={sendgridConfig.fromEmail}
                  onChange={e => setSendgridConfig({ ...sendgridConfig, fromEmail: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="noreply@clinic.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From Name</label>
                <input
                  type="text"
                  value={sendgridConfig.fromName}
                  onChange={e => setSendgridConfig({ ...sendgridConfig, fromName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="My Clinic"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => saveIntegration('sendgrid', sendgridConfig)}
                disabled={saving === 'sendgrid' || !sendgridConfig.apiKey}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving === 'sendgrid' ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              {isConnected('sendgrid') && (
                <button onClick={() => disconnectIntegration('sendgrid')} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  ยกเลิกการเชื่อมต่อ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LINE */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold">LINE Official Account</h3>
                <p className="text-sm text-gray-500">รับจองและแชทผ่าน LINE</p>
              </div>
            </div>
            {isConnected('line') ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="text-gray-400 text-sm">ยังไม่เชื่อมต่อ</span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Channel Access Token</label>
              <div className="relative">
                <input
                  type={showSecrets.lineToken ? 'text' : 'password'}
                  value={lineConfig.channelAccessToken}
                  onChange={e => setLineConfig({ ...lineConfig, channelAccessToken: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  placeholder="Long-lived channel access token"
                />
                <button onClick={() => toggleSecret('lineToken')} className="absolute right-3 top-2.5 text-gray-400">
                  {showSecrets.lineToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel Secret</label>
              <div className="relative">
                <input
                  type={showSecrets.lineSecret ? 'text' : 'password'}
                  value={lineConfig.channelSecret}
                  onChange={e => setLineConfig({ ...lineConfig, channelSecret: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <button onClick={() => toggleSecret('lineSecret')} className="absolute right-3 top-2.5 text-gray-400">
                  {showSecrets.lineSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Webhook URL:</p>
              <code className="text-indigo-600">https://bn-aura.vercel.app/api/webhooks/line</code>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => saveIntegration('line', { ...lineConfig, accessToken: lineConfig.channelAccessToken })}
                disabled={saving === 'line' || !lineConfig.channelAccessToken}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving === 'line' ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              {isConnected('line') && (
                <button onClick={() => disconnectIntegration('line')} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  ยกเลิกการเชื่อมต่อ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
