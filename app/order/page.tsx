'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMenuItems } from '../services/menu';
import { getServices } from '../services/service';
import { createOrder } from '../services/order';
import { getUnit } from '../services/units';
import { getBuilding } from '../services/buildings';
import { Unit } from '../types/units';
import { Building } from '../types/buildings';
import { MenuItem } from '../types/menu';
import { Service } from '../types/service';
import { CreateOrderInput } from '../types/order';
import { QrCode, UtensilsCrossed, Coffee, Pizza, Cake, Star, Clock, Bed, Bath, Briefcase, Wrench, Plus, Minus, ShoppingCart, ArrowLeft, Check, AlertTriangle, Info } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Client component wrapper
function OrderPageWrapper() {
  return (
    <Suspense key="order-search-params" fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
          <div className="mb-4 animate-spin">
            <QrCode className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Order Page</h2>
          <p className="text-center text-muted-foreground">Please wait while we prepare your menu and services...</p>
        </div>
      </div>
    }>
      <SearchParamsReader />
    </Suspense>
  );
}

// Component that reads search params - safely inside Suspense
function SearchParamsReader() {
  const searchParams = useSearchParams();
  
  // Extract unitId and handle potential issues with the URL format
  let unitId = searchParams.get('unit');
  
  // Add advanced client-side logging to help diagnose mobile issues
  useEffect(() => {
    console.log("[ORDER DEBUG] SearchParamsReader executed");
    console.log("[ORDER DEBUG] Current URL:", window.location.href);
    console.log("[ORDER DEBUG] Search params object:", Object.fromEntries([...searchParams.entries()]));
    console.log("[ORDER DEBUG] Unit ID from params:", unitId);
    
    // Check for common URL issues
    if (!unitId && window.location.href.includes('unit=')) {
      console.log("[ORDER DEBUG] Unit parameter present in URL but not extracted by useSearchParams");
      
      // Try to extract manually as fallback
      try {
        const url = new URL(window.location.href);
        const manualUnitId = url.searchParams.get('unit');
        console.log("[ORDER DEBUG] Manually extracted unit ID:", manualUnitId);
        
        if (manualUnitId) {
          unitId = manualUnitId;
          console.log("[ORDER DEBUG] Using manually extracted unit ID");
        }
      } catch (err) {
        console.error("[ORDER DEBUG] Error manually parsing URL:", err);
      }
    }
    
    // Report user agent for diagnostics
    console.log("[ORDER DEBUG] User agent:", navigator.userAgent);
  }, [searchParams, unitId]);
  
  return <OrderPage unitId={unitId || ''} />;
}

// Main component that accepts unitId as a prop
function OrderPage({ unitId }: { unitId: string }) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'service'>('menu');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<{ 
    type: 'menu' | 'service';
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Effect to load the unit data
  useEffect(() => {
    console.log("[ORDER DEBUG] OrderPage loading with unit ID:", unitId);
    
    if (!unitId || unitId.trim() === '') {
      const errorMsg = "No unit specified in the URL. The QR code might be invalid.";
      console.error("[ORDER DEBUG] Error:", errorMsg);
      setError(errorMsg);
      setErrorDetails("Check that the QR code contains a valid unit parameter.");
      setIsLoading(false);
      return;
    }

    async function fetchUnitData() {
      try {
        console.log("[ORDER DEBUG] Fetching unit data for ID:", unitId);
        
        // Use the proper service functions instead of direct supabase calls
        const unitData = await getUnit(unitId);
        console.log("[ORDER DEBUG] Unit data received:", unitData);
        setUnit(unitData);
        
        // Now fetch the building data
        if (unitData.building_id) {
          console.log("[ORDER DEBUG] Fetching building data for ID:", unitData.building_id);
          const buildingData = await getBuilding(unitData.building_id);
          console.log("[ORDER DEBUG] Building data received:", buildingData);
          setBuilding(buildingData);
        } else {
          console.warn("[ORDER DEBUG] No building ID found in unit data");
        }
        
        // Fetch menu items and services
        console.log("[ORDER DEBUG] Fetching menu items");
        const menuData = await getMenuItems();
        console.log("[ORDER DEBUG] Menu items received:", menuData.length);
        setMenuItems(menuData);
        
        console.log("[ORDER DEBUG] Fetching services");
        const servicesData = await getServices();
        console.log("[ORDER DEBUG] Services received:", servicesData.length);
        setServices(servicesData);
        
        console.log("[ORDER DEBUG] All data loaded successfully");
      } catch (err) {
        console.error("[ORDER DEBUG] Error fetching data:", err);
        
        // Provide more helpful error messages based on the specific error
        if (err instanceof Error) {
          if (err.message.includes('network') || err.message.includes('fetch')) {
            setError("Network error. Please check your internet connection.");
            setErrorDetails(`Technical details: ${err.message}`);
          } else if (err.message.includes('not found') || err.message.includes('404')) {
            setError(`Unit ${unitId} not found. The QR code may be invalid.`);
            setErrorDetails(`Technical details: ${err.message}`);
          } else {
            setError("Failed to load data. Please try again.");
            setErrorDetails(`Technical details: ${err.message}`);
          }
        } else {
          setError("An unknown error occurred.");
          setErrorDetails(`Technical details: ${String(err)}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUnitData();
  }, [unitId]);
  
  const filteredItems = activeTab === 'menu'
    ? activeCategory
      ? menuItems.filter(item => item.category === activeCategory)
      : menuItems
    : activeCategory
      ? services.filter(service => service.category === activeCategory)
      : services;
  
  const menuCategories = ['food', 'drink', 'dessert', 'special', 'other'];
  const serviceCategories = ['housekeeping', 'spa', 'concierge', 'maintenance'];
  
  const getItemInCart = (type: 'menu' | 'service', id: string) => {
    return cart.find(item => item.type === type && item.id === id);
  };
  
  const addToCart = (type: 'menu' | 'service', item: MenuItem | Service) => {
    const existingItem = getItemInCart(type, item.id);
    
    if (existingItem) {
      // Update quantity if already in cart
      setCart(cart.map(cartItem => 
        cartItem.type === type && cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          type,
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ]);
    }
  };
  
  const removeFromCart = (type: 'menu' | 'service', id: string) => {
    const existingItem = getItemInCart(type, id);
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity if more than 1
      setCart(cart.map(item => 
        item.type === type && item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      // Remove item from cart if quantity is 1
      setCart(cart.filter(item => !(item.type === type && item.id === id)));
    }
  };
  
  const updateCartItemNotes = (type: 'menu' | 'service', id: string, notes: string) => {
    setCart(cart.map(item => 
      item.type === type && item.id === id
        ? { ...item, notes }
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const handleSubmitOrder = async () => {
    if (!unit || !building || cart.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      const orderData: CreateOrderInput = {
        unit_id: unit.id,
        unit_number: unit.unit_number,
        building_id: building.id,
        building_name: building.name,
        notes: orderNotes,
        items: cart.map(item => ({
          item_type: item.type,
          item_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      };
      
      await createOrder(orderData);
      setIsSuccess(true);
      // Clear cart
      setCart([]);
      setOrderNotes('');
      
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryIcon = (category: string, tab: 'menu' | 'service') => {
    if (tab === 'menu') {
      switch (category) {
        case 'food':
          return <Pizza className="h-5 w-5" />;
        case 'drink':
          return <Coffee className="h-5 w-5" />;
        case 'dessert':
          return <Cake className="h-5 w-5" />;
        case 'special':
          return <Star className="h-5 w-5" />;
        default:
          return <UtensilsCrossed className="h-5 w-5" />;
      }
    } else {
      switch (category) {
        case 'housekeeping':
          return <Bed className="h-5 w-5" />;
        case 'spa':
          return <Bath className="h-5 w-5" />;
        case 'concierge':
          return <Briefcase className="h-5 w-5" />;
        case 'maintenance':
          return <Wrench className="h-5 w-5" />;
        default:
          return <Clock className="h-5 w-5" />;
      }
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-center">{error}</h1>
          
          {errorDetails && (
            <div className="bg-gray-100 p-4 rounded-md mb-6 text-sm">
              <p className="font-medium mb-1">Technical Details:</p>
              <p className="text-gray-700">{errorDetails}</p>
            </div>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
          <div className="mb-4 animate-spin">
            <QrCode className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Menu & Services</h2>
          <p className="text-center text-muted-foreground mb-6">Please wait while we load available items for your unit...</p>
          
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <QrCode className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-center">Unit Not Found</h1>
          <p className="text-center mb-6">
            The QR code you scanned doesn't link to a valid unit. This could be because:
          </p>
          
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>The QR code is outdated or has been replaced</li>
            <li>The unit may have been removed from the system</li>
            <li>There might be a technical issue with the QR code</li>
          </ul>
          
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2"
            >
              Try Again
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-primary/10 rounded-md flex gap-2">
            <Info className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-xs">
              If this issue persists, please contact the property management staff for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2 text-center">Order Submitted!</h1>
          <p className="text-center mb-6">
            Thank you for your order. Your request has been received and will be processed shortly.
            {building && unit && (
              <span className="block mt-2">
                Your items will be delivered to Unit {unit.unit_number} in {building.name}.
              </span>
            )}
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Order Received</p>
                  <p className="text-sm text-muted-foreground">We've received your order and it's being processed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <span className="text-sm font-medium">2</span>
                </div>
                <div>
                  <p className="font-medium">Preparation</p>
                  <p className="text-sm text-muted-foreground">Your order is being prepared</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <span className="text-sm font-medium">3</span>
                </div>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">Your order will be delivered to your unit</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {unit && (
        <div className="max-w-3xl mx-auto pb-24">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-6 w-6" />
              <h1 className="text-xl font-bold">Room Service</h1>
            </div>
            {building && (
              <div className="mt-2">
                <p className="text-sm opacity-90">{building.name}</p>
                <p className="text-lg font-medium">Unit {unit.unit_number}</p>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button 
              onClick={() => {
                setActiveTab('menu');
                setActiveCategory(null);
              }}
              className={`flex-1 py-4 text-center font-medium ${activeTab === 'menu' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Food & Drinks
              </span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('service');
                setActiveCategory(null);
              }}
              className={`flex-1 py-4 text-center font-medium ${activeTab === 'service' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                Services
              </span>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {/* Category Filters */}
            <div className="pb-4 overflow-x-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 whitespace-nowrap rounded-full text-sm ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                >
                  All
                </button>
                
                {activeTab === 'menu' ? (
                  menuCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1.5 whitespace-nowrap rounded-full text-sm flex items-center gap-1.5 ${activeCategory === category ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                    >
                      {getCategoryIcon(category, 'menu')}
                      <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    </button>
                  ))
                ) : (
                  serviceCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1.5 whitespace-nowrap rounded-full text-sm flex items-center gap-1.5 ${activeCategory === category ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}
                    >
                      {getCategoryIcon(category, 'service')}
                      <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Items List */}
            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border">
                  <p className="text-gray-500">No items available in this category.</p>
                </div>
              ) : (
                filteredItems.map(item => {
                  const cartItem = getItemInCart(activeTab, item.id);
                  
                  return (
                    <div key={`${activeTab}-${item.id}`} className="bg-white rounded-lg border p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          
                          {activeTab === 'service' && (
                            <span className="inline-block mt-2 text-xs bg-gray-100 rounded-full px-2 py-1">
                              {formatDuration((item as Service).duration)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.price)}</p>
                          
                          {cartItem ? (
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <button 
                                onClick={() => removeFromCart(activeTab, item.id)}
                                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-5 text-center">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(activeTab, item)}
                                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(activeTab, item)}
                              className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Cart Button */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md flex items-center justify-between"
              >
                <span className="flex items-center gap-2 ml-4">
                  <ShoppingCart className="h-5 w-5" />
                  <span>View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                </span>
                <span className="mr-4">{formatPrice(calculateTotal())}</span>
              </button>
            </div>
          )}
          
          {/* Cart Modal */}
          {isCartOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-end sm:items-center">
              <div className="bg-white rounded-t-lg sm:rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b sticky top-0 bg-white">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="p-2 -m-2 rounded-full hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold">Your Cart</h2>
                    <div className="w-9"></div> {/* Spacer for centering */}
                  </div>
                </div>
                
                <div className="divide-y">
                  {cart.map((item, index) => (
                    <div key={`${item.type}-${item.id}`} className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{item.quantity}x</span>
                            <h3 className="font-medium">{item.name}</h3>
                          </div>
                          
                          <textarea
                            placeholder="Add special instructions..."
                            value={item.notes || ''}
                            onChange={(e) => updateCartItemNotes(item.type, item.id, e.target.value)}
                            className="mt-2 w-full text-sm border rounded-md p-2 h-16 bg-gray-50"
                          />
                        </div>
                        <div className="text-right">
                          <p>{formatPrice(item.price * item.quantity)}</p>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <button 
                              onClick={() => removeFromCart(item.type, item.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-5 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item.type, {
                                id: item.id,
                                name: item.name,
                                price: item.price
                              } as MenuItem | Service)}
                              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex justify-between font-medium mb-2">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  
                  <textarea
                    placeholder="Add notes for your order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full border rounded-md p-3 h-24 mb-4 bg-gray-50"
                  />
                  
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Submit Order</span>
                      </>
                    )}
                  </button>
                  
                  <div className="mt-4 p-3 bg-primary/10 rounded-md flex gap-2">
                    <Info className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-xs">
                      Your order will be delivered to Unit {unit.unit_number} in {building?.name}. 
                      You will be charged when the service is delivered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Change the default export to the wrapper component
export default OrderPageWrapper; 