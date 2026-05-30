"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MenuItem, Restaurant } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { Plus, Search, ToggleRight, ToggleLeft, Pencil, Trash2 } from 'lucide-react';

export default function OwnerMenuPage() {
  const { currentUser } = useAuth();
  
  // States
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // Add/Edit Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Recommended');
  const [formImage, setFormImage] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);

  // 1. Initial Load of store-specific menu from Supabase
  useEffect(() => {
    const fetchMerchantMenu = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Fetch restaurant
        const { data: resData, error: resErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', currentUser.id)
          .single();

        if (resErr || !resData) {
          throw resErr || new Error("Restaurant not found");
        }

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
          menu: []
        };
        setRestaurant(mappedRes);

        // Fetch menu items
        const { data: menuData, error: menuErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.id);

        if (menuErr) throw menuErr;

        if (menuData) {
          setMenuItems(menuData.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            price: Number(m.price),
            category: m.category || 'General',
            image: m.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
            isAvailable: m.is_available
          })));
        }
      } catch (err) {
        console.error("Failed to load merchant menu catalog:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantMenu();
  }, [currentUser]);

  // Image uploader handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${restaurant.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      if (urlData) {
        setFormImage(urlData.publicUrl);
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      alert(`Image upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Stock Availability Toggle
  const handleToggleAvailable = async (itemId: string) => {
    const targetItem = menuItems.find(i => i.id === itemId);
    if (!targetItem) return;

    const nextAvailable = !targetItem.isAvailable;
    
    // Optimistic update
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, isAvailable: nextAvailable } : item));

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: nextAvailable })
        .eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update availability:", err);
      // Revert
      setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, isAvailable: !nextAvailable } : item));
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        setMenuItems(prev => prev.filter(item => item.id !== itemId));
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert("Failed to delete menu item.");
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  // Derive categories list dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    menuItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [menuItems]);

  // Filter items by search query and category
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Trigger Add Modal
  const triggerAddModal = () => {
    setIsEditing(false);
    setActiveItemId(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('Recommended');
    setFormImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60');
    setFormAvailable(true);
    setShowAddEditModal(true);
  };

  // Trigger Edit Modal
  const triggerEditModal = (item: MenuItem) => {
    setIsEditing(true);
    setActiveItemId(item.id);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormImage(item.image);
    setFormAvailable(item.isAvailable);
    setShowAddEditModal(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !restaurant) return;

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum)) {
      alert("Invalid price value");
      return;
    }

    try {
      if (isEditing && activeItemId) {
        // Edit mode
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formName,
            description: formDescription,
            price: priceNum,
            category: formCategory,
            image_url: formImage,
            is_available: formAvailable
          })
          .eq('id', activeItemId);

        if (error) throw error;

        setMenuItems(prev => prev.map(item => 
          item.id === activeItemId 
            ? { 
                ...item, 
                name: formName, 
                description: formDescription, 
                price: priceNum, 
                category: formCategory, 
                image: formImage,
                isAvailable: formAvailable 
              } 
            : item
        ));
      } else {
        // Add mode
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id: restaurant.id,
            name: formName,
            description: formDescription,
            price: priceNum,
            category: formCategory,
            image_url: formImage,
            is_available: formAvailable
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setMenuItems(prev => [{
            id: data.id,
            name: data.name,
            description: data.description || '',
            price: Number(data.price),
            category: data.category,
            image: data.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
            isAvailable: data.is_available
          }, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to save menu item:", err);
      alert("Failed to save menu item details.");
    }

    setShowAddEditModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-2">🧸 Loading menu management catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[2rem] border border-pink-100/50 shadow-sm gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Menu Management</h1>
          <p className="text-xs text-on-surface-variant font-semibold">Keep your restaurant menu current. Add or edit dishes.</p>
        </div>

        <button 
          onClick={triggerAddModal}
          className="btn-primary text-xs px-6 py-3 rounded-full flex items-center gap-1 shadow-sm active:scale-95"
        >
          <Plus size={14} />
          <span>Add New Item</span>
        </button>
      </section>

      {/* 2. Search & Category Filters Row */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu dishes..."
            className="w-full rounded-full bg-white border border-pink-100 py-2.5 pl-10 pr-4 text-xs font-semibold focus:border-primary outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar self-start md:self-auto py-1">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary-fixed text-primary border-pink-200 shadow-sm font-black'
                  : 'bg-white text-on-surface-variant hover:bg-gray-50 border-pink-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Grid of Menu Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item: MenuItem) => (
            <div 
              key={item.id}
              className={`bg-white rounded-[2rem] p-4 border border-pink-50 relative flex gap-4 transition-all hover:shadow-lift ${
                !item.isAvailable ? 'opacity-70 bg-gray-50/50' : ''
              }`}
            >
              {/* Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative shadow-sm">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[8px] text-white font-extrabold uppercase">
                    Unavailable
                  </div>
                )}
              </div>

              {/* details */}
              <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="text-xs font-black text-slate-800 truncate pr-4">{item.name}</h3>
                    <span className="bg-slate-50 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-wide shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[9px] text-on-surface-variant/75 font-semibold line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-dashed border-gray-50">
                  <span className="text-xs font-extrabold text-primary">৳ {item.price}</span>

                  <div className="flex items-center gap-3">
                    {/* Stock switch */}
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleToggleAvailable(item.id)}>
                      {item.isAvailable ? (
                        <ToggleRight size={18} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={18} className="text-gray-300" />
                      )}
                      <span className="text-[8px] font-bold text-on-surface-variant uppercase">
                        {item.isAvailable ? 'In Stock' : 'Out'}
                      </span>
                    </div>

                    {/* Edit/Delete */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => triggerEditModal(item)}
                        className="p-1 rounded-full hover:bg-[#FFF0F8] text-secondary hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center space-y-3">
          <span className="text-5xl block animate-float">🍽️</span>
          <p className="text-xs font-bold text-on-surface">No Menu Items Found</p>
          <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Try widening your search terms or select another category.</p>
          <button 
            onClick={handleResetFilters}
            className="btn-primary text-xs px-6 py-2 rounded-full mt-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* 4. ADD / EDIT DIALOG SHEET */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleFormSubmit} className="bg-white rounded-[3rem] p-6 max-w-md w-full border border-pink-100 shadow-premium glass-card space-y-4">
            <h3 className="text-sm font-black text-on-surface border-b border-gray-100 pb-2">
              {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Dish Title</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Garlic Parmesan Wings"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Price (৳)</label>
                <input 
                  type="number" 
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 240"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Menu Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                >
                  {['Recommended', 'Chicken', 'Rice', 'Burgers', 'Drinks', 'Desserts', 'Snacks', 'Pizza', 'Vortas', 'Curries', 'Cakes', 'Breakfast'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Photo URL (Unsplash/Link)</label>
                <input 
                  type="text" 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="Paste photo link..."
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Image Upload Option */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Or Upload Local Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
                {isUploading && (
                  <span className="text-[8px] font-bold text-primary animate-pulse block mt-1">🧸 Uploading image...</span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Short Description</label>
                <textarea 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Spices, ingredients, serves how many..."
                  rows={2}
                  className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              {/* Available Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Available immediately for order?</span>
                <button
                  type="button"
                  onClick={() => setFormAvailable(!formAvailable)}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                    formAvailable ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="px-4 py-2 rounded-full hover:bg-gray-100 text-xs font-bold text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-6 py-2.5 rounded-full text-xs font-bold"
              >
                {isEditing ? 'Update Dish' : 'Publish Dish'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
