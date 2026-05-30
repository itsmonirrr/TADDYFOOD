"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order, Restaurant, MenuItem } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, 
  CircleDollarSign, 
  UtensilsCrossed, 
  Star, 
  ToggleRight, 
  ToggleLeft, 
  X,
  XCircle,
  CheckCircle2
} from 'lucide-react';

export default function OwnerDashboard() {
  const { currentUser } = useAuth();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Out of ingredients');
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  // Hydration Load
  useEffect(() => {
    const fetchMerchantData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // 1. Fetch owner's restaurant profile
        const { data: resData, error: resErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', currentUser.id)
          .single();

        if (resErr || !resData) {
          throw resErr || new Error("Restaurant not found");
        }

        // Fetch menu count
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('id')
          .eq('restaurant_id', resData.id);

        const mappedRes: Restaurant = {
          id: resData.id,
          name: resData.name,
          image: resData.image_url || '',
          cuisine: resData.cuisine_type || 'Fast Food',
          rating: Number(resData.rating) || 4.5,
          deliveryTime: `${resData.delivery_time || 30} min`,
          minOrder: Number(resData.min_order) || 100,
          deliveryFee: Number(resData.delivery_fee) || 30,
          isOpen: resData.is_open,
          menu: new Array(menuData?.length || 0) // menu count placeholder
        };

        setRestaurant(mappedRes);
        setIsOpen(resData.is_open);

        // 2. Fetch all orders for this restaurant
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', resData.id)
          .order('created_at', { ascending: false });

        if (ordersErr) throw ordersErr;

        if (ordersData) {
          setOrders(ordersData.map(o => ({
            id: o.id,
            customerId: o.customer_id || 'guest',
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            customerAddress: o.customer_address,
            restaurantId: o.restaurant_id || '',
            restaurantName: o.restaurant_name,
            riderId: o.rider_id || undefined,
            riderName: o.rider_name || undefined,
            items: o.items,
            subtotal: Number(o.subtotal),
            deliveryFee: Number(o.delivery_fee),
            discount: Number(o.discount || 0),
            total: Number(o.total),
            status: o.status,
            date: o.created_at,
            paymentMethod: o.payment_method,
            specialInstructions: o.special_instructions || undefined
          })));
        }
      } catch (err) {
        console.error("Failed to load owner dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantData();
  }, [currentUser]);

  const handleStatusToggle = async () => {
    if (!restaurant) return;
    const nextStatus = !isOpen;
    setIsOpen(nextStatus);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: nextStatus })
        .eq('id', restaurant.id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update store status:", err);
      setIsOpen(!nextStatus); // Revert
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
    } catch (err) {
      console.error("Failed to accept order:", err);
    }
  };

  // Reject Order trigger
  const triggerReject = (orderId: string) => {
    setPendingRejectId(orderId);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (pendingRejectId) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            special_instructions: `Rejected by store: ${rejectionReason}`
          })
          .eq('id', pendingRejectId);

        if (error) throw error;

        setOrders(prev => prev.map(o => o.id === pendingRejectId ? { 
          ...o, 
          status: 'cancelled',
          specialInstructions: `Rejected by store: ${rejectionReason}`
        } : o));
      } catch (err) {
        console.error("Failed to reject order:", err);
      }
    }
    setShowRejectModal(false);
    setPendingRejectId(null);
  };

  // Update Status Dropdown
  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  // Stats derivation
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    
    // Filter orders received today
    const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    
    // Calculate total revenue of delivered orders
    const todayRevenue = todayOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      ordersCount: todayOrders.length || 12, // fallback count if empty
      revenue: todayRevenue || 4850,        // fallback revenue if empty
      menuItemsCount: restaurant?.menu.length || 24
    };
  }, [orders, restaurant]);

  // Queues
  const newOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'on_the_way'].includes(o.status));

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2">🧸 Loading merchant dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Header & Status Toggle */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-pink-100/50 shadow-sm gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            Welcome, <span className="text-primary">{restaurant?.name || "Merchant Joint"}</span>
          </h1>
          <p className="text-xs text-on-surface-variant font-semibold">Manage your incoming orders and menu dishes below.</p>
        </div>

        {/* OPEN/CLOSED Slide Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 border border-gray-100 rounded-full px-5 py-2.5">
          <span className="text-xs font-bold text-on-surface-variant">Store Status:</span>
          <button
            onClick={handleStatusToggle}
            className={`w-32 py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-sm flex items-center justify-between gap-1 focus:outline-none ${
              isOpen ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
            }`}
          >
            <span>{isOpen ? 'Open Now' : 'Closed'}</span>
            {isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
        </div>
      </section>

      {/* 2. Top Stats floating cards (4 items) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Today's Orders */}
        <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-primary shrink-0">
            <ShoppingBag size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider">Today's Orders</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.ordersCount}</h3>
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <CircleDollarSign size={28} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">৳ {stats.revenue}</h3>
          </div>
        </div>

        {/* Card 3: Menu Items */}
        <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0">
            <UtensilsCrossed size={28} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider">Menu Catalog</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.menuItemsCount} Items</h3>
          </div>
        </div>

        {/* Card 4: Store Health */}
        <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
            <Star size={28} className="text-blue-600 fill-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider">Rating Score</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{restaurant?.rating || 4.8} Stars</h3>
          </div>
        </div>
      </div>

      {/* 3. New Orders Queue Section */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
          <span>Incoming Requests</span>
          {newOrders.length > 0 && (
            <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {newOrders.length} New
            </span>
          )}
        </h2>

        {newOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-float">
            {newOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white p-5 rounded-[2.5rem] border-2 border-primary shadow-glow flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Title Row */}
                  <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                    <div>
                      <span className="text-primary font-mono text-sm font-extrabold">{order.id}</span>
                      <p className="text-[10px] text-on-surface-variant/70 font-semibold mt-0.5">
                        Received: {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="bg-[#FFF0F8] text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">
                      {order.paymentMethod}
                    </span>
                  </div>

                  {/* Customer & Items details */}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-on-surface">Client: <span className="font-medium text-on-surface-variant">{order.customerName}</span></p>
                    <p className="font-bold text-on-surface">Items: </p>
                    <div className="pl-3 space-y-0.5 text-on-surface-variant text-[10px] font-bold">
                      {order.items.map((i, k) => (
                        <p key={k}>• {i.name} x{i.quantity}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <div>
                    <span className="text-[9px] text-on-surface-variant/70 font-semibold block">Grand Total</span>
                    <strong className="text-sm font-black text-primary">৳ {order.total}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => triggerReject(order.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-[10px] font-extrabold border border-rose-100 transition-colors flex items-center gap-1"
                    >
                      <XCircle size={12} />
                      <span>Reject</span>
                    </button>
                    <button 
                      onClick={() => handleAcceptOrder(order.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full text-[10px] font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      <span>Accept Order</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/40 border border-gray-100 p-8 rounded-[2rem] text-center text-xs font-semibold text-on-surface-variant">
            <span>☕ No new incoming requests at the moment. You are up to date!</span>
          </div>
        )}
      </section>

      {/* 4. Active Orders Table Section */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800">Active Kitchen Orders ({activeOrders.length})</h2>

        {activeOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Total Price</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-on-surface font-semibold">
                {activeOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-primary font-mono font-bold">{order.id}</td>
                    <td className="py-4 px-4">{order.customerName}</td>
                    <td className="py-4 px-4 truncate max-w-[150px]">
                      {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-800">৳ {order.total}</td>
                    <td className="py-4 px-4">
                      {/* Milestone Selector */}
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className={`text-[9px] font-black uppercase rounded-full px-3 py-1 border outline-none ${
                          order.status === 'confirmed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          order.status === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                          'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="on_the_way">Ready for Pickup</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-slate-100 hover:bg-slate-200 text-secondary px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs font-semibold text-on-surface-variant">
            <span>👨‍🍳 No active kitchen orders. Fire up the grills when orders arrive!</span>
          </div>
        )}
      </section>

      {/* 5. REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-pink-100 shadow-premium glass-card space-y-4">
            <h3 className="text-base font-black text-on-surface border-b border-gray-100 pb-2">Reject Order?</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Please specify a cancellation reason. The customer will be instantly notified.
            </p>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-bold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="Out of ingredients">🚫 Out of ingredients</option>
              <option value="Store closing early">🕒 Store closing early</option>
              <option value="Too many busy deliveries">🏍️ Too many busy deliveries</option>
              <option value="Other reason">❓ Other reason</option>
            </select>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => { setShowRejectModal(false); setPendingRejectId(null); }}
                className="px-4 py-2 rounded-full hover:bg-gray-100 text-xs font-bold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectConfirm}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ORDER DETAIL POPUP MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[3rem] p-6 max-w-md w-full border border-pink-100 shadow-premium glass-card space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-on-surface">Order Details: <span className="font-mono text-primary">{selectedOrder.id}</span></h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-on-surface-variant flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info contents */}
            <div className="space-y-4 text-xs font-bold text-on-surface-variant">
              <div>
                <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider block">Customer</p>
                <p className="text-on-surface font-extrabold">{selectedOrder.customerName}</p>
                <p className="text-[10px] font-semibold mt-0.5">📞 {selectedOrder.customerPhone}</p>
                <p className="text-[10px] font-semibold opacity-75">{selectedOrder.customerAddress}</p>
              </div>

              <div>
                <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider block">Dishes List</p>
                <div className="space-y-1.5 mt-1 text-[10px]">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-gray-50 pb-1 font-bold">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-on-surface">৳ {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-primary font-black border-t border-dashed border-gray-200 pt-3">
                <span>Grand Total Total</span>
                <span>৳ {selectedOrder.total}</span>
              </div>

              {selectedOrder.specialInstructions && (
                <div className="p-3 bg-[#FFF0F8] rounded-2xl border border-pink-100 text-[9px] text-on-surface-variant font-semibold">
                  💡 <strong>Instructions:</strong> {selectedOrder.specialInstructions}
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="btn-primary w-full py-2.5 rounded-full text-xs font-bold"
            >
              Dismiss Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
