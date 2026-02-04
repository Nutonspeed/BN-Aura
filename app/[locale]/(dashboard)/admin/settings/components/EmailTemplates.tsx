'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloppyDisk, Eye, PaperPlaneTilt, Plus, Trash, PencilSimple, EnvelopeSimple, Code, FileText, User, CalendarDots, CurrencyDollar, WarningCircle } from '@phosphor-icons/react';
import { useSettingsContext } from '../context';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'notification' | 'system';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailTemplatesProps {
  onSettingsChange?: (updates: any) => void;
}

const defaultTemplates: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to BN-Aura! Let\'s get started',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to BN-Aura, {{user_name}}!</h1>
        <p>Thank you for joining us. Your account is now ready to use.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Account Details:</h3>
          <p>Email: {{user_email}}</p>
          <p>Plan: {{subscription_plan}}</p>
          <p>Clinic: {{clinic_name}}</p>
        </div>
        <a href="{{login_url}}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Get Started
        </a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          © 2026 BN-Aura. All rights reserved.
        </p>
      </div>
    `,
    text_content: `Welcome to BN-Aura, {{user_name}}!

Thank you for joining us. Your account is now ready to use.

Account Details:
Email: {{user_email}}
Plan: {{subscription_plan}}
Clinic: {{clinic_name}}

Get started here: {{login_url}}

© 2026 BN-Aura. All rights reserved.`,
    variables: ['user_name', 'user_email', 'subscription_plan', 'clinic_name', 'login_url'],
    category: 'transactional',
    is_active: true
  },
  {
    name: 'Invoice Reminder',
    subject: 'Invoice #{{invoice_number}} - Payment Due',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Invoice Reminder</h1>
        <p>Hi {{user_name}},</p>
        <p>This is a reminder that your invoice is due for payment.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p>Invoice Number: {{invoice_number}}</p>
          <p>Amount: {{amount}}</p>
          <p>Due Date: {{due_date}}</p>
          <p>Status: {{status}}</p>
        </div>
        <a href="{{payment_url}}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Pay Now
        </a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          © 2026 BN-Aura. All rights reserved.
        </p>
      </div>
    `,
    text_content: `Invoice Reminder

Hi {{user_name}},

This is a reminder that your invoice is due for payment.

Invoice Details:
Invoice Number: {{invoice_number}}
Amount: {{amount}}
Due Date: {{due_date}}
Status: {{status}}

Pay here: {{payment_url}}

© 2026 BN-Aura. All rights reserved.`,
    variables: ['user_name', 'invoice_number', 'amount', 'due_date', 'status', 'payment_url'],
    category: 'transactional',
    is_active: true
  },
  {
    name: 'Password Reset',
    subject: 'Reset your BN-Aura password',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Password Reset Request</h1>
        <p>Hi {{user_name}},</p>
        <p>We received a request to reset your password. Click the button below to reset it.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #ef4444;"><strong>This link will expire in 1 hour.</strong></p>
        </div>
        <a href="{{reset_url}}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          If you didn't request this, please ignore this email.
          © 2026 BN-Aura. All rights reserved.
        </p>
      </div>
    `,
    text_content: `Password Reset Request

Hi {{user_name}},

We received a request to reset your password. Click the link below to reset it.

This link will expire in 1 hour.

Reset password: {{reset_url}}

If you didn't request this, please ignore this email.
© 2026 BN-Aura. All rights reserved.`,
    variables: ['user_name', 'reset_url'],
    category: 'system',
    is_active: true
  }
];

export default function EmailTemplates({ onSettingsChange }: EmailTemplatesProps) {
  const { settings, updateSettings, loading } = useSettingsContext();
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      ...defaultTemplates[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'invoice',
      ...defaultTemplates[1],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'password_reset',
      ...defaultTemplates[2],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>('html');
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);

  const categories = [
    { value: 'transactional', label: 'Transactional', icon: DollarSign, color: 'text-blue-400' },
    { value: 'marketing', label: 'Marketing', icon: Mail, color: 'text-purple-400' },
    { value: 'notification', label: 'Notification', icon: AlertCircle, color: 'text-yellow-400' },
    { value: 'system', label: 'System', icon: Code, color: 'text-green-400' }
  ];

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id 
        ? { ...editingTemplate, updated_at: new Date().toISOString() }
        : t
    ));
    
    setEditingTemplate(null);
    
    // TODO: Save to backend
    console.log('Template saved:', editingTemplate);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) return;
    
    // TODO: Send test email
    console.log('Sending test email:', {
      to: testEmail,
      template: selectedTemplate
    });
    
    alert(`Test email sent to ${testEmail}`);
    setShowTestDialog(false);
    setTestEmail('');
  };

  const renderPreview = (content: string) => {
    let preview = content;
    if (selectedTemplate) {
      selectedTemplate.variables.forEach(variable => {
        const value = {
          user_name: 'John Doe',
          user_email: 'john@example.com',
          subscription_plan: 'Professional',
          clinic_name: 'Test Clinic',
          login_url: 'https://app.bnaura.com/login',
          invoice_number: 'INV-001',
          amount: '฿4,900',
          due_date: '2026-02-15',
          status: 'Pending',
          payment_url: 'https://app.bnaura.com/pay/INV-001',
          reset_url: 'https://app.bnaura.com/reset/abc123'
        }[variable] || `[${variable}]`;
        preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
    }
    return { __html: preview };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Mail className="w-6 h-6 text-primary" />
          Email Templates
        </h2>
        <button
          onClick={() => {
            const newTemplate: EmailTemplate = {
              id: `template_${Date.now()}`,
              name: 'New Template',
              subject: '',
              html_content: '',
              text_content: '',
              variables: [],
              category: 'transactional',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setTemplates(prev => [...prev, newTemplate]);
            setEditingTemplate(newTemplate);
            setSelectedTemplate(newTemplate);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">Templates</h3>
          
          {categories.map(category => (
            <div key={category.value} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <category.icon className={`w-4 h-4 ${category.color}`} />
                <span className="text-white/80 text-sm font-medium">{category.label}</span>
              </div>
              {templates
                .filter(t => t.category === category.value)
                .map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setEditingTemplate(null);
                      setActiveTab('html');
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                      selectedTemplate?.id === template.id
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs opacity-70 truncate">{template.subject}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(template);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="p-1 hover:bg-red-400/10 rounded text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="glass-card p-6 rounded-xl border border-white/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  {editingTemplate ? (
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="text-xl font-bold text-white bg-white/10 border border-white/10 rounded px-3 py-1 w-full"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingTemplate ? (
                    <>
                      <button
                        onClick={handleSaveTemplate}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(null);
                          setSelectedTemplate(templates.find(t => t.id === selectedTemplate.id) || null);
                        }}
                        className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingTemplate(selectedTemplate)}
                        className="p-2 text-white/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowTestDialog(true)}
                        className="p-2 text-white/60 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-1">Subject</label>
                {editingTemplate ? (
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  />
                ) : (
                  <p className="text-white/80">{selectedTemplate.subject}</p>
                )}
              </div>

              {/* Variables */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-1">Available Variables</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(variable => (
                    <span
                      key={variable}
                      className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                    >
                      {'{' + '{' + variable + '}' + '}'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-white/10">
                {[
                  { key: 'html', label: 'HTML', icon: Code },
                  { key: 'text', label: 'Text', icon: FileText },
                  { key: 'preview', label: 'Preview', icon: Eye }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="min-h-[400px]">
                {activeTab === 'html' && (
                  editingTemplate ? (
                    <textarea
                      value={editingTemplate.html_content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                      className="w-full h-[400px] bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white font-mono text-sm"
                      placeholder="HTML content..."
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 h-[400px] overflow-auto">
                      <pre className="text-white/80 text-sm font-mono whitespace-pre-wrap">
                        {selectedTemplate.html_content}
                      </pre>
                    </div>
                  )
                )}

                {activeTab === 'text' && (
                  editingTemplate ? (
                    <textarea
                      value={editingTemplate.text_content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, text_content: e.target.value })}
                      className="w-full h-[400px] bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white font-mono text-sm"
                      placeholder="Plain text content..."
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 h-[400px] overflow-auto">
                      <pre className="text-white/80 text-sm font-mono whitespace-pre-wrap">
                        {selectedTemplate.text_content}
                      </pre>
                    </div>
                  )
                )}

                {activeTab === 'preview' && (
                  <div className="bg-white rounded-lg p-4 h-[400px] overflow-auto">
                    <div dangerouslySetInnerHTML={renderPreview(selectedTemplate.html_content)} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl border border-white/10 text-center">
              <Mail className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select a template</h3>
              <p className="text-white/60">Choose a template from the list to view or edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Email Dialog */}
      {showTestDialog && selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Send Test Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white"
                  placeholder="test@example.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSendTest}
                  disabled={!testEmail}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Send Test
                </button>
                <button
                  onClick={() => {
                    setShowTestDialog(false);
                    setTestEmail('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
