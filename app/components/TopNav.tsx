'use client';

import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export function TopNav({ title = 'Dashboard' }: { title?: string }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [username, setUsername] = useState('');

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

  return (
    <header className={cn(
      "top-nav transition-all duration-300",
      scrolled && "shadow-sm"
    )}>
      <div className="flex-1">
        <h1 className="text-lg font-medium">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        
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