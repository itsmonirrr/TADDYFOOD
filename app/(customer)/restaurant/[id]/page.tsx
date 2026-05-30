"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Restaurant, MenuItem } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { Star, Clock3, Bike, Wallet, ShieldCheck, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const { cartItems, currentRestaurant, addToCart, removeFromCart, removeItemFully, total, subtotal } = useCart();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ item: MenuItem; restaurant: Restaurant } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      setIsLoading(true);
      const resId = params.id as string;
      try {
        // 1. Fetch restaurant
        const { data: resData, error: resErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', resId)
          .single();

        if (resErr || !resData) {
          throw resErr || new Error("Restaurant not found");
        }

        // 2. Fetch menu items
        const { data: menuData, error: menuErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resId)
          .eq('is_available', true);

        if (menuErr) throw menuErr;

        const mappedMenu: MenuItem[] = (menuData || []).map(m => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          price: Number(m.price),
          category: m.category || 'General',
          image: m.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
          isAvailable: m.is_available
        }));

        const mappedRes: Restaurant = {
          id: resData.id,
          name: resData.name,
          image: resData.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=60',
          cuisine: resData.cuisine_type || 'Fast Food',
          rating: Number(resData.rating) || 4.5,
          deliveryTime: `${resData.delivery_time || 30} min`,
          minOrder: Number(resData.min_order) || 100,
          deliveryFee: Number(resData.delivery_fee) || 30,
          isOpen: resData.is_open,
          isSuper: Number(resData.rating) >= 4.7,
          ownerEmail: resData.email || '',
          menu: mappedMenu
        };

        setRestaurant(mappedRes);
        if (mappedMenu.length > 0) {
          setActiveCategory(mappedMenu[0].category);
        }
      } catch (err) {
        console.error('Failed to load restaurant details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchRestaurantAndMenu();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2">🧸 Loading restaurant details...</span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <span className="text-6xl animate-pulse block mb-4">🧸</span>
        <h3 className="text-base font-bold text-on-surface">Restaurant Not Found</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-1">Please go back to homepage and select an active store.</p>
        <button onClick={() => router.push('/')} className="btn-primary text-xs px-6 py-2.5 rounded-full mt-4">
          Go Back Home
        </button>
      </div>
    );
  }

  // 1. Group menu items by category
  const groupedMenu = restaurant.menu.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(groupedMenu);

  // 2. Add to cart handles single-restaurant restriction
  const handleAddItem = (item: MenuItem) => {
    const res = addToCart(item, restaurant);
    if (!res.success && res.conflict) {
      setPendingItem({ item, restaurant });
      setShowConflictModal(true);
    }
  };

  // 3. Clear cart and accept new restaurant item
  const handleResolveConflict = () => {
    if (pendingItem) {
      localStorage.removeItem('tf_cart_items');
      localStorage.removeItem('tf_cart_restaurant');
      localStorage.removeItem('tf_cart_voucher');
      window.location.reload();
    }
  };

  // 4. Get active quantity of items
  const getItemQty = (itemId: string) => {
    const matched = cartItems.find(i => i.itemId === itemId);
    return matched ? matched.quantity : 0;
  };

  // Smooth Category Scroll
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const element = document.getElementById(`cat-sec-${catId}`);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-4 sm:px-gutter py-6 page-fade-in relative">
      
      {/* A. Restaurant Hero Banner */}
      <section className="relative rounded-[2.5rem] overflow-hidden h-60 sm:h-72 w-full mb-8 shadow-glass border border-white/20">
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
          <div className="max-w-xl space-y-2">
            <span className="bg-primary text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
              {restaurant.isOpen ? 'Open Now' : 'Closed'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white mt-1">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-200 flex-wrap">
              <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-md">{restaurant.cuisine}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[#F59E0B] fill-[#F59E0B]" />
                <span>{restaurant.rating} Rating</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock3 size={12} className="text-slate-200" />
                <span>{restaurant.deliveryTime}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* B. Info stats bar */}
      <section className="bg-white/60 p-4 rounded-3xl border border-pink-100 shadow-glass flex flex-wrap justify-between items-center gap-4 mb-8 text-xs font-bold text-on-surface-variant">
        <div className="flex items-center gap-2">
          <Bike size={16} className="text-primary shrink-0" />
          <span>Delivery fee: <strong>{restaurant.deliveryFee > 0 ? `৳ ${restaurant.deliveryFee}` : 'FREE'}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-primary shrink-0" />
          <span>Min order: <strong>৳ {restaurant.minOrder}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary shrink-0" />
          <span>Status: <strong>{restaurant.isSuper ? 'Super Restaurant 🧸' : 'Verified Partner'}</strong></span>
        </div>
      </section>

      {/* C. Interactive columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar Category Navigator */}
        <aside className="col-span-1 lg:sticky lg:top-28 h-fit bg-white/40 p-4 rounded-3xl border border-pink-100/50 shadow-sm space-y-1 bg-white">
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/50 px-3 py-1 mb-2">Menu Sections</p>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-on-surface-variant hover:bg-[#FFF0F8] hover:text-primary'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </aside>

        {/* Center Grid of Food Items */}
        <div className="col-span-1 lg:col-span-2 space-y-10">
          {categories.map((cat) => (
            <section key={cat} id={`cat-sec-${cat}`} className="space-y-4 pt-2">
              <h2 className="text-lg font-black text-on-surface border-b border-gray-100 pb-2">{cat}</h2>
              
              <div className="space-y-4">
                {groupedMenu[cat].map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div 
                      key={item.id}
                      className="glass-card rounded-[2rem] p-4 flex gap-4 border border-pink-50 relative group transition-all duration-300 hover:shadow-lift bg-white"
                    >
                      {/* Dish Photo */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-grow flex flex-col justify-between py-1 min-w-0">
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold text-on-surface truncate pr-6">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-on-surface-variant/75 font-medium line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center gap-2 mt-2">
                          <span className="text-sm font-black text-primary">
                            ৳ {item.price}
                          </span>

                          {/* Dynamic Add / Stepper Actions */}
                          {item.isAvailable && (
                            qty > 0 ? (
                              <div className="flex items-center gap-3 bg-primary-fixed border border-pink-200 rounded-full px-2.5 py-1">
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-xs font-bold shadow-sm"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-black text-primary select-none w-4 text-center">{qty}</span>
                                <button 
                                  onClick={() => handleAddItem(item)}
                                  className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-xs font-bold shadow-sm"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddItem(item)}
                                className="btn-primary text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Plus size={12} className="text-white" />
                                <span>Add</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Right Column Sticky Cart drawer summary */}
        <aside className="col-span-1 lg:sticky lg:top-28 h-fit bg-white p-5 rounded-[2.5rem] border border-pink-100 shadow-glass flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
              <ShoppingCart size={16} className="text-primary" />
              <span>Your Order</span>
            </h3>
            {cartItems.length > 0 && (
              <span className="text-[10px] font-black bg-primary-fixed text-primary px-2 py-0.5 rounded-full">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            )}
          </div>

          {/* Cart Feed */}
          {cartItems.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
              {cartItems.map((item) => (
                <div key={item.itemId} className="flex justify-between items-start gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-on-surface truncate">{item.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">৳ {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-1.5 py-0.5">
                      <button 
                        onClick={() => removeFromCart(item.itemId)}
                        className="w-4 h-4 rounded-full bg-white text-gray-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-[10px] font-bold w-3 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => {
                          const matchedItem = restaurant.menu.find(m => m.id === item.itemId);
                          if (matchedItem) handleAddItem(matchedItem);
                        }}
                        className="w-4 h-4 rounded-full bg-white text-gray-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="font-black text-on-surface w-12 text-right">
                      ৳ {item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
              
              <hr className="border-pink-50" />

              {/* Subtotal tallies */}
              <div className="space-y-2 text-xs font-bold text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-on-surface">৳ {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-extrabold text-on-surface">৳ {restaurant.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-primary pt-1.5 border-t border-dashed border-gray-200">
                  <span className="font-black text-sm">Total Amount</span>
                  <span className="font-black text-sm">৳ {subtotal + restaurant.deliveryFee}</span>
                </div>
              </div>

              {/* Min Order warning */}
              {subtotal < restaurant.minOrder ? (
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold rounded-2xl mt-2 text-center">
                  ⚠️ Minimum order amount is <strong>৳ {restaurant.minOrder}</strong>. 
                  Add <strong>৳ {restaurant.minOrder - subtotal}</strong> more to checkout.
                </div>
              ) : (
                <button
                  onClick={() => router.push('/checkout')}
                  className="btn-primary w-full py-3 rounded-full text-xs font-black tracking-wide mt-2 text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-glow"
                >
                  <span>Go to Checkout</span>
                  <ArrowRight size={14} className="text-white" />
                </button>
              )}

            </div>
          ) : (
            <div className="text-center py-10">
              <ShoppingCart size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-on-surface">Your cart is empty</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Explore the menu and add dishes!</p>
            </div>
          )}
        </aside>

      </div>

      {/* D. Conflict Resolution Pop-up Modal */}
      {showConflictModal && pendingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-md w-full border border-pink-100 shadow-premium glass-card text-center space-y-5 animate-bounce">
            <span className="text-5xl block animate-float">🧸</span>
            <h3 className="text-base font-black text-on-surface">Reset Your Cart?</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Your cart contains items from <strong>{currentRestaurant?.name}</strong>. 
              Adding items from <strong>{restaurant.name}</strong> will discard your existing selection. 
              Do you want to continue?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowConflictModal(false); setPendingItem(null); }}
                className="px-5 py-2.5 rounded-full border border-pink-200 text-secondary hover:bg-gray-50 text-xs font-bold transition-all"
              >
                No, Keep Order
              </button>
              <button 
                onClick={handleResolveConflict}
                className="btn-primary px-6 py-2.5 rounded-full text-xs font-bold"
              >
                Yes, Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
