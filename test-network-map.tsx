'use client';

import { useState } from 'react';

export default function TestNetworkMapPage() {
  const stats = {
    online: 10,
    warning: 2,
    offline: 1
  };

  return (
    <div>
      <div>
        <div>
          {/* Mobile Status Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 p-4 z-20">
            <div className="flex items-center justify-around text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white/80">{stats.online} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-white/80">{stats.warning} Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                <span className="text-white/80">{stats.offline} Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
