'use client';

import { useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { X, DownloadSimple, DeviceMobile } from '@phosphor-icons/react';

export default function PWAInstallBanner() {
  const { installPrompt, installApp, isInstalled, isSupported } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed, not supported, no prompt, or dismissed
  if (isInstalled || !isSupported || !installPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <DeviceMobile weight="fill" className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">ติดตั้ง BN-Aura</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              เพิ่มลงหน้าจอหลักเพื่อเข้าถึงได้เร็วขึ้น
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={installApp}
          className="w-full mt-3 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <DownloadSimple weight="bold" className="w-4 h-4" />
          <span>ติดตั้งแอป</span>
        </button>
      </div>
    </div>
  );
}
