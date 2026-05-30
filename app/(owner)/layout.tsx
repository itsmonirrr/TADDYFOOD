"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/shared/Sidebar';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (currentUser.role !== 'owner') {
      router.replace('/');
      return;
    }

    setIsAuthorized(true);
  }, [currentUser, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FFF0F8] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
        🧸 Checking Merchant Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Merchant Sidebar Drawer */}
      <Sidebar role="owner" />
      
      {/* Content wrapper */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col pt-16 lg:pt-0">
        <main className="flex-grow p-4 sm:p-gutter max-w-7xl mx-auto w-full page-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
