"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users, 
  ClipboardList, 
  Bike, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Briefcase, 
  PenSquare, 
  BookOpen, 
  TrendingUp, 
  Store, 
  Wallet, 
  Menu as MenuIcon, 
  X 
} from 'lucide-react';

interface SidebarProps {
  role: 'owner' | 'delivery' | 'admin';
}

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load custom logo
  useEffect(() => {
    const saved = localStorage.getItem('tf_app_logo');
    if (saved) {
      setLogoUrl(saved);
    }
  }, []);

  // Set up links based on user role
  const getLinks = (): SidebarLink[] => {
    switch (role) {
      case 'owner':
        return [
          { label: 'Dashboard', href: '/owner/dashboard', icon: 'dashboard' },
          { label: 'Orders', href: '/owner/orders', icon: 'orders' },
          { label: 'Menu Management', href: '/owner/menu', icon: 'menu_management' },
          { label: 'Revenue & Sales', href: '/owner/revenue', icon: 'revenue' },
          { label: 'Store Profile', href: '/owner/profile', icon: 'profile' },
        ];
      case 'delivery':
        return [
          { label: 'Rider Dashboard', href: '/delivery/dashboard', icon: 'rider_dashboard' },
          { label: 'My Earnings', href: '/delivery/earnings', icon: 'earnings' },
        ];
      case 'admin':
        if (currentUser) {
          const activeRole = currentUser.role;
          if (activeRole === 'manager') {
            return [
              { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
              { label: 'Restaurants', href: '/admin/restaurants', icon: 'restaurants' },
              { label: 'Users Manager', href: '/admin/users', icon: 'users' },
              { label: 'Orders Center', href: '/admin/orders', icon: 'orders' },
              { label: 'Delivery Dispatch', href: '/admin/delivery', icon: 'delivery' },
              { label: 'Revenue Analytics', href: '/admin/revenue', icon: 'revenue' }
            ];
          } else if (activeRole === 'editor') {
            return [
              { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
              { label: 'Restaurants', href: '/admin/restaurants', icon: 'restaurants' },
              { label: 'Orders Center', href: '/admin/orders', icon: 'orders' }
            ];
          }
        }
        // Default Admin links
        return [
          { label: 'Overview', href: '/admin/dashboard', icon: 'dashboard' },
          { label: 'Restaurants', href: '/admin/restaurants', icon: 'restaurants' },
          { label: 'Users Manager', href: '/admin/users', icon: 'users' },
          { label: 'Orders Center', href: '/admin/orders', icon: 'orders' },
          { label: 'Delivery boy Dispatch', href: '/admin/delivery', icon: 'delivery' },
          { label: 'Revenue Analytics', href: '/admin/revenue', icon: 'revenue' },
          { label: 'System Settings', href: '/admin/settings', icon: 'settings' },
        ];
      default:
        return [];
    }
  };

  const renderIcon = (name: string, isActive: boolean, isAdmin: boolean) => {
    const size = 18;
    // Active sidebar item icon turns pink (#E91E8C)
    const activeColor = '#E91E8C';
    const inactiveColor = isAdmin ? '#94A3B8' : '#64748B'; // slate-400 or slate-500
    
    // Custom className with transition rules
    const className = `transition-all duration-300 ${
      isActive 
        ? 'text-[#E91E8C] scale-[1.1] drop-shadow-sm' 
        : 'text-slate-400 group-hover:text-primary group-hover:scale-[1.05]'
    }`;

    switch (name) {
      case 'dashboard':
      case 'rider_dashboard':
        return <LayoutDashboard size={size} className={className} />;
      case 'restaurants':
        return <UtensilsCrossed size={size} className={className} />;
      case 'users':
        return <Users size={size} className={className} />;
      case 'orders':
        return <ClipboardList size={size} className={className} />;
      case 'delivery':
        return <Bike size={size} className={className} />;
      case 'revenue':
        return role === 'owner' 
          ? <TrendingUp size={size} className={className} />
          : <BarChart3 size={size} className={className} />;
      case 'settings':
        return <Settings size={size} className={className} />;
      case 'menu_management':
        return <BookOpen size={size} className={className} />;
      case 'profile':
        return <Store size={size} className={className} />;
      case 'earnings':
        return <Wallet size={size} className={className} />;
      default:
        return <LayoutDashboard size={size} className={className} />;
    }
  };

  const links = getLinks();
  const isAdmin = role === 'admin';

  const sidebarClasses = isAdmin
    ? "glass-card-dark text-slate-200 border-slate-800"
    : "glass-card text-on-surface border-pink-100";

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            isAdmin ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-pink-100 text-primary'
          }`}
        >
          {isOpen ? <X size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-40 transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarClasses} flex flex-col justify-between py-6 px-4`}
      >
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-2 pl-3">
            <div className="flex items-center gap-2">
              <img src={logoUrl || "/logo.png"} alt="TEDDYFOOD" className="h-9 w-auto object-contain animate-float" />
              <div className="flex flex-col">
                <span className={`text-xl font-black tracking-tight font-display ${isAdmin ? 'text-white' : 'text-primary'}`}>
                  TEDDY<span className={isAdmin ? 'text-primary' : 'text-secondary'}>FOOD</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 -mt-1">
                  {isAdmin && currentUser ? `${currentUser.role} portal` : `${role} portal`}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              let linkClass = "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative group ";

              if (isActive) {
                linkClass += isAdmin
                  ? "bg-slate-900/60 text-white shadow-glow border border-slate-800"
                  : "bg-primary-fixed text-primary shadow-sm font-bold scale-[1.02]";
              } else {
                linkClass += isAdmin
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-on-surface-variant hover:text-primary hover:bg-[#FFF0F8] hover:scale-[1.01]";
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={linkClass}
                >
                  {renderIcon(link.icon, isActive, isAdmin)}
                  <span>{link.label}</span>
                  
                  {/* Left border active decoration */}
                  {isActive && (
                    <span className={`absolute left-0 top-1/3 bottom-1/3 w-1 rounded-r-full ${
                      isAdmin ? 'bg-primary' : 'bg-primary'
                    }`} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className={`mt-auto pt-4 border-t ${isAdmin ? 'border-slate-800' : 'border-pink-50'} space-y-4`}>
          {currentUser && (
            <div className="flex flex-col gap-2 px-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary overflow-hidden shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate text-white">{currentUser.name}</p>
                  <p className={`text-[9px] truncate ${isAdmin ? 'text-slate-500' : 'text-on-surface-variant/70'}`}>
                    {currentUser.email}
                  </p>
                </div>
              </div>
              
              {/* Dynamic premium role badges using Lucide icons */}
              {isAdmin && (
                <div className="mt-1">
                  {currentUser.role === 'admin' && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <ShieldCheck size={10} className="text-[#F59E0B]" /> Admin
                    </span>
                  )}
                  {currentUser.role === 'manager' && (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <Briefcase size={10} className="text-[#3B82F6]" /> Manager
                    </span>
                  )}
                  {currentUser.role === 'editor' && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <PenSquare size={10} className="text-[#10B981]" /> Editor
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors text-left group ${
              isAdmin 
                ? 'text-red-400 hover:bg-red-950/20 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <LogOut size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile screen */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-xs"
        />
      )}
    </>
  );
};
