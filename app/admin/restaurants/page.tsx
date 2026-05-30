"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Restaurant } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PlusCircle, Search, Pencil, Trash2, ToggleRight, ToggleLeft, X } from 'lucide-react';

type FilterStatus = 'all' | 'active' | 'inactive';

export default function AdminRestaurantsPage() {
  const { currentUser } = useAuth();
  
  // States
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeResId, setActiveResId] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formCuisine, setFormCuisine] = useState('Biryani');
  const [formMinOrder, setFormMinOrder] = useState('200');
  const [formFee, setFormFee] = useState('49');
  const [formImage, setFormImage] = useState('');
  const [formOpen, setFormOpen] = useState(true);

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

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants((data || []).map(mapDbRestaurantToRestaurant));
    } catch (e) {
      console.error("Failed to load restaurants:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Hydration Load
  useEffect(() => {
    loadRestaurants();
  }, []);

  // Toggle Store operations
  const handleToggleStoreOpen = async (resId: string, currentOpen: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: !currentOpen })
        .eq('id', resId);

      if (error) throw error;
      
      // Update local state for instant visual feedback
      setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, isOpen: !currentOpen } : r));
    } catch (e: any) {
      console.error(e);
      alert(`Failed to toggle operation status: ${e.message || e}`);
    }
  };

  // Delete Store
  const handleDeleteStore = async (resId: string) => {
    if (confirm("Permanently delete this restaurant record? This action is irreversible.")) {
      try {
        const { error } = await supabase
          .from('restaurants')
          .delete()
          .eq('id', resId);

        if (error) throw error;
        setRestaurants(prev => prev.filter(r => r.id !== resId));
      } catch (e: any) {
        console.error(e);
        alert(`Failed to delete restaurant: ${e.message || e}`);
      }
    }
  };

  // Filter & Search
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
      
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = r.isOpen;
      else if (statusFilter === 'inactive') matchesStatus = !r.isOpen;

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, searchQuery, statusFilter]);

  // Trigger Add
  const triggerAddModal = () => {
    setIsEditing(false);
    setActiveResId(null);
    setFormName('');
    setFormCuisine('Burgers');
    setFormMinOrder('200');
    setFormFee('49');
    setFormImage('https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=60');
    setFormOpen(true);
    setShowAddEditModal(true);
  };

  // Trigger Edit
  const triggerEditModal = (res: Restaurant) => {
    setIsEditing(true);
    setActiveResId(res.id);
    setFormName(res.name);
    setFormCuisine(res.cuisine);
    setFormMinOrder(res.minOrder.toString());
    setFormFee(res.deliveryFee.toString());
    setFormImage(res.image);
    setFormOpen(res.isOpen);
    setShowAddEditModal(true);
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMinOrder || !formFee) return;

    const minNum = parseInt(formMinOrder);
    const feeNum = parseInt(formFee);

    try {
      if (isEditing && activeResId) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: formName,
            cuisine_type: formCuisine,
            min_order: minNum,
            delivery_fee: feeNum,
            image_url: formImage,
            is_open: formOpen
          })
          .eq('id', activeResId);

        if (error) throw error;
        alert("Restaurant details updated successfully!");
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert({
            name: formName,
            cuisine_type: formCuisine,
            image_url: formImage,
            min_order: minNum,
            delivery_fee: feeNum,
            is_open: formOpen,
            status: 'active', // Admin added stores are active immediately
            rating: 4.5,
            delivery_time: 30
          });

        if (error) throw error;
        alert("Restaurant created successfully!");
      }

      setShowAddEditModal(false);
      await loadRestaurants();
    } catch (e: any) {
      console.error(e);
      alert(`Failed to save restaurant details: ${e.message || e}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Loading restaurants data...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-5 rounded-[2rem] border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">Manage Restaurants</h1>
          <p className="text-xs text-slate-500 font-semibold font-sans">Inspect, modify, delete, and add new restaurants partners.</p>
        </div>

        {currentUser?.role !== 'editor' && (
          <button 
            onClick={triggerAddModal}
            className="btn-primary text-xs px-6 py-3 rounded-full flex items-center gap-1.5 shadow-sm font-extrabold active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Add Restaurant</span>
          </button>
        )}
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores or cuisines..."
            className="w-full rounded-full bg-slate-900 border border-slate-800 py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:border-primary outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar py-1">
          {[
            { id: 'all', label: 'All Partners' },
            { id: 'active', label: 'Active Stores' },
            { id: 'inactive', label: 'Closed Stores' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
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
        {filteredRestaurants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Restaurant Cover</th>
                  <th className="py-3 px-4">Restaurant Name</th>
                  <th className="py-3 px-4">Cuisine</th>
                  <th className="py-3 px-4 text-right">Min Order</th>
                  <th className="py-3 px-4 text-right">Deliv. Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350 font-semibold">
                {filteredRestaurants.map(res => (
                  <tr key={res.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-12 h-8 rounded bg-slate-950 overflow-hidden relative">
                        <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white font-extrabold">{res.name}</td>
                    <td className="py-3 px-4">{res.cuisine}</td>
                    <td className="py-3 px-4 text-right">৳ {res.minOrder}</td>
                    <td className="py-3 px-4 text-right">৳ {res.deliveryFee}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStoreOpen(res.id, res.isOpen)}
                        className={`text-[9px] font-black uppercase rounded-full px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
                          res.isOpen 
                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' 
                            : 'bg-rose-950/20 text-rose-400 border-rose-900/50'
                        }`}
                      >
                        {res.isOpen ? (
                          <>
                            <ToggleRight size={14} className="text-emerald-400" />
                            <span>Open</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} className="text-rose-400" />
                            <span>Closed</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => triggerEditModal(res)}
                          className="bg-slate-850 hover:bg-slate-800 text-white p-2 rounded-full flex hover:text-primary transition-all active:scale-90"
                        >
                          <Pencil size={14} />
                        </button>
                        {currentUser?.role !== 'editor' && (
                          <button 
                            onClick={() => handleDeleteStore(res.id)}
                            className="bg-red-950/20 hover:bg-red-950/40 text-red-400 p-2 rounded-full flex hover:text-red-300 transition-all active:scale-90"
                          >
                            <Trash2 size={14} />
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
            <span className="text-5xl block animate-float">🍽️</span>
            <p className="text-slate-400">No restaurants matching filters found.</p>
          </div>
        )}
      </section>

      {/* ADD / EDIT POPUP MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 max-w-md w-full glass-card-dark text-slate-350 space-y-4 relative">
            <button 
              type="button" 
              onClick={() => setShowAddEditModal(false)}
              className="absolute right-6 top-6 text-slate-500 hover:text-slate-300"
            >
              <X size={16} />
            </button>
            <h3 className="text-sm font-black text-white border-b border-slate-800 pb-2">
              {isEditing ? 'Edit Restaurant Partner' : 'Create Restaurant Partner'}
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Restaurant Name</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              {/* Cuisine */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cuisine Category</label>
                <select
                  value={formCuisine}
                  onChange={(e) => setFormCuisine(e.target.value)}
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                >
                  {['Biryani', 'Bangladeshi', 'Fast Food', 'Pizza', 'Rice Dishes', 'Burgers', 'Cakes', 'Breakfast', 'Drinks'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Min Order & Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Order (৳)</label>
                  <input 
                    type="number" 
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delivery Fee (৳)</label>
                  <input 
                    type="number" 
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Photo Link</label>
                <input 
                  type="text" 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              {/* Status Open */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Immediate operation status open?</span>
                <button
                  type="button"
                  onClick={() => setFormOpen(!formOpen)}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                    formOpen ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="px-4 py-2 rounded-full hover:bg-slate-800 text-xs font-bold text-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-6 py-2.5 rounded-full text-xs font-bold shadow-glow active:scale-95"
              >
                {isEditing ? 'Save Changes' : 'Create Partner'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
