'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Stethoscope,
  Package,
  Target,
  Zap,
  BriefcaseMedical,
  MessageSquare,
  Building2,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  LogOut,
  ShieldCheck, 
  Menu, 
  X as CloseIcon, 
  Camera,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  HelpCircle,
  CreditCard,
  Activity,
  Shield,
  Lock,
  Headphones,
  Megaphone,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import NotificationCenter from "@/components/ui/NotificationCenter";
import BranchSwitcher from "@/components/ui/BranchSwitcher";
import HelpModal from "@/components/ui/HelpModal";
import { useAuth } from '@/hooks/useAuth';
import Head from 'next/head';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const pathname = usePathname();
  const { getUserRole, getFullName, getClinicName, getClinicMetadata } = useAuth();
  const metadata = getClinicMetadata();

  // Handle window resize for mobile state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: ShieldCheck, label: 'System Admin', href: '/admin', roles: ['super_admin'] },
    { icon: Shield, label: 'Security Dashboard', href: '/admin/security', roles: ['super_admin'] },
    { icon: Users, label: 'User Management', href: '/admin/users', roles: ['super_admin'] },
    { icon: BarChart3, label: 'Analytics & Reports', href: '/admin/analytics', roles: ['super_admin'] },
    { icon: CreditCard, label: 'Subscription & Billing', href: '/admin/billing', roles: ['super_admin'] },
    { icon: Activity, label: 'System Monitoring', href: '/admin/system', roles: ['super_admin'] },
    { icon: Shield, label: 'Audit Trail', href: '/admin/audit', roles: ['super_admin'] },
    { icon: Lock, label: 'Permissions & Roles', href: '/admin/permissions', roles: ['super_admin'] },
    { icon: Headphones, label: 'Support Tickets', href: '/admin/support', roles: ['super_admin'] },
    { icon: Settings, label: 'Global Settings', href: '/admin/settings', roles: ['super_admin'] },
    { icon: Megaphone, label: 'Broadcast Messaging', href: '/admin/broadcast', roles: ['super_admin'] },
    { icon: Bell, label: 'Announcements', href: '/admin/announcements', roles: ['super_admin'] },
    { icon: LayoutDashboard, label: 'Clinic Overview', href: '/clinic', roles: ['clinic_owner', 'clinic_admin'] },
    { icon: LayoutDashboard, label: 'My Skin Portal', href: '/customer', roles: ['customer'] },
    { icon: Stethoscope, label: 'Clinical Node', href: '/beautician', roles: ['clinic_staff'] },
    { icon: ShoppingCart, label: 'Point of Sale (POS)', href: '/clinic/pos', roles: ['clinic_owner', 'clinic_admin', 'sales_staff'] },
    { icon: Target, label: 'Sales Intelligence', href: '/sales', roles: ['sales_staff'] },
    { icon: CalendarDays, label: 'Appointments', href: '/clinic/appointments', roles: ['clinic_owner', 'clinic_staff', 'sales_staff', 'customer'] },
    { icon: Sparkles, label: 'AI Skin Analysis', href: '/sales/analysis', roles: ['sales_staff'] },
    { icon: Camera, label: 'AR Simulator', href: '/sales/analysis', roles: ['sales_staff'] },
    {
      icon: Users,
      label: 'Staff Management',
      href: '/clinic/staff',
      roles: ['clinic_owner', 'clinic_admin']
    },
    {
      icon: Building2,
      label: 'Branches',
      href: '/clinic/branches',
      roles: ['clinic_owner', 'clinic_admin']
    },
    {
      icon: Package,
      label: 'Inventory Control',
      href: '/clinic/inventory',
      roles: ['clinic_owner', 'clinic_admin', 'clinic_staff']
    },
    { icon: BriefcaseMedical, label: 'Treatments & Protocol', href: '/clinic/treatments', roles: ['clinic_owner', 'clinic_staff'] },
    {
      icon: TrendingUp,
      label: 'Revenue & Sales',
      href: '/clinic/revenue',
      roles: ['clinic_owner', 'clinic_admin']
    },
    {
      icon: BarChart3,
      label: 'Business Reports',
      href: '/clinic/reports',
      roles: ['clinic_owner', 'clinic_admin']
    },
    {
      icon: Zap,
      label: 'AI Quota',
      href: '/clinic/quota',
      roles: ['clinic_owner', 'clinic_admin']
    },
    { icon: MessageSquare, label: 'Messaging Center', href: '/clinic/chat', roles: ['clinic_owner', 'clinic_staff', 'sales_staff', 'customer'] },
    { icon: Settings, label: 'Clinic Settings', href: '/clinic/settings', roles: ['clinic_owner'] },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden relative">
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        role={getUserRole()} 
      />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:relative z-[110] flex flex-col h-full bg-background/80 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 lg:transition-none",
          "lg:translate-x-0",
          !isMobileOpen && "max-lg:-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-premium flex-shrink-0 overflow-hidden">
            {metadata?.logo_url ? (
              <img src={metadata.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <AnimatePresence>
            {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-heading font-bold text-xl tracking-tight text-white whitespace-nowrap uppercase"
              >
                {getClinicName()}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto lg:hidden p-2 text-muted-foreground hover:text-white"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const userRole = getUserRole();
            
            if (item.roles && !item.roles.includes(userRole)) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-premium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
                {!isSidebarOpen && (typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group">
            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && <span className="font-medium text-sm">Logout Session</span>}
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary border border-white/10 items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform hidden lg:flex"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary hidden sm:block" />
              <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
                {getClinicName()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {['clinic_owner', 'clinic_admin'].includes(getUserRole()) && <BranchSwitcher />}
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-primary transition-all"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <NotificationCenter />
            <div className="h-8 w-px bg-white/5 mx-1 md:mx-2" />
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-black text-white">{getFullName()}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                {getUserRole().replace('_', ' ')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
