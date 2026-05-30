"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  Bike, 
  ToggleRight, 
  ToggleLeft, 
  UtensilsCrossed, 
  MapPin, 
  Phone, 
  ClipboardCheck, 
  PackageOpen, 
  PackageCheck, 
  PackagePlus 
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const { currentUser } = useAuth();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [earningsToday, setEarningsToday] = useState(350); // mock base commission
  const [isLoading, setIsLoading] = useState(true);

  // Load orders dynamically on mount
  const fetchRiderOrders = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Fetch all orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData) {
        const mappedOrders: Order[] = ordersData.map(o => ({
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
        }));
        
        setOrders(mappedOrders);

        // Derive earnings: delivered orders by this rider * ৳50
        const deliveredByMe = mappedOrders.filter(o => o.riderId === currentUser.id && o.status === 'delivered');
        setEarningsToday(350 + deliveredByMe.length * 50);
      }
    } catch (err) {
      console.error("Failed to load delivery orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderOrders();

    // Check local storage for online status
    const savedOnline = localStorage.getItem(`tf_rider_online_${currentUser?.id}`);
    if (savedOnline) {
      setIsOnline(savedOnline === 'true');
    }
  }, [currentUser]);

  const handleOnlineToggle = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    localStorage.setItem(`tf_rider_online_${currentUser?.id}`, nextVal.toString());
  };

  // Accept Delivery Action
  const handleAcceptDelivery = async (orderId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          rider_id: currentUser.id,
          rider_name: currentUser.name,
          status: 'preparing'
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchRiderOrders();
    } catch (err) {
      console.error("Failed to accept job in Supabase:", err);
      alert("Failed to accept delivery job.");
    }
  };

  // Update shipment stages
  const handleUpdateActiveStage = async (orderId: string, nextStatus: Order['status']) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;

      await fetchRiderOrders();
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
      alert("Failed to update shipment status.");
    }
  };

  // Queues
  // Available orders: confirmed or preparing, and no rider assigned yet
  const availableOrders = useMemo(() => {
    if (!isOnline) return [];
    return orders.filter(o => 
      ['confirmed', 'preparing'].includes(o.status) && 
      (!o.riderId || o.riderId === '')
    );
  }, [orders, isOnline]);

  // Active delivery: assigned to this rider and not yet delivered/cancelled
  const activeDelivery = useMemo(() => {
    if (!currentUser) return null;
    return orders.find(o => 
      o.riderId === currentUser.id && 
      !['delivered', 'cancelled'].includes(o.status)
    ) || null;
  }, [orders, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2">🧸 Loading rider dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Header & Online Toggle */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-pink-100/50 shadow-sm gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 bg-primary-fixed border border-pink-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <Bike size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800">
              Courier Hub: <span className="text-primary">{currentUser?.name}</span>
            </h1>
            <p className="text-xs text-on-surface-variant font-semibold">Deliver food, earn payouts, spread delight.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          {/* Earnings Badge */}
          <div className="bg-[#FFF0F8] border border-pink-100 px-4 py-2 rounded-2xl text-center">
            <span className="text-[9px] font-extrabold text-primary uppercase">Earnings Today</span>
            <p className="text-base font-black text-primary">৳ {earningsToday}</p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-full px-4 py-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Duty Status:</span>
            <button
              onClick={handleOnlineToggle}
              className={`w-28 py-1 px-3 rounded-full text-[9px] font-black uppercase tracking-wider text-white transition-all shadow-xs flex items-center justify-between gap-1 focus:outline-none ${
                isOnline ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-400 hover:bg-slate-500'
              }`}
            >
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              {isOnline ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Active Shipment Tracker */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-slate-800">My Active Shipment</h2>

        {activeDelivery ? (
          <div className="bg-white p-5 rounded-[2.5rem] border-2 border-primary shadow-glow grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left details */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <span className="text-primary font-mono text-sm font-extrabold">{activeDelivery.id}</span>
                  <span className="bg-pink-50 text-primary text-[8px] font-black px-2 py-0.5 rounded-full ml-2 uppercase">
                    ACTIVE ROUTE
                  </span>
                </div>
                <span className="text-slate-800 text-xs font-black">Total Payout: ৳ 50</span>
              </div>

              {/* Addresses details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-on-surface-variant">
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-primary uppercase tracking-wider flex items-center gap-1">
                    <UtensilsCrossed size={12} className="text-primary" />
                    <span>Pickup Restaurant</span>
                  </p>
                  <p className="text-on-surface font-extrabold">{activeDelivery.restaurantName}</p>
                  <p className="text-[10px] font-semibold opacity-75">{activeDelivery.restaurantAddress || "Gulshan Road, Dhaka"}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-green-600 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-green-600" />
                    <span>Delivery Destination</span>
                  </p>
                  <p className="text-on-surface font-extrabold">{activeDelivery.customerName}</p>
                  <p className="text-[10px] font-semibold opacity-75">{activeDelivery.customerAddress}</p>
                  <p className="text-[9px] font-semibold text-primary mt-1 flex items-center gap-0.5">
                    <Phone size={10} className="text-primary" />
                    <span>Call Client: {activeDelivery.customerPhone}</span>
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3 bg-[#FFF0F8]/50 rounded-2xl border border-pink-100/50 text-[10px] font-bold text-on-surface-variant">
                <span className="uppercase text-[9px] text-on-surface-variant/60 flex items-center gap-1 mb-1">
                  <ClipboardCheck size={12} className="text-slate-500" />
                  <span>Package Items checklist</span>
                </span>
                {activeDelivery.items.map((i, k) => (
                  <p key={k}>• {i.name} x{i.quantity}</p>
                ))}
              </div>
            </div>

            {/* Right Interactive Buttons */}
            <div className="md:col-span-4 flex flex-col gap-3 justify-center text-center">
              <p className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Update Delivery milestone</p>
              
              {/* Button 1: Picked Up */}
              <button
                disabled={activeDelivery.status !== 'confirmed' && activeDelivery.status !== 'preparing'}
                onClick={() => handleUpdateActiveStage(activeDelivery.id, 'preparing')}
                className={`py-3 rounded-full text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeDelivery.status === 'confirmed' || activeDelivery.status === 'preparing'
                    ? 'btn-primary active:scale-95'
                    : 'bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed'
                }`}
              >
                <PackageOpen size={16} />
                <span>Step 1: Picked Up</span>
              </button>

              {/* Button 2: On the Way */}
              <button
                disabled={activeDelivery.status !== 'preparing'}
                onClick={() => handleUpdateActiveStage(activeDelivery.id, 'on_the_way')}
                className={`py-3 rounded-full text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeDelivery.status === 'preparing'
                    ? 'btn-primary active:scale-95'
                    : 'bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed'
                }`}
              >
                <Bike size={16} />
                <span>Step 2: On the Way</span>
              </button>

              {/* Button 3: Delivered */}
              <button
                disabled={activeDelivery.status !== 'on_the_way'}
                onClick={() => handleUpdateActiveStage(activeDelivery.id, 'delivered')}
                className={`py-3 rounded-full text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeDelivery.status === 'on_the_way'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                    : 'bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed'
                }`}
              >
                <PackageCheck size={16} />
                <span>Step 3: Delivered!</span>
              </button>

              <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">
                *Order must be picked up first, then shipped, then delivered.
              </span>
            </div>

          </div>
        ) : (
          <div className="bg-white/40 border border-pink-100/50 p-8 rounded-[2rem] text-center text-xs font-semibold text-on-surface-variant glass-card">
            <span>🏖️ You have no active delivery orders. Select a shipment from the available pool below!</span>
          </div>
        )}
      </section>

      {/* 3. Available Orders Pool */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
          <span>Available Delivery Pool</span>
          {availableOrders.length > 0 && (
            <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {availableOrders.length} Available
            </span>
          )}
        </h2>

        {!isOnline ? (
          <div className="bg-white p-8 rounded-[2rem] border border-gray-200 text-center text-xs font-semibold text-on-surface-variant">
            <span>🔴 You are currently OFFLINE. Toggle online duty status in the header to view available jobs.</span>
          </div>
        ) : availableOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableOrders.map(order => (
              <div 
                key={order.id}
                className="bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm flex flex-col justify-between h-72 hover:shadow-lift transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-primary font-mono text-sm font-extrabold">{order.id}</span>
                    <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                      payout: ৳50
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-bold text-on-surface-variant">
                    {/* Pickup */}
                    <div className="flex items-center gap-1.5 truncate">
                      <UtensilsCrossed size={12} className="text-primary shrink-0" />
                      <span>Store: <strong>{order.restaurantName}</strong></span>
                    </div>
                    {/* Drop */}
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="text-green-600 shrink-0" />
                      <span>Client: <strong>{order.customerName}</strong> ({order.customerAddress.split(',')[0]})</span>
                    </div>
                    <div className="text-[10px] text-on-surface-variant/70 mt-1 font-semibold pl-5">
                      Est. Distance: ~ 2.4 km
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptDelivery(order.id)}
                  disabled={!!activeDelivery}
                  className={`w-full py-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    activeDelivery
                      ? 'bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed'
                      : 'btn-primary active:scale-95'
                  }`}
                >
                  <PackagePlus size={16} />
                  <span>Accept Delivery</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/40 border border-gray-100 p-8 rounded-[2rem] text-center text-xs font-semibold text-on-surface-variant">
            <span>😴 All orders are currently assigned or delivered. Relax while we find new shipments!</span>
          </div>
        )}
      </section>

    </div>
  );
}
