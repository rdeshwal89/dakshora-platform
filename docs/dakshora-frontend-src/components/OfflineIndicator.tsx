import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      {!isOnline ? (
        <div className="bg-amber-950/90 border border-amber-600/50 backdrop-blur-md text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-amber-100 flex items-center gap-1.5">
              <span>Offline Mode Active</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </div>
            <div className="text-amber-300/80 mt-0.5 text-[11px]">
              Cached student attendance and timetable are accessible. Changes will sync upon reconnection.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/90 border border-emerald-600/50 backdrop-blur-md text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-emerald-100">Connection Restored</div>
            <div className="text-emerald-300/80 mt-0.5 text-[11px]">
              You are back online. Dakshora cloud sync is active.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
