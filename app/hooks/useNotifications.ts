import { useState, useEffect } from 'react';
import { getUserProfile, updateNotificationPreference } from '../services/userProfile';

interface NotificationSettings {
  dbEnabled: boolean;
  browserEnabled: boolean;
  soundEnabled: boolean;
}

interface UseNotificationsResult {
  // States
  isLoading: boolean;
  settings: NotificationSettings;
  
  // Action methods
  toggleDatabaseNotifications: (enabled: boolean) => Promise<boolean>;
  toggleBrowserNotifications: () => Promise<boolean>;
  toggleSoundNotifications: () => void;
  
  // Helper methods
  requestBrowserPermission: () => Promise<boolean>;
  canShowNotifications: () => boolean;
  showTestNotification: () => void;
  playTestSound: () => void;
}

/**
 * Hook for managing notification preferences with database persistence
 */
export function useNotifications(): UseNotificationsResult {
  // State for notification settings
  const [isLoading, setIsLoading] = useState(true);
  const [dbEnabled, setDbEnabled] = useState(true);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // On mount, load notification preferences
  useEffect(() => {
    async function loadPreferences() {
      setIsLoading(true);
      
      try {
        // Load database preferences
        const profile = await getUserProfile();
        if (profile) {
          setDbEnabled(profile.notifications);
        }
        
        // Check browser permission status
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setBrowserEnabled(Notification.permission === 'granted');
        }
        
        // Load sound preference from localStorage
        if (typeof window !== 'undefined' && localStorage) {
          const soundPref = localStorage.getItem('soundNotifications');
          if (soundPref !== null) {
            setSoundEnabled(soundPref === 'true');
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPreferences();
  }, []);
  
  // Save sound preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('soundNotifications', String(soundEnabled));
    }
  }, [soundEnabled]);
  
  // Toggle database notification preference
  const toggleDatabaseNotifications = async (enabled: boolean): Promise<boolean> => {
    try {
      const success = await updateNotificationPreference(enabled);
      if (success) {
        setDbEnabled(enabled);
      }
      return success;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      return false;
    }
  };
  
  // Request browser notification permission and toggle state
  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      setBrowserEnabled(true);
      return true;
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        setBrowserEnabled(granted);
        return granted;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    return false;
  };
  
  // Toggle browser notifications
  const toggleBrowserNotifications = async (): Promise<boolean> => {
    if (browserEnabled) {
      // Can't revoke permission once granted, just update our state
      setBrowserEnabled(false);
      // Also update database preference
      await toggleDatabaseNotifications(false);
      return true;
    } else {
      // Request permission
      const granted = await requestBrowserPermission();
      if (granted) {
        // Update database preference too
        await toggleDatabaseNotifications(true);
      }
      return granted;
    }
  };
  
  // Toggle sound notifications
  const toggleSoundNotifications = (): void => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Check if notifications can be shown
  const canShowNotifications = (): boolean => {
    return dbEnabled && browserEnabled;
  };
  
  // Show a test notification
  const showTestNotification = (): void => {
    if (!canShowNotifications()) {
      return;
    }
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('🔔 Test Notification', {
        body: 'This is a test notification!',
        icon: '/favicon.ico',
      });
    }
  };
  
  // Play a test sound
  const playTestSound = (): void => {
    if (!soundEnabled) {
      return;
    }
    
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Fallback sound
        if (typeof window !== 'undefined') {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (error) {
            console.error('Error playing fallback sound:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  return {
    isLoading,
    settings: {
      dbEnabled,
      browserEnabled,
      soundEnabled
    },
    toggleDatabaseNotifications,
    toggleBrowserNotifications,
    toggleSoundNotifications,
    requestBrowserPermission,
    canShowNotifications,
    showTestNotification,
    playTestSound
  };
} 