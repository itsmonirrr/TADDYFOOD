"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load custom logo
  useEffect(() => {
    const saved = localStorage.getItem('tf_app_logo');
    if (saved) {
      setLogoUrl(saved);
    }
  }, []);

  return (
    <footer className="bg-slate-950 w-full py-12 px-4 sm:px-gutter max-w-container-max mx-auto mt-24 border-t border-slate-800 pb-24 text-slate-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-4 items-center sm:items-start text-center sm:text-left">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <img src={logoUrl || "/logo.png"} alt="TEDDYFOOD" className="h-9 w-auto object-contain animate-float" />
              <span className="text-2xl font-black text-primary font-display">
                TEDDYFOOD
              </span>
            </div>
          </Link>
          <p className="text-xs text-slate-400 max-w-xs font-semibold leading-relaxed">
            Delighting you with every single bite. The premium food delivery app combining glassmorphic visuals and hyper-fast service.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3 items-center sm:items-start text-center sm:text-left">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Company</h4>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">About Us</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Our Blog</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Careers</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">TEDDY Market</Link>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3 items-center sm:items-start text-center sm:text-left">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Business</h4>
          <Link href="/signup?role=owner" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Partner with Us</Link>
          <Link href="/signup?role=delivery" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Join as a Rider</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Merchant Portal</Link>
          <Link href="/admin/login" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Admin Login</Link>
        </div>

        {/* Support & Legal Column */}
        <div className="flex flex-col gap-3 items-center sm:items-start text-center sm:text-left">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Help & Legal</h4>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Contact Support</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Terms of Service</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Privacy Policy</Link>
          <Link href="#" className="text-slate-300 hover:text-primary transition-all text-xs font-bold hover:underline">Refund Policy</Link>
        </div>
      </div>

      <div className="col-span-1 md:col-span-4 text-center mt-12 pt-6 border-t border-slate-800">
        <span className="text-xs font-bold text-slate-500">
          © {new Date().getFullYear()} <span className="text-primary font-bold">TEDDYFOOD</span>. All rights reserved. Made with love for premium dining. 🧸
        </span>
      </div>
    </footer>
  );
};
