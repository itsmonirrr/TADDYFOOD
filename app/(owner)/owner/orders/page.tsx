"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { Search, X } from 'lucide-react';

type OrderTab = 'all' | 'new' | 'active' | 'completed' | 'cancelled';

export default function OwnerOrdersPage() {
  const { currentUser } = useAuth();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load of store-specific orders from Supabase
  useEffect(() => {
    const fetchMerchantOrders = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Fetch restaurant
        const { data: resData, error: resErr } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', currentUser.id)
          .single();

        if (resErr || !resData) {
          throw resErr || new Error("Restaurant not found");
        }

        // Fetch orders
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
        console.error("Failed to load merchant orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantOrders();
  }, [currentUser]);

  // Sync state helper (Supabase update)
  const syncOrderChange = async (updated: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: updated.status })
        .eq('id', updated.id);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
      alert("Failed to update order status.");
    }
  };

  // 2. Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = o.id.toLowerCase().includes(q) || 
                            o.customerName.toLowerCase().includes(q) ||
                            o.items.some(i => i.name.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'new') matchesTab = o.status === 'pending';
      else if (activeTab === 'active') matchesTab = ['confirmed', 'preparing', 'on_the_way'].includes(o.status);
      else if (activeTab === 'completed') matchesTab = o.status === 'delivered';
      else if (activeTab === 'cancelled') matchesTab = o.status === 'cancelled';

      return matchesSearch && matchesTab;
    });
  }, [orders, activeTab, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2">🧸 Loading active orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[2rem] border border-pink-100/50 shadow-sm gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Orders Management</h1>
          <p className="text-xs text-on-surface-variant font-semibold">Track and update the live status of all incoming food shipments.</p>
        </div>
      </section>

      {/* 2. Search & Tab Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Client..."
            className="w-full rounded-full bg-white border border-pink-100 py-2.5 pl-10 pr-4 text-xs font-semibold focus:border-primary outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
        </div>

        {/* State tabs */}
        <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar self-start md:self-auto py-1">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'new', label: 'New Queue' },
            { id: 'active', label: 'Active Kitchen' },
            { id: 'completed', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-fixed text-primary border-pink-200 shadow-sm font-black'
                  : 'bg-white text-on-surface-variant hover:bg-gray-50 border-pink-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Table Ledger */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-on-surface font-semibold">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-primary font-mono font-bold">{order.id}</td>
                    <td className="py-4 px-4 font-normal text-on-surface-variant/80">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">{order.customerName}</td>
                    <td className="py-4 px-4 truncate max-w-[150px]">
                      {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-800">৳ {order.total}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-slate-100 hover:bg-slate-200 text-secondary px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-colors"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <span className="text-5xl block animate-float">📦</span>
            <p className="text-xs font-bold text-on-surface">No Orders Found</p>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">There are no records matching your active filters.</p>
          </div>
        )}
      </section>

      {/* 4. DETAILS DRAWER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[3rem] p-6 max-w-md w-full border border-pink-100 shadow-premium glass-card space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-on-surface">
                Order details: <span className="font-mono text-primary">{selectedOrder.id}</span>
              </h3>
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
                <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider block">Customer Information</p>
                <p className="text-on-surface font-extrabold">{selectedOrder.customerName}</p>
                <p className="text-[10px] font-semibold mt-0.5">Phone: 📞 {selectedOrder.customerPhone}</p>
                <p className="text-[10px] font-semibold opacity-75">Address: {selectedOrder.customerAddress}</p>
              </div>

              <div>
                <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider block">Items list</p>
                <div className="space-y-1.5 mt-1.5 text-[10px]">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-gray-50 pb-1 font-bold">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-on-surface">৳ {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Trigger in details panel */}
              {['confirmed', 'preparing', 'on_the_way'].includes(selectedOrder.status) && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-wider block">Modify Active Stage</p>
                  <div className="flex gap-2 mt-1">
                    {['confirmed', 'preparing', 'on_the_way'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const updated = { ...selectedOrder, status: st as any };
                          syncOrderChange(updated);
                        }}
                        className={`flex-1 py-1.5 rounded-full text-[9px] font-extrabold transition-all border capitalize ${
                          selectedOrder.status === st 
                            ? 'bg-primary text-white border-primary shadow-sm font-black' 
                            : 'bg-white border-pink-50 hover:bg-pink-50/50 text-secondary'
                        }`}
                      >
                        {st === 'on_the_way' ? 'Ready' : st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Tally */}
              <div className="space-y-1.5 text-[10px] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳ {selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span>৳ {selectedOrder.deliveryFee}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount code applied</span>
                    <span>-৳ {selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-primary font-black text-xs pt-2 border-t border-dashed border-gray-200">
                  <span>Grand Total Received</span>
                  <span>৳ {selectedOrder.total}</span>
                </div>
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
