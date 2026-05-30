"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    // Dynamic delay for premium feel
    setTimeout(async () => {
      try {
        const res = await login(email, password, false);
        setIsLoading(false);
        if (!res.success && res.error) {
          if (res.error === 'approval_pending') {
            setErrorMsg("Your store partner request is pending approval.");
          } else {
            setErrorMsg(res.error);
          }
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F8] flex items-center justify-center p-4">
      {/* Background circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-premium p-8 relative glass-card">
        {/* Mascot & Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <img src="/logo.png" alt="TEDDYFOOD" className="h-14 w-auto object-contain animate-float select-none" />
          <h1 className="text-2xl font-black text-primary font-display tracking-tight">
            TEDDY<span className="text-secondary">FOOD</span>
          </h1>
          <h2 className="text-xl font-bold text-on-surface mt-2">Welcome Back! 👋</h2>
          <p className="text-xs text-on-surface-variant font-medium">Order fresh food from your favorite spots.</p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@test.com"
                className="w-full rounded-full bg-[#FFF0F8] border-none py-3 pl-12 pr-4 text-sm font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow transition-all placeholder:text-on-surface-variant/40 outline-none"
                disabled={isLoading}
              />
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Password</label>
              <Link href="#" className="text-[10px] font-bold text-primary hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-full bg-[#FFF0F8] border-none py-3 pl-12 pr-12 text-sm font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow transition-all placeholder:text-on-surface-variant/40 outline-none"
                disabled={isLoading}
              />
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
              
              {/* Show/Hide Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors flex items-center"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 rounded-full font-bold text-sm tracking-wide mt-4 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>

        {/* Toggle Account Link */}
        <div className="mt-8 text-center text-xs font-semibold text-on-surface-variant">
          <span>Don't have an account? </span>
          <Link href="/signup" className="text-primary hover:underline font-bold">Sign up</Link>
        </div>

        {/* Demo Credentials Drawer */}
        <div className="mt-8 p-4 rounded-3xl bg-primary-fixed/30 border border-primary-fixed/50 text-[10px] text-on-surface-variant font-medium">
          <p className="font-bold text-primary mb-1 uppercase tracking-wider">Demo Accounts:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <div className="bg-white/80 p-2 rounded-xl border border-pink-100">
              <span className="font-bold text-secondary">🧑 Customer:</span>
              <p className="font-mono text-[9px] mt-0.5 select-all">customer@test.com</p>
              <p className="font-mono text-[9px] opacity-75">123456</p>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-pink-100">
              <span className="font-bold text-secondary">🍽️ Owner:</span>
              <p className="font-mono text-[9px] mt-0.5 select-all">owner@test.com</p>
              <p className="font-mono text-[9px] opacity-75">123456</p>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-pink-100">
              <span className="font-bold text-secondary">🏍️ Rider:</span>
              <p className="font-mono text-[9px] mt-0.5 select-all">delivery@test.com</p>
              <p className="font-mono text-[9px] opacity-75">123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
