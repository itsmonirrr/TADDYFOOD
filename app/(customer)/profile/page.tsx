"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Order, Restaurant } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  MapPin, 
  Heart, 
  Ticket, 
  Pencil, 
  Plus, 
  Trash2, 
  X, 
  Star, 
  Home, 
  Briefcase, 
  RefreshCw 
} from 'lucide-react';

type ProfileTab = 'orders' | 'addresses' | 'favourites' | 'vouchers';

interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  address: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { currentUser } = useAuth();
  const { cartItems, wishlist, toggleWishlist, addToCart, clearCart } = useCart();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
  
  // Tab change hook from url query
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ProfileTab;
    if (tabParam && ['orders', 'addresses', 'favourites', 'vouchers'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressVal, setAddressVal] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Profile Edit State
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');

  // Restaurants State (for Favourites)
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders, addresses, and restaurants dynamically on mount
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone);
    }

    const fetchData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // 1. Fetch Orders
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (ordersErr) throw ordersErr;
        if (ordersData) {
          setOrders(ordersData.map(o => ({
            id: o.id,
            customerId: o.customer_id,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            customerAddress: o.customer_address,
            restaurantId: o.restaurant_id,
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

        // 2. Fetch Saved Addresses
        const { data: addrData, error: addrErr } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('customer_id', currentUser.id);

        if (addrErr) throw addrErr;
        if (addrData) {
          setAddresses(addrData.map(a => ({
            id: a.id,
            label: a.label,
            address: a.address
          })));
        }

        // 3. Fetch Restaurants List for Favourites
        const { data: resData, error: resErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('status', 'active');

        if (resErr) throw resErr;
        if (resData) {
          const mapped: Restaurant[] = resData.map(r => ({
            id: r.id,
            name: r.name,
            image: r.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=60',
            cuisine: r.cuisine_type || 'Fast Food',
            rating: Number(r.rating) || 4.5,
            deliveryTime: `${r.delivery_time || 30} min`,
            minOrder: Number(r.min_order) || 100,
            deliveryFee: Number(r.delivery_fee) || 30,
            isOpen: r.is_open,
            isSuper: Number(r.rating) >= 4.7,
            ownerEmail: r.email || '',
            menu: []
          }));
          setRestaurantsList(mapped);
        }

        // 4. Fetch Active Vouchers
        const { data: voucherData, error: voucherErr } = await supabase
          .from('vouchers')
          .select('*')
          .eq('is_active', true);

        if (voucherErr) throw voucherErr;
        if (voucherData) {
          setVouchers(voucherData);
        }
      } catch (err) {
        console.error('Failed to load profile details from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Profile update save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileName,
          phone: profilePhone
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update session locally
      const updatedSession = { ...currentUser, name: profileName, phone: profilePhone };
      localStorage.setItem('tf_active_user', JSON.stringify(updatedSession));
      
      // Reload page to reflect context header changes
      window.location.reload();
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile.');
    }
    setShowProfileEdit(false);
  };

  // Filtered historic orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'active') return ['pending', 'confirmed', 'preparing', 'on_the_way'].includes(o.status);
    if (orderFilter === 'completed') return o.status === 'delivered';
    if (orderFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  // Reorder pipeline
  const handleReorder = async (order: Order) => {
    try {
      const { data: menuData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', order.restaurantId);

      if (error || !menuData) {
        alert("Restaurant menu is no longer available.");
        return;
      }

      const res = restaurantsList.find(r => r.id === order.restaurantId);
      if (!res) {
        alert("Restaurant is no longer available.");
        return;
      }

      // 2. Clear current cart
      clearCart();

      // 3. Add all items back into cart
      let success = true;
      order.items.forEach(item => {
        const menuItemMatch = menuData.find(m => m.id === item.itemId);
        if (menuItemMatch) {
          addToCart({
            id: menuItemMatch.id,
            name: menuItemMatch.name,
            description: menuItemMatch.description || '',
            price: Number(menuItemMatch.price),
            category: menuItemMatch.category,
            image: menuItemMatch.image_url || '',
            isAvailable: menuItemMatch.is_available
          }, res);
        } else {
          success = false;
        }
      });

      if (success) {
        router.push('/checkout');
      } else {
        alert("Some items were out of stock but the rest are loaded!");
        router.push('/checkout');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reorder.");
    }
  };

  // Address CRUD operations
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressVal || !currentUser) return;

    try {
      if (editingAddressId) {
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            label: addressLabel,
            address: addressVal,
            area: 'Dhanmondi'
          })
          .eq('id', editingAddressId);

        if (error) throw error;

        setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...a, label: addressLabel, address: addressVal } : a));
      } else {
        const { data, error } = await supabase
          .from('saved_addresses')
          .insert({
            customer_id: currentUser.id,
            label: addressLabel,
            address: addressVal,
            area: 'Dhanmondi'
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setAddresses(prev => [...prev, {
            id: data.id,
            label: data.label,
            address: data.address
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Failed to save address.');
    }

    // Reset Form
    setAddressVal('');
    setAddressLabel('Home');
    setEditingAddressId(null);
    setShowAddressModal(false);
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressLabel(addr.label);
    setAddressVal(addr.address);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (confirm("Delete this saved address?")) {
      try {
        const { error } = await supabase
          .from('saved_addresses')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error('Failed to delete address:', err);
        alert('Failed to delete address.');
      }
    }
  };

  // Favourites loader
  const favouritedRestaurants = restaurantsList.filter(r => wishlist.includes(r.id));

  // Copy voucher trigger
  const [copyCodeText, setCopyCodeText] = useState<Record<string, string>>({});
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyCodeText(prev => ({ ...prev, [code]: 'Copied! ✓' }));
    setTimeout(() => {
      setCopyCodeText(prev => ({ ...prev, [code]: '' }));
    }, 2000);
  };

  return (
    <div className="max-w-container-max mx-auto px-4 sm:px-gutter py-6 page-fade-in">
      
      {/* 1. Header Profile block */}
      <section className="bg-gradient-to-r from-pink-50 to-[#FFF0F8] p-6 sm:p-10 rounded-[2.5rem] border border-white/40 shadow-glass mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-float"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar block */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-fixed border-4 border-white flex items-center justify-center text-4xl overflow-hidden shadow-md">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                '🧸'
              )}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">{currentUser?.name}</h1>
              <p className="text-xs sm:text-sm text-on-surface-variant font-semibold">{currentUser?.email}</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                  {currentUser?.role} account
                </span>
                <span className="text-[10px] text-on-surface-variant font-semibold">📞 {currentUser?.phone}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowProfileEdit(true)}
            className="btn-secondary text-xs px-6 py-2.5 rounded-full flex items-center gap-1 border border-pink-200"
          >
            <Pencil size={12} />
            <span>Edit Profile</span>
          </button>
        </div>
      </section>

      {/* 2. TAB TOGGLE BUTTONS */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-8 hide-scrollbar border-b border-gray-100">
        {[
          { id: 'orders', label: 'My Orders', icon: <Package size={14} className="inline mr-1.5" /> },
          { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={14} className="inline mr-1.5" /> },
          { id: 'favourites', label: 'Favourites', icon: <Heart size={14} className="inline mr-1.5" /> },
          { id: 'vouchers', label: 'Vouchers', icon: <Ticket size={14} className="inline mr-1.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-glow'
                : 'bg-white hover:bg-[#FFF0F8] text-on-surface-variant hover:text-primary border border-pink-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. CONDITIONAL TABS VIEWS */}
      <div className="min-h-[40vh]">
        
        {/* TAB 1: MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <h2 className="text-base font-black text-on-surface">Order History ({filteredOrders.length})</h2>
              {/* Order filter tags */}
              <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      orderFilter === f.id
                        ? 'bg-primary-fixed text-primary border border-pink-200'
                        : 'bg-white text-on-surface-variant hover:bg-gray-50 border border-gray-200/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOrders.map(order => {
                  const isActive = ['pending', 'confirmed', 'preparing', 'on_the_way'].includes(order.status);
                  return (
                    <div 
                      key={order.id}
                      className="glass-card rounded-[2rem] p-5 border border-pink-50 relative flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        {/* Title Row */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-on-surface">{order.restaurantName}</h3>
                            <p className="text-[9px] text-on-surface-variant/70 font-semibold">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.status === 'delivered' ? 'bg-green-50 text-green-600 border border-green-100' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-primary-fixed text-primary border border-pink-100 animate-pulse'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Items preview */}
                        <div className="text-[10px] text-on-surface-variant font-medium space-y-0.5 py-1">
                          {order.items.map((i, k) => (
                            <p key={k} className="truncate">• {i.name} x{i.quantity}</p>
                          ))}
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                        <div>
                          <p className="text-[9px] text-on-surface-variant/70 font-semibold">Total Paid</p>
                          <p className="text-sm font-black text-primary">৳ {order.total}</p>
                        </div>

                        <div className="flex gap-2">
                          {isActive && (
                            <Link 
                              href={`/tracking/${order.id}`}
                              className="btn-secondary px-4 py-2 rounded-full text-[10px] font-extrabold"
                            >
                              Track Live
                            </Link>
                          )}
                          <button
                            onClick={() => handleReorder(order)}
                            className="btn-primary px-4 py-2 rounded-full text-[10px] font-extrabold"
                          >
                            Reorder 🧸
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/40 border border-pink-50 rounded-[2.5rem] p-8 glass-card">
                <Package className="mx-auto text-primary animate-float mb-3" size={48} />
                <p className="text-xs font-bold text-on-surface">No Orders Found</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">You don't have any orders matching this filter.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-on-surface">Address Manager</h2>
              <button 
                onClick={() => { setEditingAddressId(null); setAddressVal(''); setAddressLabel('Home'); setShowAddressModal(true); }}
                className="btn-primary text-xs px-5 py-2.5 rounded-full flex items-center gap-1 active:scale-95"
              >
                <Plus size={14} />
                <span>Add New Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div 
                  key={addr.id}
                  className="bg-white/50 p-5 rounded-[2rem] border border-pink-50 shadow-sm glass-card flex justify-between items-start gap-4"
                >
                  <div className="space-y-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                      addr.label === 'Home' ? 'bg-[#FFF0F8] text-primary' :
                      addr.label === 'Work' ? 'bg-secondary-container text-on-secondary-container' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {addr.label === 'Home' ? <Home size={10} /> : addr.label === 'Work' ? <Briefcase size={10} /> : <MapPin size={10} />}
                      <span>{addr.label}</span>
                    </span>
                    <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
                      {addr.address}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditAddress(addr)}
                      className="p-2 rounded-full hover:bg-gray-100 text-secondary hover:text-primary transition-colors flex items-center justify-center"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FAVOURITES */}
        {activeTab === 'favourites' && (
          <div className="space-y-6">
            <h2 className="text-base font-black text-on-surface">My Favourite Places</h2>
            
            {favouritedRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {favouritedRestaurants.map(res => (
                  <div 
                    key={res.id}
                    className="glass-card rounded-[2rem] p-3 flex flex-col gap-3 cursor-pointer card-hover relative group border border-pink-50"
                  >
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100">
                      <Link href={`/restaurant/${res.id}`} className="absolute inset-0 z-0">
                        <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
                      </Link>
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(res.id); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center shadow-md z-10 hover:bg-red-50"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <Link href={`/restaurant/${res.id}`} className="px-1.5 pb-1 space-y-1 block">
                      <h3 className="text-xs font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{res.name}</h3>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-on-surface-variant">
                        <span className="bg-[#FFF0F8] text-primary px-1.5 py-0.5 rounded-md font-semibold">{res.cuisine}</span>
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span>{res.rating}</span>
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/40 border border-pink-50 rounded-[2.5rem] p-8 glass-card">
                <Heart className="mx-auto text-primary animate-float mb-3" size={48} />
                <p className="text-xs font-bold text-on-surface">No Favourites Yet</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Toggle the heart icon on any restaurant card to save it here.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <h2 className="text-base font-black text-on-surface">Active Voucher Coupons</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {vouchers.map((v: any) => (
                <div 
                  key={v.code}
                  className="bg-[#FFF0F8] p-5 rounded-[2rem] border border-pink-100 shadow-sm glass-card flex flex-col justify-between h-40 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-md"></div>
                  
                  <div className="space-y-2">
                    <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full inline-block">
                      OFFER ACTIVE
                    </span>
                    <h3 className="text-sm font-black text-on-surface">Discount ৳ {v.discount} Flat</h3>
                    <p className="text-[10px] text-on-surface-variant/80 font-medium leading-relaxed">
                      {v.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-pink-100/50 pt-3">
                    <span className="font-mono text-xs font-extrabold text-primary tracking-wide select-all">{v.code}</span>
                    <button 
                      onClick={() => handleCopyCode(v.code)}
                      className="btn-primary px-4 py-1.5 rounded-full text-[9px] font-extrabold shrink-0"
                    >
                      {copyCodeText[v.code] || 'Copy Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* F. PROFILE EDIT MODAL */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-pink-100 shadow-premium glass-card space-y-4">
            <h3 className="text-base font-black text-on-surface border-b border-gray-100 pb-2">Edit Customer Profile</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Contact Phone Number</label>
                <input 
                  type="text" 
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setShowProfileEdit(false)}
                className="px-4 py-2 rounded-full hover:bg-gray-100 text-xs font-bold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-5 py-2.5 rounded-full text-xs font-bold"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* G. ADDRESS MODAL ADD/EDIT */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveAddress} className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-pink-100 shadow-premium glass-card space-y-4">
            <h3 className="text-base font-black text-on-surface border-b border-gray-100 pb-2">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Address Tag Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressLabel(lbl as any)}
                      className={`flex-1 py-2 rounded-full text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                        addressLabel === lbl
                          ? 'border-primary bg-[#FFF0F8] text-primary font-black'
                          : 'border-pink-50 text-on-surface-variant hover:bg-gray-50'
                      }`}
                    >
                      {lbl === 'Home' ? <Home size={10} /> : lbl === 'Work' ? <Briefcase size={10} /> : <MapPin size={10} />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Delivery Address details</label>
                <textarea 
                  value={addressVal}
                  onChange={(e) => setAddressVal(e.target.value)}
                  placeholder="Street details, house, sector etc..."
                  rows={3}
                  className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 rounded-full hover:bg-gray-100 text-xs font-bold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-5 py-2.5 rounded-full text-xs font-bold"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
