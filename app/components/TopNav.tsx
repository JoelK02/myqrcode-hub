'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellOff, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { useNotifications } from '../hooks/useNotifications';
import { createClient } from '@supabase/supabase-js';
import { getBuildings } from '../services/buildings';
import { Building } from '../types/buildings';
import toast from 'react-hot-toast';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function TopNav({ title = 'Dashboard' }: { title?: string }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [username, setUsername] = useState('');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [subscriptionsActive, setSubscriptionsActive] = useState(false);
  
  // Store subscriptions
  const subscriptions = useRef<any[]>([]);
  
  // Preload notification sound
  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  const {
    isLoading: notificationsLoading,
    settings: {
      dbEnabled,
      browserEnabled,
      soundEnabled
    },
    toggleBrowserNotifications,
    toggleSoundNotifications,
    canShowNotifications,
    showTestNotification,
    playTestSound
  } = useNotifications();

  // Refs for notification state that can be accessed in subscription callbacks
  const soundEnabledRef = useRef(soundEnabled);
  const browserEnabledRef = useRef(browserEnabled && dbEnabled);

  // Add a reference to track previous building IDs
  const previousBuildingIdsRef = useRef<string[]>([]);

  // Preload notification sound when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        notificationAudio.current = new Audio('/notification.mp3');
        notificationAudio.current.load(); // Preload the audio file
      } catch (err) {
        console.error('Failed to preload notification sound:', err);
      }
    }
    
    return () => {
      // Clean up audio
      if (notificationAudio.current) {
        notificationAudio.current = null;
      }
    };
  }, []);

  // Helper function to play notification sound
  const playNotificationSound = () => {
    if (!soundEnabledRef.current) return;
    
    try {
      // Try to use the preloaded audio element first
      if (notificationAudio.current) {
        // Clone the audio to allow multiple simultaneous plays
        const audioClone = notificationAudio.current.cloneNode() as HTMLAudioElement;
        audioClone.volume = 0.6;
        audioClone.play().catch((error) => {
          console.error('Error playing preloaded notification sound:', error);
          playFallbackSound();
        });
        return;
      }
      
      // Fallback to creating a new Audio object
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.error('Error playing notification sound:', error);
        playFallbackSound();
      });
    } catch (err) {
      console.error('Failed to play notification sound:', err);
      playFallbackSound();
    }
  };
  
  // Fallback sound using Web Audio API
  const playFallbackSound = () => {
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
      } catch (err) {
        console.error('Fallback sound failed:', err);
      }
    }
  };

  // Update refs when settings change
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    browserEnabledRef.current = browserEnabled && dbEnabled;
    
    // We don't need to recreate subscriptions when notification settings change
    // The refs will be used by the existing subscriptions
  }, [soundEnabled, browserEnabled, dbEnabled]);

  // Load buildings and set up subscriptions
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);
      } catch (error) {
        console.error('Error loading buildings:', error);
      }
    };

    if (user) {
      loadBuildings();
    }

    return () => {
      // Clean up subscriptions on unmount
      subscriptions.current.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptions.current = [];
    };
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (buildings.length > 0 && user) {
      // Extract building IDs
      const currentBuildingIds = buildings.map(building => building.id).sort().join(',');
      const previousBuildingIds = previousBuildingIdsRef.current.sort().join(',');
      
      // Only setup subscriptions if the building IDs have changed or subscriptions aren't active
      if (!subscriptionsActive || currentBuildingIds !== previousBuildingIds) {
        setupRealTimeSubscriptions();
        setSubscriptionsActive(true);
        
        // Store the building IDs for future comparison
        previousBuildingIdsRef.current = buildings.map(building => building.id);
      }
    }
  }, [buildings, user]);

  const setupRealTimeSubscriptions = () => {
    // Clean up any existing subscriptions
    subscriptions.current.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    subscriptions.current = [];

    // Get all building IDs that belong to this user
    const buildingIds = buildings.map(building => building.id);
    
    if (buildingIds.length === 0) {
      console.log('No buildings to subscribe to in TopNav');
      return;
    }
    
    console.log('Setting up real-time notifications in TopNav for buildings:', buildingIds);
    
    // Listen for new orders (INSERT events)
    const newOrdersSubscription = supabase
      .channel('topnav-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `building_id=in.(${buildingIds.join(',')})`,
        },
        (payload) => {
          console.log('TopNav: New order received:', payload);
          
          // Get building name and unit for the notification
          const newOrder = payload.new as any;
          const building = buildings.find(b => b.id === newOrder.building_id);
          const orderMessage = building 
            ? `New order for ${building.name}, Unit ${newOrder.unit_number}`
            : 'New order received';
            
          // Show toast notification
          toast.success(`🔔 ${orderMessage}`, {
            duration: 5000,
            icon: '🛎️'
          });
          
          // Play sound if enabled
          if (soundEnabledRef.current) {
            playNotificationSound();
          }
          
          // Show browser notification if enabled
          if (browserEnabledRef.current) {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 New Order Received!', { 
                body: orderMessage,
                icon: '/favicon.ico',
                requireInteraction: true
              });
            }
          }
        }
      )
      .subscribe();
    
    subscriptions.current.push(newOrdersSubscription);
    
    console.log('Real-time notifications set up successfully in TopNav');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (user?.email) {
      const email = user.email;
      // Extract username from email
      setUsername(email.split('@')[0]);
    }
  }, [user]);

  const handleRequestPermission = async () => {
    await toggleBrowserNotifications();
  };

  const handleToggleSound = () => {
    toggleSoundNotifications();
  };

  const handleTestNotification = () => {
    // Show toast notification
    toast.success('🔔 Test notification', {
      duration: 3000, 
      icon: '🧪'
    });
    
    // Show browser notification if enabled
    if (browserEnabled) {
      showTestNotification();
    }
    
    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }
  };

  // Close notification settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotificationSettings && !target.closest('.notification-panel')) {
        setShowNotificationSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationSettings]);

  return (
    <header className={cn(
      "top-nav transition-all duration-300",
      scrolled && "shadow-sm"
    )}>
      <div className="flex-1">
        <h1 className="text-lg font-medium">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative notification-panel">
          <button 
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className="p-2 rounded-full hover:bg-accent transition-colors relative" 
            aria-label="Notification settings"
          >
            {browserEnabled ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          
          {showNotificationSettings && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-4 z-50 notification-panel">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Notification Settings</h4>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="browser-notifications" className="text-sm flex-1">
                    Browser Notifications
                  </label>
                  <input 
                    id="browser-notifications" 
                    type="checkbox"
                    checked={browserEnabled}
                    onChange={handleRequestPermission}
                    className="form-checkbox h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="sound-notifications" className="text-sm flex-1">
                    Sound Notifications
                  </label>
                  <input 
                    id="sound-notifications" 
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={handleToggleSound}
                    className="form-checkbox h-4 w-4"
                  />
                </div>
                
                <button 
                  onClick={handleTestNotification}
                  disabled={!browserEnabled && !soundEnabled}
                  className={cn(
                    "w-full py-2 px-4 text-sm rounded bg-primary text-white",
                    (!browserEnabled && !soundEnabled) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Test Notification
                </button>
                
                <p className="text-xs text-muted-foreground">
                  Browser notifications will alert you of new orders even when using other tabs.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="font-medium capitalize">{username || 'User'}</span>
        </div>
      </div>
    </header>
  );
} 