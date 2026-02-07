'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  GithubLogo,
  Globe,
  ShieldCheck,
  Question
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function DashboardFooter() {
  const t = useTranslations('navigation');
  const currentYear = new Date().getFullYear();
  const version = "0.1.0"; // From package.json

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-md px-6 py-4 transition-all duration-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Copyright & Version */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} <span className="font-semibold text-foreground">BN-Aura</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            <span className="px-1.5 py-0.5 rounded bg-secondary border border-border">v{version}</span>
            <span>Premium Aesthetic Intelligence</span>
          </div>
        </div>

        {/* Quick Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <Link 
            href="/clinic/settings" 
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy
          </Link>
          <Link 
            href="#" 
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            Terms
          </Link>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-help'))}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Question className="w-3.5 h-3.5" />
            Support
          </button>
        </nav>

        {/* Social/External Links */}
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com/Nutonspeed/BN-Aura" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            title="GitHub Repository"
          >
            <GithubLogo className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}