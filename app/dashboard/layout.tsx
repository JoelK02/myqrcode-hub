'use client';

import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { useAuth } from '../components/AuthProvider';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  
  // Redirect to login if not authenticated and not loading
  if (!isLoading && !user) {
    redirect('/auth/login');
  }
  
  // Optional: Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <TopNav />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 