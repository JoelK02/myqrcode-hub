'use client';

import React, { useEffect, useState } from 'react';
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

export default function OrderPage() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unit');
  
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
  
  useEffect(() => {
    console.log("Order page loading, unit ID:", unitId);
    
    if (!unitId) {
      setError("No unit specified");
      setIsLoading(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    async function fetchUnit() {
      try {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .eq('id', unitId)
          .single();
          
        if (error) throw error;
        
        setUnit(data);
      } catch (err) {
        console.error("Error fetching unit:", err);
        setError("Failed to load unit data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUnit();
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
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>Preparing your ordering experience...</p>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-6 rounded-lg bg-background border">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 text-primary flex items-center justify-center rounded-full">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for your order. Our staff will process it as soon as possible.
          </p>
          <button 
            onClick={() => {
              setIsSuccess(false);
              setActiveTab('menu');
              setActiveCategory(null);
            }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-primary text-primary-foreground z-10 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Order for Unit {unit?.unit_number}</h1>
              <p className="text-sm">{building?.name}</p>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="bg-card sticky top-[72px] z-10 border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('menu');
                setActiveCategory(null);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'menu'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Food & Drinks
            </button>
            <button
              onClick={() => {
                setActiveTab('service');
                setActiveCategory(null);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'service'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Services
            </button>
          </div>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="bg-background sticky top-[116px] z-10 border-b overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex py-2 gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                activeCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              All
            </button>
            {(activeTab === 'menu' ? menuCategories : serviceCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {getCategoryIcon(category, activeTab === 'menu' ? 'menu' : 'service')}
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Items Grid */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">
              {activeCategory
                ? `No ${activeCategory} items available.`
                : `No ${activeTab} items available.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const cartItem = getItemInCart(activeTab, item.id);
              
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {getCategoryIcon('service' in item ? item.category : item.category, activeTab === 'menu' ? 'menu' : 'service')}
                        <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                      </div>
                    </div>
                    <div className="font-semibold">{formatPrice(item.price)}</div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  )}
                  
                  {'duration' in item && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  )}
                  
                  {item.image_url && (
                    <div className="mb-3 aspect-video rounded-md overflow-hidden bg-muted">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2 flex justify-between items-center">
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(activeTab, item.id)}
                          className="p-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <span className="font-medium min-w-[24px] text-center">{cartItem.quantity}</span>
                        
                        <button
                          onClick={() => addToCart(activeTab, item)}
                          className="p-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(activeTab, item)}
                        className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Cart Flyout */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-background shadow-lg flex flex-col h-full">
            <div className="p-4 border-b flex items-center">
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-md hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold ml-2">Your Order</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.type}-${item.id}`} className="bg-card rounded-lg border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{item.name}</h3>
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                              {item.type === 'menu' ? 'Menu' : 'Service'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.type, item.id)}
                            className="p-1 rounded-md hover:bg-accent"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <span className="font-medium min-w-[24px] text-center">{item.quantity}</span>
                          
                          <button
                            onClick={() => {
                              const itemToAdd = item.type === 'menu'
                                ? menuItems.find(i => i.id === item.id)
                                : services.find(i => i.id === item.id);
                              
                              if (itemToAdd) {
                                addToCart(item.type, itemToAdd);
                              }
                            }}
                            className="p-1 rounded-md hover:bg-accent"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <label className="block text-xs text-muted-foreground mb-1" htmlFor={`item-notes-${index}`}>
                          Special instructions (optional)
                        </label>
                        <input
                          id={`item-notes-${index}`}
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateCartItemNotes(item.type, item.id, e.target.value)}
                          className="w-full px-3 py-1 text-sm border rounded-md"
                          placeholder="E.g., allergies, preferences"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {cart.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-1" htmlFor="order-notes">
                    Order Notes (optional)
                  </label>
                  <textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Add any special instructions for your order"
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatPrice(calculateTotal())}</span>
                </div>
                
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
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
                    Your order will be delivered to Unit {unit?.unit_number} in {building?.name}. 
                    You will be charged when the service is delivered.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 