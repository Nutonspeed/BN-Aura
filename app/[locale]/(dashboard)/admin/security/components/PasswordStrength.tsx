'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Info, CheckCircle, WarningCircle, Pulse, LockKey, Sparkle } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  score: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export default function PasswordStrength({ score, requirements }: PasswordStrengthProps) {
  const getStrengthLabel = () => {
    if (score >= 4) return { label: 'CRITICAL_SECURITY', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 3) return { label: 'ENHANCED_PARITY', color: 'text-primary', bg: 'bg-primary/10' };
    if (score >= 2) return { label: 'NOMINAL_ACCESS', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'VULNERABLE_NODE', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const strength = getStrengthLabel();

  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <LockKey weight="fill" className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
            <ShieldCheck weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Identity Encryption</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Neural password complexity matrix</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 md:p-10 space-y-10 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", strength.color)}>{strength.label}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Level {score}/4</span>
          </div>
          
          <div className="flex gap-2.5 h-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 bg-secondary rounded-full overflow-hidden p-0.5 border border-border/30 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i < score ? '100%' : '0%' }}
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    score >= 4 ? 'bg-emerald-500' : 
                    score >= 3 ? 'bg-primary' : 
                    score >= 2 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Protocol Requirements</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'length', label: 'Minimum 12 Nodes' },
              { key: 'uppercase', label: 'Alpha Upper Node' },
              { key: 'lowercase', label: 'Alpha Lower Node' },
              { key: 'number', label: 'Numeric Registry' },
              { key: 'special', label: 'Symbolic Encryption' }
            ].map((req) => {
              const isMet = requirements[req.key as keyof typeof requirements];
              return (
                <div 
                  key={req.key}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500",
                    isMet ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-secondary/20 border-border/50 text-muted-foreground opacity-60"
                  )}
                >
                  {isMet ? (
                    <CheckCircle weight="fill" className="w-4 h-4 shadow-glow-sm" />
                  ) : (
                    <WarningCircle weight="bold" className="w-4 h-4" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">{req.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-primary/5 rounded-[32px] border border-primary/10 flex gap-4 relative overflow-hidden group/tip">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/tip:scale-110 transition-transform">
            <Sparkle weight="fill" className="w-16 h-16 text-primary" />
          </div>
          <Info weight="duotone" className="w-5 h-5 text-primary flex-shrink-0 relative z-10" />
          <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed relative z-10 uppercase tracking-widest">
            Encryption standards require cyclic identity updates every 90 planetary rotations to maintain global node integrity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}