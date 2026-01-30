'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Sparkles, 
  ChevronLeft, 
  BriefcaseMedical,
  MessageSquare,
  Building2,
  CalendarDays,
  Target
} from 'lucide-react';
import { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/clinic' },
    { icon: CalendarDays, label: 'Appointments', href: '/clinic/appointments' },
    { icon: Sparkles, label: 'AI Skin Analysis', href: '/analysis' },
    { icon: Target, label: 'Sales CRM', href: '/sales' },
    { icon: Users, label: 'Staff Management', href: '/clinic/staff' },
    { icon: BriefcaseMedical, label: 'Treatments', href: '/clinic/treatments' },
    { icon: MessageSquare, label: 'AI Chat Advisor', href: '/clinic/chat' },
    { icon: Settings, label: 'Settings', href: '/clinic/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 flex flex-col bg-white/5 border-r border-white/10 backdrop-blur-xl"
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-premium flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-heading font-bold text-xl tracking-tight text-white whitespace-nowrap uppercase"
              >
                BN-Aura
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-premium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group">
            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary border border-white/10 flex items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-light text-muted-foreground uppercase tracking-widest">
              Bangkok Premium Clinic
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium text-white">Dr. Aesthetic</span>
              <span className="text-xs text-muted-foreground">Clinic Owner</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
