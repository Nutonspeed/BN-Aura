'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  MoreVertical,
} from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  showSearch?: boolean;
  onSearch?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  showMenu = false,
  onMenuClick,
  showNotifications = false,
  notificationCount = 0,
  showSearch = false,
  onSearch,
  actions,
  className,
}: MobileHeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 bg-background border-b md:hidden',
      className
    )}>
      {/* Safe area for iOS notch */}
      <div className="h-safe-area-inset-top bg-background" />
      
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={onBack || (() => window.history.back())}
            >
              <ChevronLeft size={24} />
            </Button>
          )}
          
          {showMenu && !showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={onMenuClick}
            >
              <Menu size={24} />
            </Button>
          )}
          
          <div className="flex flex-col">
            <h1 className="font-semibold text-base leading-tight truncate max-w-[180px]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onSearch}
            >
              <Search size={20} />
            </Button>
          )}
          
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          )}
          
          {actions}
        </div>
      </div>
    </header>
  );
}

// Pull-to-refresh wrapper
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    // Track touch start for pull detection
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Calculate pull distance
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4 bg-background z-10">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      {children}
    </div>
  );
}
