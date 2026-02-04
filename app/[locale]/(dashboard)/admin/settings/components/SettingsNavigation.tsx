'use client';

import { motion } from 'framer-motion';
import { 
  Buildings, 
  Globe, 
  Lightning, 
  EnvelopeSimple, 
  Shield, 
  CreditCard, 
  Palette,
  Database
} from '@phosphor-icons/react';
import { useSettingsContext } from '../context';

const navigationSections = [
  {
    id: 'company',
    label: 'Company Info',
    icon: Building2,
    description: 'Basic company information and branding'
  },
  {
    id: 'regional',
    label: 'Regional Settings',
    icon: Globe,
    description: 'Language, timezone, and currency settings'
  },
  {
    id: 'features',
    label: 'Feature Flags',
    icon: Zap,
    description: 'Enable or disable system features'
  },
  {
    id: 'ai',
    label: 'AI Configuration',
    icon: Palette,
    description: 'AI models and analysis settings'
  },
  {
    id: 'email',
    label: 'Email Settings',
    icon: Mail,
    description: 'SMTP configuration and templates'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Authentication and access control'
  },
  {
    id: 'subscriptions',
    label: 'Subscription Plans',
    icon: CreditCard,
    description: 'Pricing and plan configuration'
  },
  {
    id: 'storage',
    label: 'Storage & Files',
    icon: Database,
    description: 'File storage and upload settings'
  }
];

export default function SettingsNavigation() {
  const { activeSection, setActiveSection } = useSettingsContext();

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10">
      <h2 className="text-lg font-bold text-white mb-4">Settings Categories</h2>
      
      <div className="space-y-2">
        {navigationSections.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <section.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              activeSection === section.id ? 'text-primary-foreground' : 'text-primary'
            }`} />
            <div>
              <h3 className="font-medium mb-1">{section.label}</h3>
              <p className={`text-sm ${
                activeSection === section.id ? 'text-primary-foreground/70' : 'text-white/50'
              }`}>
                {section.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
