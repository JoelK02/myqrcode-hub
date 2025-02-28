'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  QrCode, 
  ClipboardList, 
  Menu as MenuIcon, 
  ChevronLeft, 
  UtensilsCrossed,
  LogOut,
  Home
} from 'lucide-react';
import { cn } from '../lib/utils';   
import { useAuth } from '../hooks/useAuth';

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const { signOut } = useAuth();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const sidebarItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: 'Buildings', 
      path: '/dashboard/buildings', 
      icon: <Building2 className="h-5 w-5" /> 
    },
    { 
      name: 'Units', 
      path: '/dashboard/units', 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      name: 'QR Codes', 
      path: '/dashboard/qrcodes', 
      icon: <QrCode className="h-5 w-5" /> 
    },
    { 
      name: 'Orders & Requests', 
      path: '/dashboard/orders', 
      icon: <ClipboardList className="h-5 w-5" /> 
    },
    { 
      name: 'Menu & Services', 
      path: '/dashboard/services', 
      icon: <UtensilsCrossed className="h-5 w-5" /> 
    }
  ];

  return (
    <aside className={cn(
      "h-screen sticky top-0 bg-sidebar flex flex-col border-r shadow-sm transition-all duration-300 ease-in-out",
      expanded ? "w-64" : "w-20"
    )}>
      <div className="flex items-center justify-between h-16 p-4 border-b">
        {expanded ? (
          <h2 className="text-xl font-semibold">myQRcode</h2>
        ) : (
          <span className="text-xl font-bold mx-auto">QR</span>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
        >
          {expanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "sidebar-item group",
                pathname === item.path && "sidebar-item-active"
              )}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              {expanded && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-3">
        <button 
          onClick={() => signOut()}
          className="sidebar-item w-full justify-start text-destructive hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
} 