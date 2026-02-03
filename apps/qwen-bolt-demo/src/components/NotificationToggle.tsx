'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

export function NotificationToggle() {
  const { settings, updateSettings, playNotification } = useNotification();

  const handleToggle = () => {
    const newEnabled = !settings.soundEnabled;
    updateSettings({ soundEnabled: newEnabled });
    
    // Play a test sound when enabling
    if (newEnabled) {
      setTimeout(() => playNotification(), 100);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      aria-label="Toggle sound notifications"
      title={settings.soundEnabled ? 'Disable sound notifications' : 'Enable sound notifications'}
    >
      {settings.soundEnabled ? (
        <Volume2 className="w-5 h-5 text-blue-400" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
}
