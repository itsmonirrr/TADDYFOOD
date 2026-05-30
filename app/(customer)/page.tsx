"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Restaurant } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowRight, 
  Bike, 
  PersonStanding, 
  Store, 
  ShoppingBag, 
  Star, 
  Heart, 
  Tag, 
  Clock3, 
  Wallet, 
  X,
  Loader2
} from 'lucide-react';

export default function CustomerHomepage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { wishlist, toggleWishlist, isInWishlist } = useCart();
  const { currentUser } = useAuth();

  // Supabase dynamic state
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Navigation & Tab States
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup' | 'market' | 'shops'>('delivery');

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const { data: resData, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

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
            discountPercent: 10,
            ownerEmail: r.email || '',
            menu: []
          }));
          setRestaurantsList(mapped);
        }
      } catch (err) {
        console.error('Error fetching restaurants from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);
  
  // 2. Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'fastest' | 'distance' | 'rated'>('relevance');
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);
  const [filterSuperRes, setFilterSuperRes] = useState(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [filterVouchers, setFilterVouchers] = useState(false);
  
  // 3. UI states
  const [showBottomBanner, setShowBottomBanner] = useState(true);

  // Sync Search Query from URL Search Params if available
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal) {
      setSearchQuery(searchVal);
    }
  }, [searchParams]);

  // Listen to custom window search event from Navbar
  useEffect(() => {
    const handleUrlSearch = () => {
      const searchVal = new URLSearchParams(window.location.search).get('search');
      setSearchQuery(searchVal || '');
    };
    window.addEventListener('popstate', handleUrlSearch);
    return () => window.removeEventListener('popstate', handleUrlSearch);
  }, []);

  // 4. Dynamic Filtering Logic
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurantsList];

    // Filter by Tab content
    if (activeTab === 'market') {
      list = list.filter(r => r.cuisine === 'Breakfast' || r.cuisine === 'Cakes');
    } else if (activeTab === 'shops') {
      list = list.filter(r => r.cuisine === 'Fast Food' || r.cuisine === 'Pizza');
    }

    // Filter by Cuisine carousel row
    if (selectedCuisine) {
      list = list.filter(r => r.cuisine.toLowerCase() === selectedCuisine.toLowerCase());
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.cuisine.toLowerCase().includes(q) ||
        r.menu.some(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
      );
    }

    // Rating 4+ filter
    if (filterRating4Plus) {
      list = list.filter(r => r.rating >= 4.5);
    }

    // Super Restaurant check
    if (filterSuperRes) {
      list = list.filter(r => r.isSuper);
    }

    // Free delivery check
    if (filterFreeDelivery) {
      list = list.filter(r => r.deliveryFee === 0);
    }

    // Accepts vouchers check (All mock restaurants accept vouchers in this mockup)
    if (filterVouchers) {
      list = list.filter(r => r.minOrder <= 250);
    }

    // Sorting operations
    if (sortBy === 'fastest') {
      list.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
    } else if (sortBy === 'distance') {
      list.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortBy === 'rated') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [restaurantsList, activeTab, selectedCuisine, searchQuery, sortBy, filterRating4Plus, filterSuperRes, filterFreeDelivery, filterVouchers]);

  const handleCuisineSelect = (cuisine: string) => {
    if (selectedCuisine === cuisine) {
      setSelectedCuisine(null); // Toggle off
    } else {
      setSelectedCuisine(cuisine);
    }
  };

  const handleResetFilters = () => {
    setSelectedCuisine(null);
    setSortBy('relevance');
    setFilterRating4Plus(false);
    setFilterSuperRes(false);
    setFilterFreeDelivery(false);
    setFilterVouchers(false);
    setSearchQuery('');
    router.push('/');
  };

  // Cuisine Categories Configuration
  const cuisinesData = [
    { name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60', tag: 'Fast Food' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60', tag: 'Pizza' },
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=60', tag: 'Biryani' },
    { name: 'Bangla', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=150&auto=format&fit=crop&q=60', tag: 'Bangladeshi' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=150&auto=format&fit=crop&q=60', tag: 'Chinese' },
    { name: 'Cakes', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=150&auto=format&fit=crop&q=60', tag: 'Cakes' },
    { name: 'Breakfast', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=60', tag: 'Breakfast' }
  ];

  return (
    <div className="max-w-container-max mx-auto px-4 sm:px-gutter py-6 page-fade-in">
      
      {/* 1. Hero banner section */}
      <section className="mb-10 relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-pink-50 to-[#FFF0F8] border border-white/40 shadow-glass flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 gap-8 z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-0 pointer-events-none"></div>
        <div className="space-y-6 relative z-10 max-w-lg text-center md:text-left">
          <span className="bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block">
            🧸 Premium Service
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface leading-tight">
            Order your <br /> 
            <span className="text-primary bg-clip-text">favourite food!</span>
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant font-medium">
            Fast, fresh, and delivered right to your door. Explore top-rated restaurants near you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <button 
              onClick={() => {
                const element = document.getElementById('restaurants-grid-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary text-sm px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2 active:scale-95 shadow-glow"
            >
              <span>Order Now</span>
              <ArrowRight size={14} className="text-white" />
            </button>
            <Link 
              href="/signup?role=owner"
              className="btn-secondary text-sm px-6 py-3.5 rounded-full text-center border border-pink-200"
            >
              Partner With Us
            </Link>
          </div>
        </div>
        <div className="relative hidden md:flex items-center justify-center w-72 h-72 md:w-96 md:h-96">
          <div className="text-[12rem] animate-float select-none drop-shadow-2xl">🧸</div>
        </div>
      </section>

      {/* 2. Sub-Nav Horizontal Tab Row */}
      <div className="flex overflow-x-auto gap-2.5 pb-3 mb-8 hide-scrollbar border-b border-gray-100">
        {[
          { id: 'delivery', label: 'Delivery', desc: 'Instant dispatch', icon: <Bike size={16} className="text-primary" /> },
          { id: 'pickup', label: 'Pick-up', desc: 'No queue wait', icon: <PersonStanding size={16} className="text-primary" /> },
          { id: 'market', label: 'TEDDY Market', desc: 'Groceries', icon: <Store size={16} className="text-primary" /> },
          { id: 'shops', label: 'Shops', desc: 'Treats & Snacks', icon: <ShoppingBag size={16} className="text-primary" /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedCuisine(null);
              }}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl flex flex-col items-start transition-all ${
                isActive
                  ? 'bg-white border-2 border-primary text-primary shadow-glow scale-[1.02]'
                  : 'bg-white/60 hover:bg-[#FFF0F8] text-on-surface-variant hover:text-primary border border-pink-50'
              }`}
            >
              <span className="text-sm font-bold flex items-center gap-1.5">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
              <span className="text-[9px] opacity-75 font-semibold -mt-0.5 ml-5">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Layout Grid: Sidebar Filters + Restaurant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filter Section */}
        <aside className="col-span-1 space-y-6 lg:sticky lg:top-28 h-fit bg-white/40 p-5 rounded-[2rem] border border-white/20 shadow-glass">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">Filters</h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Clear All
            </button>
          </div>
          
          <hr className="border-pink-50" />

          {/* Sort Selection */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sort By</h4>
            {[
              { id: 'relevance', label: 'Relevance' },
              { id: 'fastest', label: 'Fastest Delivery' },
              { id: 'distance', label: 'Distance' },
              { id: 'rated', label: 'Top Rated' }
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="sort"
                  checked={sortBy === opt.id}
                  onChange={() => setSortBy(opt.id as any)}
                  className="text-primary focus:ring-primary h-4 w-4 border-pink-200 accent-primary" 
                />
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          <hr className="border-pink-50" />

          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Quick Filters</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filterRating4Plus}
                onChange={(e) => setFilterRating4Plus(e.target.checked)}
                className="text-primary focus:ring-primary rounded-md h-4 w-4 border-pink-200 accent-primary" 
              />
              <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-1">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span>Rating 4.5+</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filterSuperRes}
                onChange={(e) => setFilterSuperRes(e.target.checked)}
                className="text-primary focus:ring-primary rounded-md h-4 w-4 border-pink-200 accent-primary" 
              />
              <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                Super Restaurant 🧸
              </span>
            </label>
          </div>

          <hr className="border-pink-50" />

          {/* Special Offers */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Offers</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filterFreeDelivery}
                onChange={(e) => setFilterFreeDelivery(e.target.checked)}
                className="text-primary focus:ring-primary rounded-md h-4 w-4 border-pink-200 accent-primary" 
              />
              <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-1">
                <Bike size={12} className="text-[#E91E8C]" />
                <span>Free Delivery</span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filterVouchers}
                onChange={(e) => setFilterVouchers(e.target.checked)}
                className="text-primary focus:ring-primary rounded-md h-4 w-4 border-pink-200 accent-primary" 
              />
              <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                Budget Friendly
              </span>
            </label>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <div className="col-span-1 lg:col-span-3 space-y-8 overflow-hidden">
          
          {/* Cuisines Horizontal Row */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-on-surface">Explore Cuisines</h2>
            <div className="flex overflow-x-auto gap-6 pb-2 hide-scrollbar -mx-4 px-4 w-[calc(100%+32px)]">
              {cuisinesData.map((c) => {
                const isSelected = selectedCuisine === c.tag;
                return (
                  <button
                    key={c.name}
                    onClick={() => handleCuisineSelect(c.tag)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center p-1.5 transition-all ${
                      isSelected
                        ? 'bg-primary shadow-glow scale-105'
                        : 'bg-[#FFF0F8] group-hover:shadow-lift'
                    }`}>
                      <img 
                        src={c.image} 
                        alt={c.name} 
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <span className={`text-[10px] font-bold transition-colors ${
                      isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                    }`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Restaurant Listing Grid */}
          <section id="restaurants-grid-section" className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black text-on-surface">
                {selectedCuisine ? `${selectedCuisine} Restaurants` : 'Restaurants near you'}
                <span className="text-xs text-on-surface-variant/60 font-semibold ml-2">({filteredRestaurants.length} found)</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-xs font-semibold mt-2">🧸 Loading active restaurants...</span>
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRestaurants.map((res) => {
                  const fav = isInWishlist(res.id);
                  return (
                    <div 
                      key={res.id}
                      className="glass-card rounded-[2rem] p-3 flex flex-col gap-3 cursor-pointer card-hover relative group border border-pink-50 bg-white"
                    >
                      {/* Photo Header */}
                      <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-gray-100">
                        <Link href={`/restaurant/${res.id}`} className="absolute inset-0 block z-0">
                          <img 
                            src={res.image} 
                            alt={res.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        </Link>

                        {/* Rating Badge */}
                        <div className="absolute top-2.5 left-2.5 bg-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10 text-[10px] font-extrabold text-[#333333] border border-pink-100">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span>{res.rating}</span>
                        </div>

                        {/* Discount Badge */}
                        {res.discountPercent && (
                          <div className="absolute top-2.5 right-2.5 bg-primary text-white px-2.5 py-1 rounded-full shadow-sm z-10 text-[10px] font-black">
                            -{res.discountPercent}% OFF
                          </div>
                        )}

                        {/* Wishlist Heart Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(res.id);
                          }}
                          className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors z-10 ${
                            fav ? 'bg-primary text-white' : 'bg-white text-secondary hover:text-primary'
                          }`}
                        >
                          <Heart size={14} className={fav ? 'fill-white text-white' : 'text-slate-500'} />
                        </button>
                      </div>

                      {/* Info Details */}
                      <Link href={`/restaurant/${res.id}`} className="px-1.5 pb-2.5 space-y-1 block">
                        <div className="flex justify-between items-center gap-2">
                          <h3 className="text-[18px] font-bold text-black truncate group-hover:text-primary transition-colors">
                            {res.name}
                          </h3>
                          {res.isSuper && (
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[8px] font-black shrink-0">
                              SUPER 🧸
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#333333] flex-wrap">
                          <span className="bg-primary text-white px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wide flex items-center gap-0.5">
                            <Tag size={8} className="text-white" />
                            <span>{res.cuisine}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-[#333333]">
                            <Clock3 size={10} className="text-slate-600" />
                            <span>{res.deliveryTime}</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold text-[#333333] pt-1.5 border-t border-gray-100 mt-1">
                          <span className="flex items-center gap-0.5">
                            <Bike size={10} className="text-slate-600" />
                            <span>Delivery: {res.deliveryFee > 0 ? `৳ ${res.deliveryFee}` : 'FREE'}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Wallet size={10} className="text-slate-600" />
                            <span>Min Order: ৳ {res.minOrder}</span>
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/40 border border-pink-50 rounded-[2.5rem] p-8 glass-card">
                <span className="text-6xl animate-float block mb-4">🧸</span>
                <h3 className="text-base font-bold text-on-surface">No Restaurants Found</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Try resetting your filters or adjusting your search keywords.</p>
                <button 
                  onClick={handleResetFilters}
                  className="btn-primary text-xs px-6 py-2.5 rounded-full mt-4"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* 4. Bottom Sticky Banner */}
      {showBottomBanner && !currentUser && (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-pink-100 shadow-premium z-50 transform transition-transform duration-500 translate-y-0" id="sticky-banner">
          <div className="max-w-container-max mx-auto px-gutter py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-10 h-10 bg-[#FFF0F8] rounded-full items-center justify-center text-primary text-xl">
                🎉
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-on-surface">Welcome! Enjoy free delivery on your first order 🧸</h4>
                <p className="text-[10px] text-on-surface-variant/80 font-medium">Create a TEDDYFOOD account now for exclusive food perks and order tracking.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link 
                href="/signup" 
                className="btn-primary w-full sm:w-auto text-xs px-6 py-2.5 rounded-full text-center"
              >
                Sign up
              </Link>
              <button 
                onClick={() => setShowBottomBanner(false)}
                className="p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-gray-100 flex items-center"
              >
                <X size={14} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
