'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Filter, 
  Building2, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal,
  Loader2,
  ArrowUpDown,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../services/order';
import { getBuildings } from '../../services/buildings';
import { Order, OrderItem } from '../../types/order';
import { Building } from '../../types/buildings';
import { formatDistanceToNow } from 'date-fns';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter states
  const [buildingFilter, setBuildingFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Pagination/sorting
  const [sortField, setSortField] = useState<'created_at' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Add a refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, buildingsData] = await Promise.all([
        getOrders(),
        getBuildings()
      ]);
      
      setOrders(ordersData);
      setBuildings(buildingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsUpdating(true);
      await updateOrderStatus({ id: orderId, status: newStatus });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSort = (field: 'created_at' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColorClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : 'Unknown Building';
  };

  const filteredOrders = orders
    .filter(order => 
      (buildingFilter ? order.building_id === buildingFilter : true) &&
      (statusFilter ? order.status === statusFilter : true) &&
      (dateFilter ? new Date(order.created_at).toDateString() === new Date(dateFilter).toDateString() : true) &&
      (searchTerm 
        ? order.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (order.building_name && order.building_name.toLowerCase().includes(searchTerm.toLowerCase()))
        : true)
    )
    .sort((a, b) => {
      if (sortField === 'created_at') {
        return sortDirection === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // For status sorting
        const statusOrder = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
        const aValue = statusOrder.indexOf(a.status);
        const bValue = statusOrder.indexOf(b.status);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders & Requests</h1>
          <p className="text-muted-foreground">Track and manage customer orders and service requests.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </header>
      
      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {/* Building filter */}
            <div className="flex-1">
              <label className="text-sm mb-1 block">Building</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
              >
                <option value="">All Buildings</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status filter */}
            <div className="flex-1">
              <label className="text-sm mb-1 block">Status</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Date filter */}
            <div className="flex-1">
              <label className="text-sm mb-1 block">Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            {/* Search */}
            <div className="flex-1">
              <label className="text-sm mb-1 block">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search unit number..."
                  className="w-full px-3 py-2 pl-9 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-medium flex items-center justify-between">
                Orders
                <span className="text-sm bg-primary/10 px-2 py-1 rounded text-primary">
                  {filteredOrders.length} found
                </span>
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No orders found matching your filters
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">
                            <button
                              onClick={() => handleSort('created_at')}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              Date
                              {sortField === 'created_at' && (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">
                            Unit
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">
                            <button
                              onClick={() => handleSort('status')}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              Status
                              {sortField === 'status' && (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr 
                            key={order.id}
                            className={`border-b hover:bg-muted/20 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-primary/5' : ''}`}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="p-3 text-sm">
                              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </td>
                            <td className="p-3 text-sm font-medium">
                              {order.unit_number}
                            </td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${getStatusColorClass(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Order Details */}
        <div className="md:col-span-2">
          {selectedOrder ? (
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between bg-muted/40">
                <h3 className="font-medium">Order Details</h3>
                <div className="flex items-center gap-2">
                  {isUpdating ? (
                    <span className="text-sm flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <select
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(selectedOrder.status)}`}
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as Order['status'])}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Order Information</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Order ID:</span>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="font-mono truncate">{selectedOrder.id}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedOrder.id, 'orderId')}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copiedId === 'orderId' ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="col-span-2">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="col-span-2">
                        <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${getStatusColorClass(selectedOrder.status)}`}>
                          {getStatusIcon(selectedOrder.status)}
                          <span className="capitalize">{selectedOrder.status}</span>
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="col-span-2 font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Location Information</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Building:</span>
                      <span className="col-span-2">
                        {selectedOrder.building_name || getBuildingName(selectedOrder.building_id)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="col-span-2">{selectedOrder.unit_number}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <span className="text-muted-foreground">Unit ID:</span>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="font-mono truncate">{selectedOrder.unit_id}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedOrder.unit_id, 'unitId')}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copiedId === 'unitId' ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="px-6 pb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                  <div className="bg-muted/20 p-3 rounded-md text-sm">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
              
              {/* Order Items */}
              <div className="px-6 pb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Order Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Item</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Type</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Quantity</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase p-3">Price</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item: OrderItem) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3 text-sm font-medium">{item.name}</td>
                          <td className="p-3 text-sm">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.item_type === 'menu' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {item.item_type === 'menu' ? 'Menu Item' : 'Service'}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{item.quantity}</td>
                          <td className="p-3 text-sm text-right">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-sm font-medium text-right">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/20">
                        <td colSpan={4} className="p-3 text-sm font-medium text-right">Order Total:</td>
                        <td className="p-3 text-sm font-bold text-right">{formatCurrency(selectedOrder.total_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-8 flex items-center justify-center h-full">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Order Selected</h3>
                <p className="text-muted-foreground">
                  Select an order from the list to view its details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 