"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans font-semibold text-primary animate-pulse text-sm">
      🧸 Loading Cart Basket...
    </div>
  );
}
