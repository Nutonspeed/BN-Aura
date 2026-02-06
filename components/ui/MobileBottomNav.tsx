'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home,
  Camera,
  Users,
  BarChart3,
  User,
  MessageCircle,
  Calendar,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MobileBottomNavProps {
  role: 'sales' | 'clinic' | 'beautician' | 'customer';
  locale?: string;
}

const navConfig: Record<string, NavItem[]> = {
  sales: [
    { href: '/sales', icon: <Home size={20} />, label: 'หน้าหลัก' },
    { href: '/sales/ai-analysis', icon: <Camera size={20} />, label: 'สแกน' },
    { href: '/sales/customers', icon: <Users size={20} />, label: 'ลูกค้า' },
    { href: '/shared/chat', icon: <MessageCircle size={20} />, label: 'แชท', badge: 3 },
    { href: '/sales/profile', icon: <User size={20} />, label: 'โปรไฟล์' },
  ],
  clinic: [
    { href: '/clinic', icon: <Home size={20} />, label: 'Dashboard' },
    { href: '/clinic/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { href: '/clinic/staff', icon: <Users size={20} />, label: 'Staff' },
    { href: '/clinic/appointments', icon: <Calendar size={20} />, label: 'Booking' },
    { href: '/clinic/settings', icon: <Settings size={20} />, label: 'Settings' },
  ],
  beautician: [
    { href: '/beautician', icon: <Home size={20} />, label: 'หน้าหลัก' },
    { href: '/beautician/appointments', icon: <Calendar size={20} />, label: 'นัดหมาย' },
    { href: '/beautician/customers', icon: <Users size={20} />, label: 'ลูกค้า' },
    { href: '/shared/chat', icon: <MessageCircle size={20} />, label: 'แชท' },
    { href: '/beautician/profile', icon: <User size={20} />, label: 'โปรไฟล์' },
  ],
  customer: [
    { href: '/customer', icon: <Home size={20} />, label: 'หน้าหลัก' },
    { href: '/customer/analysis', icon: <Camera size={20} />, label: 'วิเคราะห์' },
    { href: '/customer/treatments', icon: <Calendar size={20} />, label: 'Treatment' },
    { href: '/shared/chat', icon: <MessageCircle size={20} />, label: 'แชท' },
    { href: '/customer/profile', icon: <User size={20} />, label: 'โปรไฟล์' },
  ],
};

export default function MobileBottomNav({ role, locale = 'th' }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = navConfig[role] || navConfig.sales;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/');
          
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative',
                'transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-1',
                isActive ? 'font-medium' : ''
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
