'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

// Update the ExtendedWindow interface
interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Define a type for the order payload
interface OrderPayload {
  id: string;
  unit_id: string;
  unit_number: string;
  building_id: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Define extended Building interface to include units
interface ExtendedBuilding extends Building {
  units?: {
    id: string;
    unit_number: string;
  }[];
}

// Define a proper type for Supabase subscriptions
interface SupabaseSubscription {
  unsubscribe: () => void;
}

export function TopNav({ title = 'Dashboard' }: { title?: string }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [username, setUsername] = useState('');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [buildings, setBuildings] = useState<ExtendedBuilding[]>([]);
  const [subscriptionsActive, setSubscriptionsActive] = useState(false);
  
  // Store subscriptions with proper type
  const subscriptions = useRef<SupabaseSubscription[]>([]);
  
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
  
  // Update the playFallbackSound function
  const playFallbackSound = () => {
    if (typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || 
          (window as ExtendedWindow).webkitAudioContext;
          
        if (!AudioContext) {
          console.error('Neither AudioContext nor webkitAudioContext is available');
          return;
        }
        
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
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

  // Improve subscription management
  const setupRealTimeSubscriptions = useCallback(() => {
    console.log('Setting up real-time subscriptions in TopNav');
    
    // Clean up any existing subscriptions first
    subscriptions.current.forEach((subscription) => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    subscriptions.current = [];
    
    // If we have no buildings, don't set up subscriptions
    if (!buildings || buildings.length === 0) {
      console.log('No buildings to subscribe to in TopNav');
      return;
    }
    
    // Get all building IDs that belong to this user
    const buildingIds = buildings.map(building => building.id);
    console.log('Setting up real-time notifications in TopNav for buildings:', buildingIds);

    // Create a single subscription for all buildings for orders
    const ordersSubscription = supabase
      .channel('topnav-orders-all-buildings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `building_id=in.(${buildingIds.join(',')})`,
        },
        (payload: { new: OrderPayload }) => {
          console.log('New order received in TopNav:', payload);
          
          // Get building name and unit for the notification
          const newOrder = payload.new;
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

    // Add to subscriptions list
    subscriptions.current.push(ordersSubscription);
    
    console.log('Real-time notifications set up successfully in TopNav');
  }, [buildings, playNotificationSound]);

  // Update the loadBuildings function to ensure subscriptions are setup properly
  const loadBuildings = useCallback(async () => {
    try {
      console.log('Loading buildings for real-time notifications...');
      const buildingsData = await getBuildings();
      
      if (buildingsData && buildingsData.length > 0) {
        setBuildings(buildingsData);
        console.log('Buildings loaded successfully:', buildingsData.length);
      } else {
        console.log('No buildings found');
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  }, []);

  // Update how we load buildings and set up subscriptions
  useEffect(() => {
    // Only load buildings if user is authenticated
    if (user) {
      loadBuildings();
    }
    
    return () => {
      // Clean up subscriptions on unmount
      console.log('Cleaning up all subscriptions');
      subscriptions.current.forEach((subscription) => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptions.current = [];
    };
  }, []);

  // Set up subscriptions when buildings change
  useEffect(() => {
    if (buildings && buildings.length > 0) {
      setupRealTimeSubscriptions();
    }
  }, [buildings]);

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

  const handleTestRealtime = () => {
    console.log('Testing real-time notification');
    
    // Check if we have subscriptions
    console.log('Current subscriptions:', subscriptions.current);
    
    // Show toast notification
    toast.success('🧪 Testing real-time notification system', {
      duration: 3000,
      icon: '🔌'
    });
    
    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }
    
    // Log subscription details to help with debugging
    if (buildings && buildings.length > 0) {
      console.log('Subscribed to buildings:', buildings.map(b => b.name));
    } else {
      console.log('No buildings loaded for subscriptions');
      
      // Attempt to reload buildings
      loadBuildings();
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

  // Add a function to manually reconnect subscriptions
  const handleReconnectSubscriptions = () => {
    console.log('Manually reconnecting subscriptions');
    
    // Clean up existing subscriptions
    subscriptions.current.forEach((subscription) => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    subscriptions.current = [];
    
    // Reload buildings and set up subscriptions again
    loadBuildings().then(() => {
      console.log('Buildings reloaded, setting up subscriptions');
      setupRealTimeSubscriptions();
      
      toast.success('🔄 Reconnected to notification system', {
        duration: 3000
      });
    });
  };

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
                
                <button 
                  onClick={handleTestRealtime}
                  className={cn(
                    "mt-2 w-full py-2 px-4 text-sm rounded bg-blue-500 text-white",
                  )}
                >
                  Test Real-time Connection
                </button>
                
                <button 
                  onClick={handleReconnectSubscriptions}
                  className={cn(
                    "mt-2 w-full py-2 px-4 text-sm rounded bg-green-500 text-white",
                  )}
                >
                  Reconnect Subscriptions
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