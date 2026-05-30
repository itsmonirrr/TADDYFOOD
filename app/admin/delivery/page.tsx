"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { UtensilsCrossed, MapPin, Bike } from 'lucide-react';

export default function AdminDeliveryPage() {
  const { usersList, refreshUsersList } = useAuth();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
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

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(mapDbOrderToOrder));

      await refreshUsersList();
    } catch (e) {
      console.error("Failed to load orders for delivery overview:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Hydration Load
  useEffect(() => {
    loadOrders();
  }, []);

  // Filter couriers
  const activeRiders = useMemo(() => {
    return usersList.filter(u => u.role === 'delivery' && u.status !== 'Banned');
  }, [usersList]);

  // Assign Rider Action
  const handleAssignRider = async (orderId: string, riderId: string) => {
    if (!riderId) return;

    const matchedRider = activeRiders.find(r => r.id === riderId);
    if (!matchedRider) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          rider_id: matchedRider.id,
          rider_name: matchedRider.name,
          status: 'preparing' // Kickstart preparation
        })
        .eq('id', orderId);

      if (error) throw error;
      
      alert(`🎉 Rider "${matchedRider.name}" dispatched to Order ID: ${orderId}`);
      await loadOrders();
    } catch (e: any) {
      console.error(e);
      alert(`Failed to assign rider: ${e.message || e}`);
    }
  };

  // Queues
  const unassignedOrders = orders.filter(o => 
    ['pending', 'confirmed'].includes(o.status) && 
    (!o.riderId || o.riderId === '')
  );

  const activeDeliveries = orders.filter(o => 
    o.riderId && o.riderId !== '' && 
    ['preparing', 'on_the_way'].includes(o.status)
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Loading logistics aggregates...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-300">
      
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-5 rounded-[2rem] border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">Logistics & Dispatches</h1>
          <p className="text-xs text-slate-500 font-semibold font-sans">Dispatch available riders to unassigned incoming shipments.</p>
        </div>
      </section>

      {/* Grid Layout: Dispatch Panel + Active Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Dispatch Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-black text-white">Unassigned Orders Dispatch</h2>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Dispatches couriers to orders currently missing a rider.</p>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
            {unassignedOrders.length > 0 ? (
              unassignedOrders.map(order => (
                <div 
                  key={order.id}
                  className="bg-slate-950 p-4 rounded-[2rem] border border-slate-8850 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-primary font-mono text-xs font-extrabold">{order.id}</span>
                    <span className="text-white text-[10px] font-black">৳ {order.total}</span>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <UtensilsCrossed size={12} className="text-slate-500" />
                      <p><strong>Store:</strong> {order.restaurantName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-500" />
                      <p><strong>Drop:</strong> {order.customerName} ({order.customerAddress.split(',')[0]})</p>
                    </div>
                  </div>

                  {/* Rider Assign Dropdown Selector */}
                  <div className="pt-2 border-t border-slate-900 flex gap-2 items-center">
                    <select
                      onChange={(e) => handleAssignRider(order.id, e.target.value)}
                      defaultValue=""
                      className="flex-1 rounded-full bg-slate-900 border border-slate-800 py-1.5 px-3 text-[10px] font-extrabold text-white focus:border-primary outline-none"
                    >
                      <option value="" disabled>Select available courier...</option>
                      {activeRiders.map(rider => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} ({rider.deliveryArea || 'All Zones'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
                <span>🛌 All active transactions have dispatched riders assigned!</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Delivery Routes (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-black text-white">Active Delivery Routes</h2>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Live shipping progress of assigned riders.</p>
          </div>

          {activeDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Store</th>
                    <th className="py-3 px-4">Rider Dispatched</th>
                    <th className="py-3 px-4">Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-355 font-semibold">
                  {activeDeliveries.map(order => (
                    <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="py-3.5 px-4 text-primary font-mono font-bold">{order.id}</td>
                      <td className="py-3.5 px-4 text-white">{order.restaurantName}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-extrabold flex items-center gap-1.5">
                        <Bike size={12} className="text-slate-500 animate-pulse" />
                        <span>{order.riderName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          order.status === 'on_the_way' 
                            ? 'bg-blue-950/20 text-blue-400 border-blue-900/50 animate-pulse' 
                            : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/50'
                        }`}>
                          {order.status === 'on_the_way' ? 'SHIPPED' : 'PICKUP READY'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
              <span>😴 No active dispatch couriers on the roads currently.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
