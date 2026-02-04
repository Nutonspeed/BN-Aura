'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap, TrendUp, WarningCircle } from '@phosphor-icons/react';
import { useSalesLeadsInfinite, SalesLead } from '@/hooks/useSalesLeads';
import { cn } from '@/lib/utils';

interface InfiniteLeadsListProps {
  clinicId: string;
  status?: string;
  onLeadClick?: (lead: SalesLead) => void;
}

export default function InfiniteLeadsList({ 
  clinicId, 
  status,
  onLeadClick 
}: InfiniteLeadsListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useSalesLeadsInfinite(clinicId, { status });

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Set up intersection observer
  useCallback(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
      rootMargin: '100px'
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Flatten all pages into single array
  const allLeads = data?.pages.flatMap(page => page.data) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <WarningCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-muted-foreground">Failed to load leads</p>
      </div>
    );
  }

  if (allLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">No leads found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start by scanning customers or importing leads
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-white font-bold">{allLeads.length}</span> of{' '}
          <span className="text-white font-bold">{totalCount}</span> leads
        </p>
        {hasNextPage && (
          <p className="text-xs text-primary">Scroll for more</p>
        )}
      </div>

      {/* Leads list */}
      <div className="space-y-2">
        {allLeads.map((lead, index) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onLeadClick?.(lead)}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer",
              "hover:border-primary/50 hover:bg-white/5",
              lead.score >= 70 
                ? "bg-primary/5 border-primary/30" 
                : "bg-white/5 border-white/10"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">
                    {lead.name}
                  </h4>
                  {lead.score >= 70 && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">
                      HOT
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {lead.email && (
                    <span className="truncate">{lead.email}</span>
                  )}
                  {lead.phone && (
                    <span>{lead.phone}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    lead.status === 'new' && "bg-blue-500/20 text-blue-400",
                    lead.status === 'contacted' && "bg-yellow-500/20 text-yellow-400",
                    lead.status === 'qualified' && "bg-green-500/20 text-green-400",
                    lead.status === 'won' && "bg-emerald-500/20 text-emerald-400",
                    lead.status === 'lost' && "bg-red-500/20 text-red-400"
                  )}>
                    {lead.status}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <TrendUp className={cn(
                    "w-4 h-4",
                    lead.score >= 70 ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-2xl font-black",
                    lead.score >= 70 ? "text-primary" : "text-white"
                  )}>
                    {lead.score}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {lead.category.toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading trigger for infinite scroll */}
      {hasNextPage && (
        <div 
          ref={observerTarget}
          className="flex items-center justify-center py-8"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <SpinnerGap className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Scroll down to load more
            </div>
          )}
        </div>
      )}

      {/* End message */}
      {!hasNextPage && allLeads.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the list
          </p>
        </div>
      )}
    </div>
  );
}
