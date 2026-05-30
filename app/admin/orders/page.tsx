"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Search, Eye, Ban, X } from 'lucide-react';

type OrderStatusFilter = 'all' | 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export default function AdminOrdersPage() {
  const { currentUser } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
    } catch (e) {
      console.error("Failed to load orders for administrative list:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadOrders();
  }, []);

  // Sync state & update DB
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;

      alert(`🎉 Order "${orderId}" status modified to: ${nextStatus}`);
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      
      // Update selected modal details if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch(e: any) {
      console.error(e);
      alert(`Failed to update order status: ${e.message || e}`);
    }
  };

  const handleCancelOrder = (order: Order) => {
    if (confirm(`Cancel Order "${order.id}" permanently?`)) {
      handleUpdateOrderStatus(order.id, 'cancelled');
    }
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = o.id.toLowerCase().includes(q) || 
                            o.customerName.toLowerCase().includes(q) ||
                            o.restaurantName.toLowerCase().includes(q);
      
      let matchesStatus = true;
      if (statusFilter !== 'all') matchesStatus = o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Loading orders ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-5 rounded-[2rem] border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">System Orders Center</h1>
          <p className="text-xs text-slate-500 font-semibold font-sans">Inspect gross system transactions, verify logistic pipelines, and override statuses.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Client, Store..."
            className="w-full rounded-full bg-slate-900 border border-slate-800 py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:border-primary outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar py-1">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'on_the_way', label: 'Shipping' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-primary text-white border-primary shadow-sm font-black'
                  : 'bg-slate-900 text-slate-500 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Table grid */}
      <section className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Courier Rider</th>
                  <th className="py-3 px-4 text-right">Total Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-330 font-semibold">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-4 px-4 text-primary font-mono font-bold">{order.id}</td>
                    <td className="py-4 px-4 text-white">{order.customerName}</td>
                    <td className="py-4 px-4">{order.restaurantName}</td>
                    <td className="py-4 px-4">
                      {order.riderName ? (
                        <span className="text-slate-400 font-bold">🏍️ {order.riderName}</span>
                      ) : (
                        <span className="text-amber-500 font-bold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-white">৳ {order.total}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        order.status === 'delivered' ? 'bg-green-950/20 text-green-400 border-green-900/50' :
                        order.status === 'cancelled' ? 'bg-rose-950/20 text-rose-400 border-rose-900/50' :
                        'bg-amber-950/20 text-amber-400 border-amber-900/50 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <Eye size={12} className="text-white" />
                          <span>View</span>
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && currentUser?.role !== 'editor' && (
                          <button 
                            onClick={() => handleCancelOrder(order)}
                            className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold border border-rose-900/50 transition-colors flex items-center gap-1 active:scale-95"
                          >
                            <Ban size={12} className="text-rose-400" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
            <span className="text-5xl block animate-float">📦</span>
            <p className="text-slate-400">No orders logged matching this status filter.</p>
          </div>
        )}
      </section>

      {/* DETAIL OVERVIEW MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 max-w-md w-full glass-card-dark text-slate-350 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Transaction audit:</span> 
                <span className="font-mono text-primary">{selectedOrder.id}</span>
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-slate-855 text-slate-500 flex"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-400">
              {/* Logistics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Consumer Details</p>
                  <p className="text-white font-extrabold">{selectedOrder.customerName}</p>
                  <p className="text-[9px] opacity-75">📞 {selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Logistics Courier</p>
                  <p className="text-white font-extrabold">{selectedOrder.riderName || 'Unassigned Rider'}</p>
                </div>
              </div>

              {/* Items checklist */}
              <div>
                <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Dishes Audit</p>
                <div className="space-y-1.5 mt-1.5 text-[10px] text-slate-300">
                  {selectedOrder.items.map((i, k) => (
                    <div key={k} className="flex justify-between border-b border-slate-850 pb-1 font-bold">
                      <span>{i.name} x{i.quantity}</span>
                      <span className="text-white">৳ {i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Override controls */}
              {currentUser?.role !== 'editor' && (
                <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                  <p className="text-[8.5px] text-slate-500 uppercase tracking-wider block font-bold">Manual Status Override</p>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, st as any)}
                        className={`py-1.5 rounded-full text-[8.5px] font-extrabold transition-all border capitalize ${
                          selectedOrder.status === st 
                            ? 'bg-primary text-white border-primary font-black shadow-sm' 
                            : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {st === 'on_the_way' ? 'Shipped' : st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tally */}
              <div className="flex justify-between text-primary font-black border-t border-dashed border-slate-850 pt-3">
                <span>Grand Total</span>
                <span>৳ {selectedOrder.total}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="btn-primary w-full py-2.5 rounded-full text-xs font-bold shadow-glow"
            >
              Dismiss audit details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
