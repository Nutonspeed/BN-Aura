'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  House,
  Users,
  Gear,
  Stethoscope,
  Package,
  Target,
  Lightning,
  FirstAidKit,
  ChatCircle,
  Buildings,
  CalendarDots,
  Sparkle,
  CaretLeft,
  CaretDown,
  SignOut,
  ShieldCheck,
  List,
  X,
  ShoppingCart,
  TrendUp,
  ChartBar,
  Question,
  CreditCard,
  Shield,
  Bell,
  Star,
  Clock,
  VideoCamera,
  EnvelopeSimple,
  Phone,
  CurrencyDollar,
  Warning,
  UserCheck,
  Stack,
  Wallet,
  Globe
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import NotificationCenter from "@/components/ui/NotificationCenter";
import BranchSwitcher from "@/components/ui/BranchSwitcher";
import HelpModal from "@/components/ui/HelpModal";
// import DashboardFooter from "@/components/ui/DashboardFooter"; // Moved to individual pages as needed
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main', 'operations']);
  const pathname = usePathname();
  const { user, loading, getUserRole, getFullName, getClinicName, getClinicMetadata, signOut } = useAuth();
  const metadata = getClinicMetadata();
  const router = useRouter();
  
  // Route protection: redirect unauthorized users
  useEffect(() => {
    // Don't redirect while still loading session
    if (loading) return;
    
    const userRole = getUserRole();
    
    // Only redirect to login if no user or guest role
    if (!user || userRole === 'guest') {
      router.push('/login');
      return;
    }
    
    // Check specific route access permissions
    if (pathname.startsWith('/th/admin') && userRole !== 'super_admin') {
      router.push('/login');
      return;
    }
    
    if (pathname.startsWith('/th/clinic')) {
      // Allow shared routes for cross-role access
      const sharedRoutes = ['/th/clinic/pos', '/th/clinic/appointments', '/th/clinic/chat'];
      const isSharedRoute = sharedRoutes.some(route => pathname.startsWith(route));
      
      if (isSharedRoute) {
        const allowedRoles = ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'];
        // Appointments and Chat also allow customers
        if (pathname.startsWith('/th/clinic/appointments') || pathname.startsWith('/th/clinic/chat')) {
          allowedRoles.push('customer', 'premium_customer', 'free_customer');
        }
        if (!allowedRoles.includes(userRole)) {
          router.push('/login');
          return;
        }
      } else {
        // Restricted clinic routes
        if (!['clinic_owner', 'clinic_admin', 'clinic_staff'].includes(userRole)) {
          router.push('/login');
          return;
        }
      }
    }
    
    if (pathname.startsWith('/th/sales') && userRole !== 'sales_staff') {
      router.push('/login');
      return;
    }
    
    if (pathname.startsWith('/th/customer') && !['customer', 'premium_customer', 'free_customer', 'free_user'].includes(userRole)) {
      router.push('/login');
      return;
    }
    
    // Shared routes accessible by multiple roles
    if (pathname.startsWith('/th/shared/chat')) {
      const allowedRoles = ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'];
      if (!allowedRoles.includes(userRole)) {
        router.push('/login');
        return;
      }
    }
  }, [user, loading, getUserRole, pathname, router]);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle window resize for mobile state
  useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const menuGroups = [
    {
      id: 'main',
      label: 'หน้าหลัก',
      icon: House,
      roles: ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'free_user'],
      items: [
        { icon: House, label: 'Dashboard', href: '/clinic', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: House, label: 'My Skin Portal', href: '/customer', roles: ['customer', 'premium_customer', 'free_customer', 'free_user'] },
        { icon: Target, label: 'Sales Intelligence', href: '/sales', roles: ['sales_staff'] },
        { icon: Stethoscope, label: 'Clinical Node', href: '/beautician', roles: ['clinic_staff'] },
      ]
    },
    {
      id: 'operations',
      label: 'การดำเนินงาน',
      icon: Stack,
      roles: ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'],
      items: [
        { icon: ShoppingCart, label: 'POS ขาย', href: '/clinic/pos', roles: ['clinic_owner', 'clinic_admin', 'sales_staff'] },
        { icon: CalendarDots, label: 'นัดหมาย', href: '/clinic/appointments', roles: ['clinic_owner', 'clinic_staff', 'sales_staff', 'customer', 'free_user'] },
        { icon: Clock, label: 'คิว', href: '/clinic/queue', roles: ['clinic_owner', 'clinic_admin', 'clinic_staff'] },
        { icon: UserCheck, label: 'รายชื่อรอ', href: '/clinic/waitlist', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: FirstAidKit, label: 'ทรีทเมนต์', href: '/clinic/treatments', roles: ['clinic_owner', 'clinic_staff'] },
      ]
    },
    {
      id: 'crm',
      label: 'CRM & การตลาด',
      icon: Users,
      roles: ['clinic_owner', 'clinic_admin'],
      items: [
        { icon: ChatCircle, label: 'แชท', href: '/shared/chat', roles: ['clinic_owner', 'clinic_staff', 'sales_staff', 'customer', 'free_user'] },
        { icon: Phone, label: 'SMS', href: '/clinic/sms', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: EnvelopeSimple, label: 'Email', href: '/clinic/email-campaigns', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: VideoCamera, label: 'ปรึกษาออนไลน์', href: '/clinic/consultations', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: Star, label: 'รีวิว', href: '/clinic/reviews', roles: ['clinic_owner', 'clinic_admin'] },
      ]
    },
    {
      id: 'finance',
      label: 'การเงิน',
      icon: Wallet,
      roles: ['clinic_owner', 'clinic_admin'],
      items: [
        { icon: TrendUp, label: 'รายได้', href: '/clinic/revenue', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: CurrencyDollar, label: 'ค่าคอม', href: '/clinic/commissions', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: ChartBar, label: 'รายงาน', href: '/clinic/reports', roles: ['clinic_owner', 'clinic_admin'] },
      ]
    },
    {
      id: 'resources',
      label: 'ทรัพยากร',
      icon: Package,
      roles: ['clinic_owner', 'clinic_admin', 'clinic_staff'],
      items: [
        { icon: Users, label: 'พนักงาน', href: '/clinic/staff', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: Buildings, label: 'สาขา', href: '/clinic/branches', roles: ['clinic_owner', 'clinic_admin'] },
        { icon: Package, label: 'สินค้า', href: '/clinic/inventory', roles: ['clinic_owner', 'clinic_admin', 'clinic_staff'] },
        { icon: Warning, label: 'แจ้งเตือน', href: '/clinic/inventory/alerts', roles: ['clinic_owner', 'clinic_admin'] },
      ]
    },
    {
      id: 'settings',
      label: 'ตั้งค่า',
      icon: Gear,
      roles: ['clinic_owner'],
      items: [
        { icon: Gear, label: 'ทั่วไป', href: '/clinic/settings', roles: ['clinic_owner'] },
        { icon: Globe, label: 'เชื่อมต่อ', href: '/clinic/settings/integrations', roles: ['clinic_owner'] },
        { icon: Lightning, label: 'AI Quota', href: '/clinic/quota', roles: ['clinic_owner', 'clinic_admin'] },
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: ShieldCheck,
      roles: ['super_admin'],
      items: [
        { icon: ShieldCheck, label: 'Dashboard', href: '/admin', roles: ['super_admin'] },
        { icon: Users, label: 'Users', href: '/admin/users', roles: ['super_admin'] },
        { icon: Shield, label: 'Security', href: '/admin/security', roles: ['super_admin'] },
        { icon: ChartBar, label: 'Analytics', href: '/admin/analytics', roles: ['super_admin'] },
        { icon: CreditCard, label: 'Billing', href: '/admin/billing', roles: ['super_admin'] },
        { icon: Gear, label: 'Gear', href: '/admin/settings', roles: ['super_admin'] },
      ]
    },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
          x: isMobileOpen ? 0 : (isClient && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:relative z-[110] flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-border backdrop-blur-xl flex-shrink-0",
          "lg:translate-x-0",
          !isMobileOpen && "max-lg:-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-4 gap-3 flex-shrink-0 border-b border-sidebar-foreground/10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
            {metadata?.logo_url ? (
              <img src={metadata.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Sparkle weight="fill" className="w-5 h-5 text-white" />
            )}
          </div>
          <AnimatePresence>
            {(isSidebarOpen || (isClient && window.innerWidth < 1024)) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col min-w-0 flex-1"
              >
                <span className="font-bold text-lg text-white whitespace-nowrap truncate">
                  {getClinicName()}
                </span>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Clinical Node</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => {
            const userRole = getUserRole();
            if (!group.roles.includes(userRole)) return null;
            
            const visibleItems = group.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;
            
            const isExpanded = expandedGroups.includes(group.id);
            const hasActiveItem = visibleItems.some(item => 
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            );

            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                    hasActiveItem 
                      ? "bg-white/5 text-primary shadow-sm" 
                      : "text-sidebar-foreground/50 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <group.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    hasActiveItem ? "text-primary" : "text-inherit"
                  )} />
                  {(isSidebarOpen || (isClient && window.innerWidth < 1024)) && (
                    <>
                      <span className="font-bold text-[11px] uppercase tracking-widest flex-1 text-left">{group.label}</span>
                      <CaretDown className={cn(
                        "w-3.5 h-3.5 transition-transform duration-300",
                        isExpanded ? "rotate-180" : ""
                      )} />
                    </>
                  )}
                </button>

                {/* Group Items */}
                <AnimatePresence>
                  {isExpanded && (isSidebarOpen || (isClient && window.innerWidth < 1024)) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-1 space-y-1 border-l border-white/5 ml-6">
                        {visibleItems.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
                                isActive 
                                  ? "bg-primary text-white shadow-premium" 
                                  : "text-sidebar-foreground/40 hover:text-white hover:bg-white/[0.02]"
                              )}
                            >
                              <item.icon className={cn(
                                "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-white" : "text-inherit"
                              )} />
                              <span className="text-sm font-medium">{item.label}</span>
                              {isActive && (
                                <motion.div 
                                  layoutId="active-indicator"
                                  className="absolute -left-[17px] w-1 h-6 bg-primary rounded-r-full"
                                />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-foreground/10 flex-shrink-0">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group"
          >
            <SignOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            {(isSidebarOpen || (isClient && window.innerWidth < 1024)) && <span className="font-medium text-sm">Logout Session</span>}
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary border border-border items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform hidden lg:flex"
        >
          <CaretLeft className={cn("w-4 h-4 transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-accent transition-all"
            >
              <List className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-xl border border-border">
              <Buildings weight="duotone" className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide truncate max-w-[180px]">
                {getClinicName()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
              {['clinic_owner', 'clinic_admin'].includes(getUserRole()) && <BranchSwitcher />}
              <ThemeToggle />
            </div>
            
            <div className="h-6 w-px bg-border hidden md:block" />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="p-2 bg-secondary border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"
              >
                <Question className="w-4 h-4" />
              </button>
              <NotificationCenter />
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-foreground">{getFullName()}</span>
                <span className="text-xs text-primary font-medium uppercase">
                  {getUserRole().replace('_', ' ')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary">
                <Users weight="duotone" className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
