'use client';

import { usePathname, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { 
  CaretRight,
  House
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  className?: string;
  customLabels?: Record<string, string>;
}

export default function Breadcrumb({ className, customLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  
  // Split pathname and remove empty strings
  const paths = pathname.split('/').filter(Boolean);
  
  // Remove locale from paths if it's the first element
  // (In next-intl routing, pathname might already be without locale depending on config)
  const segments = paths[0] === 'th' || paths[0] === 'en' ? paths.slice(1) : paths;

  if (segments.length === 0) return null;

  return (
    <nav className={cn("flex items-center space-x-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide", className)}>
      <Link 
        href="/"
        className="flex items-center gap-1 hover:text-primary transition-colors duration-200"
      >
        <House className="w-4 h-4" />
        <span className="hidden sm:inline">{t('home')}</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        
        // Use custom label or capitalize segment (avoid throwing IntlError)
        let label = customLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        // Special handling for common UUID-like segments or IDs
        if (segment.length > 20 || /^[0-9a-fA-F-]+$/.test(segment)) {
          label = customLabels[segment] || '...';
        }

        return (
          <div key={href} className="flex items-center space-x-2">
            <CaretRight className="w-3 h-3 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-primary transition-colors duration-200 truncate max-w-[100px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}