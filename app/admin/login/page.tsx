"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Shield, AlertCircle, ArrowLeft, CheckCircle2, Key, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  // General forms state
  const [step, setStep] = useState<'login' | 'forgot' | 'otp' | 'newPassword' | 'success'>('login');
  
  // Standard Login Fields
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Fields
  const [forgotUsername, setForgotUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Reset Wizard State Feedback
  const [stepError, setStepError] = useState('');
  const [stepSuccess, setStepSuccess] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [resetCodeUrl, setResetCodeUrl] = useState('');

  // 1. Submit Handle for standard admin login (FIX 1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminId || !password) {
      setErrorMsg("Please fill in all admin fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password.length > 8) {
      setErrorMsg("Password cannot exceed 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // FIXED QUERY: Check with username column directly and status active
      const { data: adminUser, error: queryError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', adminId.trim().toLowerCase())
        .eq('password', password)
        .eq('status', 'active')
        .single();

      setIsLoading(false);

      if (queryError || !adminUser) {
        setErrorMsg("Invalid credentials or account clearance has been disabled.");
        return;
      }

      // Map DB admin coordinates to session user
      const mappedAdmin = {
        id: adminUser.id,
        name: adminUser.full_name,
        email: `${adminUser.username}@teddyfood.com`,
        role: adminUser.role,
        phone: '01112345678',
        address: 'TEDDYFOOD Head Office, Gulshan 1, Dhaka',
        status: adminUser.status === 'active' ? 'Active' : 'Banned',
      };

      localStorage.setItem('tf_active_user', JSON.stringify(mappedAdmin));
      
      // Navigate to dashboard
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Admin clearance authorization failed.");
    }
  };

  // 2. Submit Handle for Sending Password Reset Code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError('');
    setStepSuccess('');
    setResetCodeUrl('');

    if (!forgotUsername) {
      setStepError('Username is required.');
      return;
    }

    setStepLoading(true);

    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername }),
      });
      
      const data = await res.json();
      setStepLoading(false);

      if (!res.ok) {
        setStepError(data.error || 'Failed to send reset code.');
        return;
      }

      // Expose sandbox email testing details
      if (data.previewUrl) {
        setResetCodeUrl(data.previewUrl);
      }

      if (data.otp) {
        setStepSuccess(`🔑 Dev Mode: Code [${data.otp}] logged on server console.`);
      } else {
        setStepSuccess('📩 Password reset code has been sent successfully.');
      }

      setStep('otp');
    } catch (err: any) {
      setStepLoading(false);
      setStepError(err.message || 'An error occurred.');
    }
  };

  // 3. Submit Handle for OTP Verification Check
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError('');
    setStepSuccess('');

    if (!otpCode) {
      setStepError('Please enter the 6-digit OTP code.');
      return;
    }

    setStepLoading(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, otp: otpCode }),
      });

      const data = await res.json();
      setStepLoading(false);

      if (!res.ok) {
        setStepError(data.error || 'Failed to verify reset code.');
        return;
      }

      setStepSuccess('Reset code verified successfully. Please enter your new password.');
      setStep('newPassword');
    } catch (err: any) {
      setStepLoading(false);
      setStepError(err.message || 'An error occurred.');
    }
  };

  // 4. Submit Handle for Final Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError('');

    if (!newPassword || !confirmPassword) {
      setStepError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setStepError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword.length > 8) {
      setStepError('Password cannot exceed 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStepError('Passwords do not match.');
      return;
    }

    setStepLoading(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, otp: otpCode, newPassword }),
      });

      const data = await res.json();
      setStepLoading(false);

      if (!res.ok) {
        setStepError(data.error || 'Failed to update password.');
        return;
      }

      setStep('success');
    } catch (err: any) {
      setStepLoading(false);
      setStepError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Glowing Accents */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 shadow-premium p-8 rounded-[3rem] relative glass-card-dark text-slate-100 transition-all duration-300">
        
        {/* Header Admin Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <img src="/logo.png" alt="TEDDYFOOD" className="h-14 w-auto object-contain animate-float select-none" />
          <h1 className="text-xl font-black text-white font-display tracking-tight flex items-center gap-1.5 justify-center">
            <span>TEDDYFOOD</span>
            <span className="bg-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
              ADMIN
            </span>
          </h1>
          
          {step === 'login' && (
            <>
              <h2 className="text-lg font-bold text-slate-200 mt-2">Control Terminal Login</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Enter your administrator clearance credentials below.</p>
            </>
          )}

          {(step === 'forgot' || step === 'otp' || step === 'newPassword') && (
            <>
              <h2 className="text-lg font-bold text-slate-200 mt-2">Administrator Clearance Recovery</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Reset your secure terminal clearance credentials.</p>
            </>
          )}

          {step === 'success' && (
            <>
              <h2 className="text-lg font-bold text-emerald-400 mt-2">Clearance Restored</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Security configuration successfully updated.</p>
            </>
          )}
        </div>

        {/* Global Error Feedback */}
        {step === 'login' && errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step !== 'login' && stepError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Global Success Feedback */}
        {step !== 'login' && stepSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{stepSuccess}</span>
          </div>
        )}

        {/* -------------------- STEP 1: LOGIN VIEW -------------------- */}
        {step === 'login' && (
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
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clearance Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot');
                    setStepError('');
                    setStepSuccess('');
                  }}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider transition-colors outline-none"
                >
                  Forgot Password?
                </button>
              </div>
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
              className="btn-primary w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase mt-4 flex items-center justify-center gap-2 animate-pulse hover:animate-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authorizing Clearance...</span>
                </>
              ) : (
                <span>Clear Terminal →</span>
              )}
            </button>
          </form>
        )}

        {/* -------------------- STEP 2: FORGOT USERNAME VIEW -------------------- */}
        {step === 'forgot' && (
          <form onSubmit={handleSendResetCode} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  disabled={stepLoading}
                  className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-4 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                  required
                />
                <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={stepLoading}
              className="btn-primary w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase mt-4 flex items-center justify-center gap-2"
            >
              {stepLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Code...</span>
                </>
              ) : (
                <span>Send Reset Code →</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setStepError('');
                setStepSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors block mt-4 flex items-center justify-center gap-1.5 outline-none"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}

        {/* -------------------- STEP 3: OTP CODE VERIFICATION VIEW -------------------- */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enter 6-Digit OTP</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="••••••"
                  disabled={stepLoading}
                  className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-4 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700 text-center tracking-[0.4em] font-mono"
                  required
                />
                <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={stepLoading}
              className="btn-primary w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase mt-4 flex items-center justify-center gap-2"
            >
              {stepLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify Code →</span>
              )}
            </button>

            {/* Sandbox Ethereal Mail Access (Only for development convenience) */}
            {resetCodeUrl && (
              <div className="mt-4 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center text-[10px]">
                <p className="text-slate-300 font-semibold mb-1">🧸 Mail sent to E-mail Sandbox successfully!</p>
                <a
                  href={resetCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold"
                >
                  Click Here to Open Inbox & Read Email &rarr;
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setStepError('');
                setStepSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors block mt-4 flex items-center justify-center gap-1.5 outline-none"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}

        {/* -------------------- STEP 4: NEW PASSWORD VIEW -------------------- */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Password (6-8 characters)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={stepLoading}
                  className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-12 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                  required
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={stepLoading}
                  className="w-full rounded-full bg-slate-950/80 border border-slate-800 py-3 pl-12 pr-12 text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                  required
                />
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={stepLoading}
              className="btn-primary w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase mt-4 flex items-center justify-center gap-2"
            >
              {stepLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password →</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setStepError('');
                setStepSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors block mt-4 flex items-center justify-center gap-1.5 outline-none"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}

        {/* -------------------- STEP 5: SUCCESS VIEW -------------------- */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-950/50 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Password Reset Successfully!</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed px-4">
              Your administrative credentials have been successfully updated. You may now authorize clearance with your new password.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep('login');
                setAdminId(forgotUsername);
                setForgotUsername('');
                setOtpCode('');
                setNewPassword('');
                setConfirmPassword('');
                setStepSuccess('');
                setStepError('');
                setErrorMsg('');
              }}
              className="btn-primary py-3 px-8 rounded-full font-bold text-xs tracking-wider uppercase inline-block mt-4"
            >
              Clear Clearance Login
            </button>
          </div>
        )}

        {/* Back Link */}
        {step === 'login' && (
          <div className="mt-8 text-center text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:underline hover:text-slate-400">← Back to Consumer Site</Link>
          </div>
        )}

        {/* Credentials box */}
        {step === 'login' && (
          <div className="mt-6 p-4 rounded-3xl bg-slate-950/50 border border-slate-800/80 text-[10px] text-slate-500 font-semibold">
            🔑 <strong>Default Admin Clearance:</strong>
            <div className="flex justify-between mt-1 text-slate-400 font-mono">
              <span>User ID: <strong className="select-all">admin</strong></span>
              <span>Pass: <strong>123456</strong></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
