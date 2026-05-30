"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { 
  MapPin, 
  Search, 
  Heart, 
  ShoppingCart, 
  CircleUserRound, 
  Bell, 
  X, 
  ChevronDown, 
  LayoutDashboard, 
  ShieldCheck, 
  Briefcase, 
  PenSquare, 
  ClipboardList, 
  LogOut 
} from 'lucide-react';

interface NavbarProps {
  onSearchChange?: (query: string) => void;
  searchVal?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, searchVal = '' }) => {
  const { currentUser, logout } = useAuth();
  const { cartItems, wishlist } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Home');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchVal);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load custom logo
  useEffect(() => {
    const saved = localStorage.getItem('tf_app_logo');
    if (saved) {
      setLogoUrl(saved);
    }
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLocationSelect = (loc: string) => {
    setSelectedLocation(loc);
    setShowLocationDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchQuery);
    } else {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm shadow-primary/5">
      {/* Top Announcement Bar */}
      <div className="bg-primary text-white py-2 px-gutter text-center w-full z-50 relative flex justify-center items-center text-base sm:text-[16px] font-bold">
        <span>🧸 Free delivery on your first order!</span>
        <div className="absolute right-4 hidden md:flex items-center gap-4 text-xs opacity-90 font-medium">
          <Link href="/signup?role=owner" className="hover:underline">Become a Restaurant Partner</Link>
          <span className="opacity-50">|</span>
          <Link href="/signup?role=delivery" className="hover:underline">Join as a Rider</Link>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="flex justify-between items-center px-4 sm:px-gutter py-3 max-w-container-max mx-auto gap-4">
        
        {/* Left: Logo & Address */}
        <div className="flex items-center gap-4 sm:gap-lg">
          <Link href="/" className="flex items-center gap-2 hover:scale-[1.01] active:scale-95 transition-transform">
            <div className="flex items-center gap-2">
              <img src={logoUrl || "/logo.png"} alt="TEDDYFOOD" className="h-9 w-auto object-contain animate-float" />
              <span className="text-lg sm:text-2xl font-black tracking-tight text-primary font-display">
                TEDDY<span className="text-secondary">FOOD</span>
              </span>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="relative hidden md:block">
            <button 
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1 cursor-pointer group hover:bg-[#FFF0F8] rounded-full px-3 py-1.5 transition-colors text-sm font-medium text-on-surface"
            >
              <MapPin size={20} className="text-[#E91E8C]" />
              <span className="truncate max-w-[120px]">Delivery to: <strong>{selectedLocation}</strong></span>
              <ChevronDown size={16} className="text-slate-500 transition-transform group-hover:rotate-180" />
            </button>

            {showLocationDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-premium border border-white/40 p-2 w-48 z-50 glass-card">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant/50 px-3 py-1">Select Location</p>
                {['Home', 'Work', 'Office', 'Current Location'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocationSelect(loc === 'Current Location' ? 'Dhanmondi' : loc)}
                    className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl font-medium transition-colors"
                  >
                    {loc === 'Current Location' ? '📍 Current Location' : loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Search bar */}
        <div className="flex-1 max-w-md hidden lg:block">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input 
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow transition-all placeholder:text-slate-600 text-on-surface outline-none font-medium" 
              placeholder="Search for restaurants, cuisines, or dishes..." 
              type="text"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </form>
        </div>

        {/* Right: Actions */}
        <nav className="flex items-center gap-2 sm:gap-md">
          {/* Wishlist Icon */}
          <Link 
            href="/profile?tab=favourites" 
            className="p-2 rounded-full hover:bg-[#FFF0F8] hover:text-primary text-on-surface transition-colors relative group hidden sm:block"
          >
            <Heart size={20} className="transition-colors group-hover:text-primary" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link 
            href="/checkout" 
            className="p-2 rounded-full hover:bg-[#FFF0F8] hover:text-primary text-on-surface transition-colors relative group"
          >
            <ShoppingCart size={20} className="transition-colors group-hover:text-primary" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Conditional Profile / Login buttons */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-full border border-pink-200 hover:bg-[#FFF0F8] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-on-surface max-w-[80px] truncate hidden md:inline">{currentUser.name}</span>
                {currentUser.role === 'admin' && (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1 scale-90">
                    <ShieldCheck size={10} className="text-[#F59E0B]" /> Admin
                  </span>
                )}
                {currentUser.role === 'manager' && (
                  <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1 scale-90">
                    <Briefcase size={10} className="text-[#3B82F6]" /> Manager
                  </span>
                )}
                {currentUser.role === 'editor' && (
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1 scale-90">
                    <PenSquare size={10} className="text-[#10B981]" /> Editor
                  </span>
                )}
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-premium border border-white/40 p-2 w-52 z-50 glass-card">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-on-surface">{currentUser.name}</p>
                    <p className="text-[10px] text-on-surface-variant/70 truncate">{currentUser.email}</p>
                    <p className="text-[8px] bg-primary-fixed text-primary px-1.5 py-0.5 rounded-full inline-block mt-1 font-bold uppercase">{currentUser.role}</p>
                  </div>
                  
                  {/* Dashboard link for special roles */}
                  {currentUser.role === 'owner' && (
                    <Link href="/owner/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl transition-colors font-medium">
                      <LayoutDashboard size={14} className="text-slate-500" /> Dashboard
                    </Link>
                  )}
                  {currentUser.role === 'delivery' && (
                    <Link href="/delivery/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl transition-colors font-medium">
                      <LayoutDashboard size={14} className="text-slate-500" /> Rider Portal
                    </Link>
                  )}
                  {currentUser.role === 'admin' && (
                    <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl transition-colors font-medium">
                      <ShieldCheck size={14} className="text-[#F59E0B]" /> Admin Dashboard
                    </Link>
                  )}

                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl transition-colors font-medium">
                    <CircleUserRound size={14} className="text-slate-500" /> My Profile
                  </Link>
                  <Link href="/profile?tab=orders" className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-[#FFF0F8] hover:text-primary rounded-xl transition-colors font-medium">
                    <ClipboardList size={14} className="text-slate-500" /> My Orders
                  </Link>
                  
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-left mt-1 border-t border-gray-100 pt-2"
                  >
                    <LogOut size={14} className="text-red-500" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-bold text-slate-800 hover:text-primary transition-colors px-3 py-2">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-xs sm:text-sm px-4 py-2 rounded-full font-bold">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
