"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/shared/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthorized(true);
      return;
    }

    if (!currentUser) {
      router.replace('/admin/login');
      return;
    }

    // Permit only staff roles in admin panel
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && currentUser.role !== 'editor') {
      router.replace('/admin/login');
      return;
    }

    // Role-based route restrictions
    // 1. Manager and Editor cannot access Settings
    if (pathname === '/admin/settings' && currentUser.role !== 'admin') {
      localStorage.setItem('tf_admin_flash_message', 'Access Denied: Settings panel is restricted to Administrators only.');
      router.replace('/admin/dashboard');
      return;
    }

    // 2. Editor cannot access Users, Delivery, Revenue
    if (currentUser.role === 'editor' && 
        (pathname === '/admin/users' || pathname === '/admin/delivery' || pathname === '/admin/revenue')) {
      localStorage.setItem('tf_admin_flash_message', 'Access Denied: Editors do not have clearance to view this operational page.');
      router.replace('/admin/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [currentUser, router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Checking Admin clearance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Admin Sidebar Panel */}
      <Sidebar role="admin" />

      {/* Content Container */}
      <div className="flex-grow lg:pl-64 min-h-screen flex flex-col pt-16 lg:pt-0">
        <main className="flex-grow p-4 sm:p-gutter max-w-7xl mx-auto w-full page-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
