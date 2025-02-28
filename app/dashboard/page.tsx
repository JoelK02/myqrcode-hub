'use client';

import React from 'react';
import { 
  Building2, 
  QrCode, 
  ClipboardList, 
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

// Dashboard card component
function DashboardCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string 
}) {
  return (
    <div className="bg-card rounded-lg p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
}

// Section component for dashboard sections
function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const username = user?.email?.split('@')[0] || 'User';
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Welcome, {username}</h1>
        <p className="text-muted-foreground">Here's an overview of your property management system.</p>
      </header>
      
      <DashboardSection title="Overview">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard 
            title="Buildings" 
            value={12} 
            icon={<Building2 className="h-5 w-5" />} 
            description="Total managed buildings"
          />
          <DashboardCard 
            title="Active QR Codes" 
            value={153} 
            icon={<QrCode className="h-5 w-5" />} 
            description="Scanned 43 times today"
          />
          <DashboardCard 
            title="Open Orders" 
            value={8} 
            icon={<ClipboardList className="h-5 w-5" />} 
            description="2 require attention"
          />
          <DashboardCard 
            title="Menu Items" 
            value={42} 
            icon={<UtensilsCrossed className="h-5 w-5" />} 
            description="Most ordered: Breakfast"
          />
        </div>
      </DashboardSection>
      
      <DashboardSection title="Recent Activity">
        <div className="bg-card rounded-lg border p-6">
          <p className="text-center text-muted-foreground py-8">
            Your recent activity will appear here.
          </p>
        </div>
      </DashboardSection>
      
      <DashboardSection title="Quick Actions">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <button className="p-4 border rounded-lg text-left hover:bg-accent transition-colors">
            <h3 className="font-medium mb-1">Generate New QR Code</h3>
            <p className="text-sm text-muted-foreground">Create and assign a new QR code to a unit.</p>
          </button>
          <button className="p-4 border rounded-lg text-left hover:bg-accent transition-colors">
            <h3 className="font-medium mb-1">Add New Building</h3>
            <p className="text-sm text-muted-foreground">Register a new building in the system.</p>
          </button>
          <button className="p-4 border rounded-lg text-left hover:bg-accent transition-colors">
            <h3 className="font-medium mb-1">View All Orders</h3>
            <p className="text-sm text-muted-foreground">Check status of all pending orders.</p>
          </button>
        </div>
      </DashboardSection>
    </div>
  );
} 