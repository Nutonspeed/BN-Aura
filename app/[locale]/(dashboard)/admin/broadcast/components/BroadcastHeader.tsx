'use client';

import { Megaphone, RefreshCw } from 'lucide-react';
import { useBroadcastContext } from '../context';

export default function BroadcastHeader() {
  const { fetchMessages, loading } = useBroadcastContext();

  const handleRefresh = async () => {
    await fetchMessages();
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary" />
          Broadcast Messaging
        </h1>
        <p className="text-white/60 mt-1">Send announcements and messages to clinics</p>
      </div>
      
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}
