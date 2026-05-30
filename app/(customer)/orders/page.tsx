"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersHistoryRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/profile?tab=orders');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
      🧸 Loading Order History...
    </div>
  );
}
