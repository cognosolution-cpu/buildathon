import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[#FF6A00] text-[#050505] text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 z-50"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are offline · Browsing cached VibeCart catalog</span>
    </div>
  );
};
