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

// Client component wrapper that uses useSearchParams
function OrderPageWrapper() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unit');
  
  // If no unitId is provided, we'll show an error in the OrderPage component
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <OrderPage unitId={unitId || ''} />
    </Suspense>
  );
}

// Main component that accepts unitId as a prop
function OrderPage({ unitId }: { unitId: string }) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    console.log("Order page loading, unit ID:", unitId);
    
    if (!unitId || unitId.trim() === '') {
      setError("No unit specified");
      setIsLoading(false);
      return;
    }

    async function fetchUnitData() {
      try {
        // Use the proper service functions instead of direct supabase calls
        const unitData = await getUnit(unitId);
        setUnit(unitData);
        
        // Now fetch the building data
        if (unitData.building_id) {
          const buildingData = await getBuilding(unitData.building_id);
          setBuilding(buildingData);
        }
        
        // Fetch menu items and services
        const menuData = await getMenuItems();
        setMenuItems(menuData);
        
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
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
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-4">{error}</p>
        <p>Please try again or contact support.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="animate-spin mb-4">
          <QrCode className="h-8 w-8" />
        </div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!unit) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Unit Not Found</h1>
        <p>The QR code you scanned does not link to a valid unit. Please try again or contact support.</p>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Submitted!</h1>
        <p className="text-center mb-6">Thank you for your order. Your request has been received and will be processed shortly.</p>
        
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Place Another Order
        </button>
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