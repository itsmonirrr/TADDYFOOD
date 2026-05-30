"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminId || !password) {
      setErrorMsg("Please fill in all admin fields.");
      return;
    }

    // Password rules validation (6-8 characters limit)
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password.length > 8) {
      setErrorMsg("Password cannot exceed 8 characters");
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      try {
        const res = await login(adminId, password, true); // isAdminPortal = true
        setIsLoading(false);
        
        if (!res.success && res.error) {
          setErrorMsg(res.error);
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || "Admin clearance failed.");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Dynamic Glowing Accents */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 shadow-premium p-8 rounded-[3rem] relative glass-card-dark text-slate-100">
        
        {/* Header Admin Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <img src="/logo.png" alt="TEDDYFOOD" className="h-14 w-auto object-contain animate-float select-none" />
          <h1 className="text-xl font-black text-white font-display tracking-tight flex items-center gap-1.5 justify-center">
            <span>TEDDYFOOD</span>
            <span className="bg-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
              ADMIN
            </span>
          </h1>
          <h2 className="text-lg font-bold text-slate-200 mt-2">Control Terminal Login</h2>
          <p className="text-[10px] text-slate-500 font-semibold">Enter your administrator clearance credentials below.</p>
        </div>

        {/* Rejection Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Admin User ID */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin User ID</label>
            <div className="relative">
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin"
                disabled={isLoading}
                className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-4 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700"
              />
              <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clearance Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                disabled={isLoading}
                className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-12 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700"
              />
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              
              {/* Show/Hide eye */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-primary transition-colors flex"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authorizing...</span>
              </>
            ) : (
              <span>Clear Terminal →</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-8 text-center text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:underline hover:text-slate-400">← Back to Consumer Site</Link>
        </div>

        {/* Credentials box */}
        <div className="mt-6 p-4 rounded-3xl bg-slate-950/50 border border-slate-800/80 text-[10px] text-slate-500 font-semibold">
          🔑 <strong>Default Admin Clearance:</strong>
          <div className="flex justify-between mt-1 text-slate-400 font-mono">
            <span>User ID: <strong className="select-all">admin</strong></span>
            <span>Pass: <strong>123456</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
