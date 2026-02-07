'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ChatCenter from '@/components/sales/ChatCenter';
import { SpinnerGap } from '@phosphor-icons/react';

function SalesChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const [salesId, setSalesId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setSalesId(user.id);
    }
  }, [user?.id]);

  if (!salesId) {
    return (
      <div className="flex items-center justify-center h-96">
        <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <ChatCenter salesId={salesId} />
    </div>
  );
}

export default function SalesChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <SalesChatContent />
    </Suspense>
  );
}
