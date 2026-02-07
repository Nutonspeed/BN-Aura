'use client';

import { motion } from 'framer-motion';
import { 
  Buildings,
  Globe,
  Lightning,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Sparkle,
  HardDrive,
  PuzzlePiece,
  CaretRight,
  Monitor
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '../context';

const navigationSections = [
  {
    id: 'company',
    label: 'Company Info',
    icon: Buildings,
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
    icon: Lightning,
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
    icon: Bell,
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
    icon: HardDrive,
    description: 'File storage and upload settings'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: PuzzlePiece,
    description: 'Third-party service integrations'
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: Monitor,
    description: 'System performance and health monitoring'
  }
];

export default function SettingsNavigation() {
  const { activeSection, setActiveSection } = useSettingsContext();

  return (
    <div className="space-y-2">
      {navigationSections.map((item, i) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => setActiveSection(item.id)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative overflow-hidden",
            activeSection === item.id
              ? "bg-primary text-primary-foreground shadow-premium"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {activeSection === item.id && (
            <motion.div 
              layoutId="nav-active-glow"
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
            />
          )}
          <div className="flex items-center gap-4 relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner",
              activeSection === item.id ? "bg-white/20" : "bg-secondary border border-border/50 group-hover:border-primary/20"
            )}>
              <item.icon weight={activeSection === item.id ? "fill" : "duotone"} className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
          </div>
          <CaretRight 
            weight="bold" 
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-500",
              activeSection === item.id ? "translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            )} 
          />
        </motion.button>
      ))}
    </div>
  );
}