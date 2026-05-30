"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order, Restaurant, User } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, 
  CircleDollarSign, 
  Store, 
  UserRound, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye 
} from 'lucide-react';

export default function AdminDashboardOverview() {
  const { usersList, refreshUsersList, currentUser } = useAuth();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chart toggle
  const [chartMode, setChartMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

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

  // Helper to map DB restaurant to Restaurant interface
  const mapDbRestaurantToRestaurant = (dbRes: any): Restaurant => {
    return {
      id: dbRes.id,
      name: dbRes.name,
      image: dbRes.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=60',
      cuisine: dbRes.cuisine_type || 'Fast Food',
      rating: Number(dbRes.rating || 0),
      deliveryTime: `${dbRes.delivery_time || 30} min`,
      minOrder: Number(dbRes.min_order || 100),
      deliveryFee: Number(dbRes.delivery_fee || 30),
      isOpen: dbRes.is_open,
      ownerEmail: dbRes.email || '',
      address: dbRes.address || '',
      menu: [],
    };
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch orders
      const { data: dbOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders((dbOrders || []).map(mapDbOrderToOrder));

      // Fetch restaurants
      const { data: dbRes, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (resError) throw resError;
      setRestaurants((dbRes || []).map(mapDbRestaurantToRestaurant));

      // Fetch pending restaurants with owner profiles joined
      const { data: dbPending, error: pendingError } = await supabase
        .from('restaurants')
        .select('*, owner:profiles(*)')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;
      setPendingStores(dbPending || []);

      // Refresh users in context
      try {
        await refreshUsersList();
      } catch (e) {}

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hydration Load
  useEffect(() => {
    // Check flash message
    const msg = localStorage.getItem('tf_admin_flash_message');
    if (msg) {
      setFlashMsg(msg);
      localStorage.removeItem('tf_admin_flash_message');
    }

    loadDashboardData();
  }, []);

  // Derive stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const activeResCount = restaurants.filter(r => r.isOpen).length;
    const totalUsersCount = usersList.length;

    return {
      orders: totalOrders,
      revenue: totalRevenue,
      restaurants: activeResCount,
      users: totalUsersCount
    };
  }, [orders, restaurants, usersList]);

  // Handle Approvals
  const handleApprovePartner = async (partner: any) => {
    try {
      // 1. Update restaurant status to active in database
      const { error: restError } = await supabase
        .from('restaurants')
        .update({ status: 'active' })
        .eq('id', partner.id);

      if (restError) throw restError;

      // 2. If there's an owner, update their profile status to active and link the restaurant_id
      if (partner.owner_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            status: 'active',
            restaurant_id: partner.id
          })
          .eq('id', partner.owner_id);

        if (profileError) {
          console.error("Failed to update owner profile status:", profileError);
        }
      }

      await loadDashboardData();
      alert(`🎉 Restaurant "${partner.name}" approved and active!`);
    } catch (err: any) {
      console.error("Approval error:", err);
      alert(`Error approving partner: ${err.message || err}`);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    if (confirm("Reject this restaurant application?")) {
      try {
        const { error } = await supabase
          .from('restaurants')
          .update({ status: 'inactive' })
          .eq('id', partnerId);

        if (error) throw error;

        await loadDashboardData();
        alert("Restaurant application rejected.");
      } catch (err: any) {
        console.error("Rejection error:", err);
        alert(`Error rejecting partner: ${err.message || err}`);
      }
    }
  };

  // Recent transactions list
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  // SVG Chart Bars
  const chartData = useMemo(() => {
    if (chartMode === 'daily') {
      return [
        { label: 'Mon', value: 3400 },
        { label: 'Tue', value: 4100 },
        { label: 'Wed', value: 2900 },
        { label: 'Thu', value: 4900 },
        { label: 'Fri', value: 5800 },
        { label: 'Sat', value: 6800 },
        { label: 'Sun', value: 7200 }
      ];
    } else if (chartMode === 'weekly') {
      return [
        { label: 'Wk 1', value: 18000 },
        { label: 'Wk 2', value: 24000 },
        { label: 'Wk 3', value: 21000 },
        { label: 'Wk 4', value: 34200 }
      ];
    } else {
      return [
        { label: 'Jan', value: 72000 },
        { label: 'Feb', value: 89000 },
        { label: 'Mar', value: 92000 },
        { label: 'Apr', value: 110000 },
        { label: 'May', value: 134200 }
      ];
    }
  }, [chartMode]);

  const maxChartVal = Math.max(...chartData.map(d => d.value)) || 1;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Loading dashboard aggregates...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Top Panel */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-6 rounded-[2rem] border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">System Overview</h1>
          <p className="text-xs text-slate-500 font-semibold">TEDDYFOOD administrative operations terminal and database overview.</p>
        </div>
      </section>

      {/* Access Denied Flash Message */}
      {flashMsg && (
        <div className="p-4 rounded-3xl bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold flex items-center gap-3 animate-bounce">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{flashMsg}</span>
          <button onClick={() => setFlashMsg(null)} className="ml-auto text-rose-400 hover:text-rose-300 font-black">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Stat Cards (Dark Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders */}
        <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="w-10 h-10 bg-pink-950/40 text-primary border border-pink-900/50 rounded-full flex items-center justify-center mb-3">
            <ShoppingBag size={28} className="text-primary" />
          </div>
          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Total Orders</p>
          <h3 className="text-xl font-black text-white mt-1">{stats.orders}</h3>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="w-10 h-10 bg-emerald-950/40 text-emerald-500 border border-emerald-900/50 rounded-full flex items-center justify-center mb-3">
            <CircleDollarSign size={28} className="text-emerald-500" />
          </div>
          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Gross Revenue</p>
          <h3 className="text-xl font-black text-white mt-1">৳ {stats.revenue}</h3>
        </div>

        {/* Restaurants */}
        <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="w-10 h-10 bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 rounded-full flex items-center justify-center mb-3">
            <Store size={28} className="text-indigo-400" />
          </div>
          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Active Stores</p>
          <h3 className="text-xl font-black text-white mt-1">{stats.restaurants} / {restaurants.length}</h3>
        </div>

        {/* Users */}
        <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 shadow-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="w-10 h-10 bg-purple-950/40 text-purple-400 border border-purple-900/50 rounded-full flex items-center justify-center mb-3">
            <UserRound size={28} className="text-purple-400" />
          </div>
          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">System Users</p>
          <h3 className="text-xl font-black text-white mt-1">{stats.users} Users</h3>
        </div>
      </div>

      {/* 3. Mid Block: Charts & Pending Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SVG Revenue Chart */}
        <div className={`${currentUser?.role === 'editor' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-6`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-white">Revenue Performance</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Toggled gross system cashflow metrics.</p>
            </div>
            
            {/* Chart toggle buttons */}
            <div className="flex gap-1 bg-slate-950 border border-slate-800 p-1 rounded-full text-[8px] font-extrabold">
              {['daily', 'weekly', 'monthly'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode as any)}
                  className={`px-3 py-1 rounded-full uppercase transition-all ${
                    chartMode === mode ? 'bg-primary text-white font-black' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Bars */}
          <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-slate-800 pb-2">
            {chartData.map(data => {
              const heightPercent = Math.max(12, (data.value / maxChartVal) * 100);
              return (
                <div key={data.label} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="opacity-0 group-hover:opacity-100 bg-slate-850 text-white text-[8px] font-mono px-1.5 py-0.5 rounded shadow-md border border-slate-700 transition-opacity pointer-events-none mb-1">
                    ৳{data.value}
                  </span>
                  
                  {/* Glowing Pink Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-primary/80 to-primary-hover rounded-t-xl group-hover:shadow-glow transition-all"
                  />
                  
                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Restaurant Partner Approvals (5 cols) */}
        {currentUser?.role !== 'editor' && (
          <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-black text-white">Pending Partners Approval</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Approve or reject new merchant applications.</p>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
              {pendingStores.length > 0 ? (
                pendingStores.map(partner => (
                  <div 
                    key={partner.id}
                    className="bg-slate-950 p-4 rounded-[2rem] border border-slate-850 flex flex-col gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-white">Store: {partner.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Owner: {partner.owner?.full_name || 'Owner'}</p>
                      <p className="text-[9px] text-slate-500 font-semibold truncate">Cuisine: {partner.cuisine_type} | Email: {partner.email || partner.owner?.email || 'N/A'}</p>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-900 pt-2.5">
                      <button
                        onClick={() => handleRejectPartner(partner.id)}
                        className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 px-3.5 py-1.5 rounded-full text-[9px] font-extrabold border border-rose-900/50 transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} className="text-rose-400" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprovePartner(partner)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-[9px] font-extrabold shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} className="text-white" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
                  <span>🛌 No pending merchant applications to review.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 4. Recent Transactions Ledger */}
      <section className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
        <h2 className="text-base font-black text-white">Recent Transactions</h2>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-330 font-semibold">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-4 px-4 text-primary font-mono font-bold">{order.id}</td>
                    <td className="py-4 px-4 font-normal text-slate-500">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-white">{order.customerName}</td>
                    <td className="py-4 px-4">{order.restaurantName}</td>
                    <td className="py-4 px-4 text-right font-black text-white">৳ {order.total}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        order.status === 'delivered' ? 'bg-green-950/20 text-green-400 border-green-900/50' :
                        order.status === 'cancelled' ? 'bg-rose-950/20 text-rose-400 border-rose-900/50' :
                        'bg-amber-950/20 text-amber-400 border-amber-900/50'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-full text-[9px] font-extrabold transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} className="text-white" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-[10px] text-slate-500 font-semibold bg-slate-950/30 rounded-[2rem] p-4">
            <span>No transactions registered in system database.</span>
          </div>
        )}
      </section>

      {/* 5. TRANSACTION MODAL DETAIL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 max-w-md w-full glass-card-dark text-slate-350 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Transaction details:</span> 
                <span className="font-mono text-primary">{selectedOrder.id}</span>
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-500 flex"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-400">
              <div>
                <p className="text-[9px] text-slate-600 uppercase block tracking-wider mb-0.5">Consumer & Logistics</p>
                <p className="text-white font-extrabold">{selectedOrder.customerName}</p>
                <p className="text-[10px] opacity-75">Phone: 📞 {selectedOrder.customerPhone}</p>
                <p className="text-[10px] opacity-75">Address: {selectedOrder.customerAddress}</p>
              </div>

              <div>
                <p className="text-[9px] text-slate-600 uppercase block tracking-wider mb-0.5">Purchased checklist</p>
                <div className="space-y-1 mt-1 text-[10px] text-slate-300">
                  {selectedOrder.items.map((i, k) => (
                    <div key={k} className="flex justify-between border-b border-slate-850 pb-1 font-bold">
                      <span>{i.name} x{i.quantity}</span>
                      <span className="text-white">৳ {i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-primary font-black border-t border-dashed border-slate-800 pt-3">
                <span>Grand Total Received</span>
                <span>৳ {selectedOrder.total}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="btn-primary w-full py-2.5 rounded-full text-xs font-bold"
            >
              Close Ledger details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
