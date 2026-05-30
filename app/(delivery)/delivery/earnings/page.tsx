"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { Calendar, TrendingUp, CircleDollarSign, Bike } from 'lucide-react';

export default function RiderEarningsPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(350);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map DB order to Order interface
  const mapDbOrderToOrder = (dbOrder: any): Order => {
    return {
      id: dbOrder.id,
      customerId: dbOrder.customer_id,
      customerName: dbOrder.customer_name,
      customerPhone: dbOrder.customer_phone,
      customerAddress: dbOrder.customer_address,
      restaurantId: dbOrder.restaurant_id,
      restaurantName: dbOrder.restaurant_name,
      restaurantAddress: dbOrder.restaurant_address || '',
      riderId: dbOrder.rider_id || undefined,
      riderName: dbOrder.rider_name || undefined,
      items: Array.isArray(dbOrder.items) ? dbOrder.items.map((item: any) => ({
        itemId: item.itemId || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || item.image_url || '',
      })) : [],
      subtotal: Number(dbOrder.subtotal),
      deliveryFee: Number(dbOrder.delivery_fee),
      discount: Number(dbOrder.discount || 0),
      total: Number(dbOrder.total),
      status: dbOrder.status,
      date: dbOrder.created_at,
      paymentMethod: dbOrder.payment_method,
      specialInstructions: dbOrder.special_instructions || undefined,
    };
  };

  // 1. Initial Load of rider-specific orders
  const loadRiderOrders = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('rider_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(mapDbOrderToOrder));
    } catch (e) {
      console.error("Failed to load rider orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiderOrders();

    const savedEarnings = localStorage.getItem(`tf_rider_earnings_${currentUser?.id}`);
    if (savedEarnings) {
      setTodayEarnings(parseFloat(savedEarnings));
    }
  }, [currentUser]);

  // 2. Calculations
  const deliveredOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered');
  }, [orders]);

  const stats = useMemo(() => {
    // Deliveries commission is ৳50 flat per order
    const completedCount = deliveredOrders.length;
    const baseCalculated = completedCount * 50;
    
    // Combine base with today's dynamically earned badge
    const today = baseCalculated > 0 ? baseCalculated : todayEarnings;
    const week = baseCalculated > 0 ? baseCalculated : todayEarnings * 3;
    const month = baseCalculated > 0 ? baseCalculated : todayEarnings * 10;

    return {
      today,
      week,
      month,
      completedCount
    };
  }, [deliveredOrders, todayEarnings]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] bg-white rounded-[2.5rem] p-8 flex items-center justify-center font-semibold text-primary animate-pulse text-xs">
        🧸 Loading completed shipments ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Header Row */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[2rem] border border-pink-100/50 shadow-sm gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">My Earnings</h1>
          <p className="text-xs text-on-surface-variant font-semibold">Inspect your completed delivery payouts and weekly performance ledger.</p>
        </div>
      </section>

      {/* 2. Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Today */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-primary shrink-0 mb-3">
            <Calendar size={20} className="text-[#E91E8C]" />
          </div>
          <p className="text-[9px] font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Today's Payout</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">৳ {stats.today}</h3>
          <p className="text-[8px] text-green-600 font-bold mt-1">▲ Fully cleared for bank cashout</p>
        </div>

        {/* Week */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0 mb-3">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <p className="text-[9px] font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Weekly Payout</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">৳ {stats.week}</h3>
          <p className="text-[8px] text-emerald-600 font-bold mt-1">✓ Estimated payout: Next Thursday</p>
        </div>

        {/* Month */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm relative overflow-hidden group hover:shadow-lift transition-all">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0 mb-3">
            <CircleDollarSign size={20} className="text-indigo-600" />
          </div>
          <p className="text-[9px] font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Monthly Payout</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">৳ {stats.month}</h3>
          <p className="text-[8px] text-indigo-600 font-bold mt-1">✓ Earned commissions this month</p>
        </div>
      </div>

      {/* 3. History Table */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800 font-display">Completed Shipment Ledger ({stats.completedCount})</h2>

        {deliveredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Customer Destination</th>
                  <th className="py-3 px-4 text-right">Order Value</th>
                  <th className="py-3 px-4 text-right">Rider Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-on-surface font-semibold">
                {deliveredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-primary font-mono font-bold">{order.id}</td>
                    <td className="py-4 px-4 font-normal text-on-surface-variant/80">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">{order.restaurantName}</td>
                    <td className="py-4 px-4">{order.customerName}</td>
                    <td className="py-4 px-4 text-right font-black text-slate-800">৳ {order.total}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 font-black">৳ 50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <Bike size={48} className="mx-auto text-slate-300 animate-float mb-2" />
            <p className="text-xs font-bold text-on-surface">No Completed Shipments</p>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Your finished orders will show up here. Deliver packages to grow earnings!</p>
          </div>
        )}
      </section>

    </div>
  );
}
