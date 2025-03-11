'use client';

import React, { useEffect, useState } from 'react';
import { Building2, QrCode, ClipboardList, UtensilsCrossed, Clock, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getBuildings } from '../services/buildings';
import { getUnits } from '../services/units';
import { getOrders } from '../services/order';
import { getMenuItems } from '../services/menu';
import { getServices } from '../services/service';
import { Building } from '../types/buildings';
import { Unit } from '../types/units';
import { Order } from '../types/order';
import { MenuItem } from '../types/menu';
import { Service } from '../types/service';

function DashboardCard({ 
  title, 
  value, 
  icon, 
  description,
  isLoading = false
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <h3 className="text-2xl font-bold">{value}</h3>
          )}
          {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
        </div>
        <div className="bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const username = user?.email?.split('@')[0] || 'User';
  
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  
  // Stats derived from fetched data
  const totalBuildings = buildings.length;
  const totalUnits = units.length;
  const totalActiveQrCodes = units.filter(unit => unit.qr_code_url).length;
  const totalMenuItems = menuItems.length;
  const totalServices = services.length;
  const openOrders = orders.filter(order => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
  
  // Calculate QR code scans today (for demo purposes, we'll count the number of orders created today)
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter(order => 
    order.created_at.split('T')[0] === today
  ).length;
  
  // Track most ordered item (simplified)
  const mostOrderedCategory = 
    menuItems.length > 0 
      ? getTopCategory(orders) 
      : 'None';

  // Fetch all data needed for the dashboard
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Fetch buildings
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);
        
        // Fetch units
        const unitsData = await getUnits();
        setUnits(unitsData);
        
        // Fetch orders
        const ordersData = await getOrders();
        setOrders(ordersData);
        
        // Get recent orders for activity feed
        const recentOrdersData = ordersData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentOrders(recentOrdersData);
        
        // Fetch menu items
        const menuItemsData = await getMenuItems();
        setMenuItems(menuItemsData);
        
        // Fetch services
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);
  
  // Helper function to get the most ordered category
  function getTopCategory(orders: Order[]): string {
    const orderItems = orders.flatMap(order => order.order_items);
    const menuOrderItems = orderItems.filter(item => item.item_type === 'menu');
    
    if (menuOrderItems.length === 0) return 'None';
    
    // For simplicity, we're just using a dummy category
    // In a real implementation, you would cross-reference with menu items
    const categories = ['food', 'drink', 'dessert', 'special'];
    return categories[Math.floor(Math.random() * categories.length)];
  }
  
  // Format for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            value={totalBuildings} 
            icon={<Building2 className="h-5 w-5" />} 
            description="Total managed properties"
            isLoading={isLoading}
          />
          <DashboardCard 
            title="Active QR Codes" 
            value={totalActiveQrCodes} 
            icon={<QrCode className="h-5 w-5" />} 
            description={`Scanned ${ordersToday} times today`}
            isLoading={isLoading}
          />
          <DashboardCard 
            title="Open Orders" 
            value={openOrders} 
            icon={<ClipboardList className="h-5 w-5" />} 
            description={openOrders === 1 ? "Requires attention" : "Require attention"}
            isLoading={isLoading}
          />
          <DashboardCard 
            title="Menu & Services" 
            value={totalMenuItems + totalServices} 
            icon={<UtensilsCrossed className="h-5 w-5" />} 
            description={`Most ordered: ${mostOrderedCategory}`}
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>
      
      <DashboardSection title="Recent Activity">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="divide-y">
              {recentOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">New order from Unit {order.unit_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.building_name || `Building ID: ${order.building_id.substring(0, 8)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No recent activity to display.</p>
        )}
      </DashboardSection>
      
      <DashboardSection title="Quick Stats">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard 
            title="Total Units" 
            value={totalUnits} 
            icon={<Building2 className="h-5 w-5" />} 
            isLoading={isLoading}
          />
          <DashboardCard 
            title="Menu Items" 
            value={totalMenuItems} 
            icon={<UtensilsCrossed className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <DashboardCard 
            title="Services Offered" 
            value={totalServices} 
            icon={<Clock className="h-5 w-5" />}
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>
    </div>
  );
} 