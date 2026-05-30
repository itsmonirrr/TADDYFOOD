"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardCheck, 
  BadgeCheck, 
  ChefHat, 
  Bike, 
  PackageCheck, 
  UtensilsCrossed, 
  MapPin, 
  Star, 
  Phone, 
  MessageCircle, 
  ChevronUp, 
  ChevronDown, 
  X,
  ShieldAlert
} from 'lucide-react';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [eta, setEta] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load of order from Supabase
  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;

        if (data) {
          setOrder({
            id: data.id,
            customerId: data.customer_id || 'guest',
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerAddress: data.customer_address,
            restaurantId: data.restaurant_id || '',
            restaurantName: data.restaurant_name,
            riderId: data.rider_id || undefined,
            riderName: data.rider_name || undefined,
            items: data.items,
            subtotal: Number(data.subtotal),
            deliveryFee: Number(data.delivery_fee),
            discount: Number(data.discount || 0),
            total: Number(data.total),
            status: data.status,
            date: data.created_at,
            paymentMethod: data.payment_method,
            specialInstructions: data.special_instructions || undefined
          });
        }
      } catch (e) {
        console.error("Failed to load order from Supabase:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // 2. Real-time PostgreSQL subscription updates channel for Live Order Tracking
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Real-time order update received from Supabase:', payload.new);
          const newOrder = payload.new;
          setOrder({
            id: newOrder.id,
            customerId: newOrder.customer_id || 'guest',
            customerName: newOrder.customer_name,
            customerPhone: newOrder.customer_phone,
            customerAddress: newOrder.customer_address,
            restaurantId: newOrder.restaurant_id || '',
            restaurantName: newOrder.restaurant_name,
            riderId: newOrder.rider_id || undefined,
            riderName: newOrder.rider_name || undefined,
            items: newOrder.items,
            subtotal: Number(newOrder.subtotal),
            deliveryFee: Number(newOrder.delivery_fee),
            discount: Number(newOrder.discount || 0),
            total: Number(newOrder.total),
            status: newOrder.status,
            date: newOrder.created_at,
            paymentMethod: newOrder.payment_method,
            specialInstructions: newOrder.special_instructions || undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // 3. Reactively calculate ETA based on status updates
  useEffect(() => {
    if (!order) return;

    if (order.status === 'pending') {
      setEta(30);
    } else if (order.status === 'confirmed') {
      setEta(28);
    } else if (order.status === 'preparing') {
      setEta(20);
    } else if (order.status === 'on_the_way') {
      setEta(10);
    } else {
      setEta(0);
    }
  }, [order?.status]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 page-fade-in bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2 text-primary">🧸 Connecting to live order tracker...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 page-fade-in bg-white">
        <span className="text-6xl animate-pulse block mb-4">🧸</span>
        <h3 className="text-base font-bold text-on-surface">Order Record Not Found</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-1">Please verify the Tracking Order ID or go back home.</p>
        <button onClick={() => router.push('/')} className="btn-primary text-xs px-6 py-2.5 rounded-full mt-4">
          Go Back Home
        </button>
      </div>
    );
  }

  // Stepper calculations
  const steps: { label: string; icon: React.ReactNode; statusKey: Order['status'] }[] = [
    { label: 'Order Placed', icon: <ClipboardCheck size={18} />, statusKey: 'pending' },
    { label: 'Confirmed', icon: <BadgeCheck size={18} />, statusKey: 'confirmed' },
    { label: 'Preparing', icon: <ChefHat size={18} />, statusKey: 'preparing' },
    { label: 'On the Way', icon: <Bike size={18} />, statusKey: 'on_the_way' },
    { label: 'Delivered', icon: <PackageCheck size={18} />, statusKey: 'delivered' }
  ];

  const getStepIndex = (status: Order['status']): number => {
    const indices: Record<Order['status'], number> = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 2,
      'on_the_way': 3,
      'delivered': 4,
      'cancelled': -1
    };
    return indices[status];
  };

  const activeIndex = getStepIndex(order.status);

  return (
    <div className="max-w-container-max mx-auto px-4 sm:px-gutter py-6 page-fade-in">
      
      {/* 1. Header Information */}
      <section className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-glass glass-card mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Live Dispatch Tracking</p>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface">
              Order ID: <strong className="text-primary font-mono">{order.id}</strong>
            </h1>
            <p className="text-xs text-on-surface-variant font-semibold">
              Restaurant: <strong className="text-secondary">{order.restaurantName}</strong>
            </p>
          </div>

          <div className="bg-[#FFF0F8] border border-pink-100 p-4 rounded-3xl shrink-0 text-center min-w-[150px]">
            <p className="text-[9px] font-extrabold text-primary uppercase tracking-wider">Estimated Delivery</p>
            {order.status === 'delivered' ? (
              <span className="text-base sm:text-lg font-black text-green-600 block mt-1">🎉 Delivered!</span>
            ) : order.status === 'cancelled' ? (
              <span className="text-base sm:text-lg font-black text-red-600 block mt-1">❌ Cancelled</span>
            ) : (
              <span className="text-xl sm:text-2xl font-black text-primary block mt-1 animate-pulse">
                {eta} mins
              </span>
            )}
          </div>
        </div>

        <hr className="border-pink-50 my-6" />

        {/* 2. Live Animated Stepper Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isPending = idx > activeIndex;

            let stepColorClass = "";
            if (isCompleted) stepColorClass = "border-green-500 bg-green-50 text-green-600";
            else if (isActive) stepColorClass = "border-primary bg-primary-fixed text-primary animate-pulse font-extrabold";
            else stepColorClass = "border-gray-200 bg-gray-50 text-gray-400";

            return (
              <div 
                key={step.label} 
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                  isActive ? 'scale-[1.03] shadow-sm' : 'opacity-85'
                } ${stepColorClass}`}
              >
                <div className="flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-[10px] font-bold text-center mt-2.5">{step.label}</span>
                {isCompleted && (
                  <BadgeCheck size={12} className="text-green-600 font-black mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Columns Section: Simulated Map + Rider Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Simulated Route Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-100 rounded-[2.5rem] h-[350px] relative border border-gray-200/50 overflow-hidden shadow-glass flex items-center justify-center">
            {/* Map Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
            
            {/* Simulated Path Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <path 
                d="M100,100 Q200,200 400,150 T700,250" 
                fill="none" 
                stroke="#E91E8C" 
                strokeWidth="4" 
                strokeDasharray="8,8" 
                className="animate-[dash_10s_linear_infinite]"
              />
            </svg>

            {/* Restaurant Pin using Lucide Utensils */}
            <div className="absolute top-[80px] left-[90px] z-20 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                <UtensilsCrossed size={14} className="text-white" />
              </div>
              <p className="text-[8px] font-bold bg-white text-on-surface px-1.5 py-0.5 rounded shadow-sm mt-1">{order.restaurantName}</p>
            </div>

            {/* Customer Home Pin using Lucide MapPin */}
            <div className="absolute bottom-[80px] right-[90px] z-20 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                <MapPin size={14} className="text-white" />
              </div>
              <p className="text-[8px] font-bold bg-white text-on-surface px-1.5 py-0.5 rounded shadow-sm mt-1">Delivery Destination</p>
            </div>

            {/* Dispatch Rider Node using Lucide Bike */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="absolute top-[160px] left-[320px] z-30 flex flex-col items-center animate-bounce">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lift border-2 border-white">
                  <Bike size={18} className="text-white animate-pulse" />
                </div>
                <p className="text-[8px] font-extrabold bg-primary text-white px-2 py-0.5 rounded-full shadow-sm mt-1">Teddy Rider</p>
              </div>
            )}

            {/* Dynamic Status message floating card */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl shadow-premium border border-pink-100 z-30 flex items-center gap-2 max-w-xs text-[10px] font-bold text-on-surface bg-white">
              <span className="animate-ping w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span>
                {order.status === 'pending' && "Simulating: Waiting for restaurant acceptance..."}
                {order.status === 'confirmed' && "Simulating: Restaurant has accepted your order!"}
                {order.status === 'preparing' && "Simulating: Kitchen is preparing your delicious meal..."}
                {order.status === 'on_the_way' && "Simulating: Rider is on the way to your door!"}
                {order.status === 'delivered' && "Simulating: Order delivered! Enjoy your meal! 🎉"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Rider details card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-[2.5rem] border border-pink-100 shadow-sm glass-card space-y-5 bg-white">
            <h2 className="text-sm font-black text-on-surface border-b border-gray-100 pb-3">Delivery Partner</h2>
            
            {/* Rider Identity Card */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-fixed border-2 border-pink-200 flex items-center justify-center text-3xl overflow-hidden shadow-sm shrink-0">
                🧸
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-on-surface">Teddy Rider</h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span>4.9 Rider Score</span>
                </div>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                  Fastest Courier
                </span>
              </div>
            </div>

            {/* Rider quick call details */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => alert("Simulating: Phone Call to Rider (+8801312345678)")}
                className="btn-secondary w-full py-2.5 rounded-full text-[10px] font-extrabold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
              >
                <Phone size={12} className="text-slate-500" />
                <span>Call Rider</span>
              </button>
              <button 
                onClick={() => alert("Simulating: Live Chat with Rider")}
                className="btn-secondary w-full py-2.5 rounded-full text-[10px] font-extrabold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
              >
                <MessageCircle size={12} className="text-slate-500" />
                <span>Chat Rider</span>
              </button>
            </div>

            <hr className="border-pink-50" />

            {/* Collapse receipt */}
            <div className="space-y-2">
              <button
                onClick={() => setShowReceipt(!showReceipt)}
                className="w-full flex justify-between items-center text-xs font-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
              >
                <span>Order Summary details</span>
                {showReceipt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showReceipt && (
                <div className="p-3 bg-[#FFF0F8]/50 rounded-2xl border border-pink-100/50 space-y-2.5 text-[10px] font-bold text-on-surface-variant max-h-[180px] overflow-y-auto pr-1 hide-scrollbar">
                  {order.items.map(item => (
                    <div key={item.itemId} className="flex justify-between">
                      <span className="truncate max-w-[140px]">{item.name} x{item.quantity}</span>
                      <span>৳ {item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200/50 pt-2 flex justify-between text-on-surface font-extrabold">
                    <span>Subtotal</span>
                    <span>৳ {order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-on-surface font-extrabold">
                    <span>Delivery</span>
                    <span>৳ {order.deliveryFee}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-extrabold">
                      <span>Voucher Discount</span>
                      <span>-৳ {order.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-primary font-black text-xs pt-1.5 border-t border-dashed border-gray-200">
                    <span>Grand Total Paid</span>
                    <span>৳ {order.total}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Help Call */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="btn-primary w-full py-3 rounded-full text-[10px] font-extrabold active:scale-95 shadow-glow"
            >
              Need Support Help?
            </button>
          </div>
        </div>

      </div>

      {/* E. SUPPORT ASSISTANCE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-pink-100 shadow-premium glass-card text-center space-y-5">
            <span className="text-5xl block animate-float">🧸</span>
            <h3 className="text-base font-black text-on-surface">Teddy Support Center</h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Facing issues with your order delivery? Chat with our customer satisfaction agents now.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => { setShowHelpModal(false); alert("Connecting with Support Chat..."); }}
                className="btn-primary w-full py-2.5 rounded-full text-xs font-bold"
              >
                Start Support Chat 💬
              </button>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-full hover:bg-gray-100 text-xs font-bold text-on-surface-variant transition-colors"
              >
                Close Support Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
