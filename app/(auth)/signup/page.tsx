"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRound, Store, Bike, CheckCircle2, AlertCircle } from 'lucide-react';

type Role = 'customer' | 'owner' | 'delivery';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected role tab state (default to query param or customer)
  const [role, setRole] = useState<Role>('customer');

  useEffect(() => {
    const roleParam = searchParams.get('role') as Role;
    if (roleParam && ['customer', 'owner', 'delivery'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Shared inputs state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Restaurant Partner inputs state
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('Biryani');
  const [openingHours, setOpeningHours] = useState('10:00 AM - 10:00 PM');

  // Delivery boy inputs state
  const [vehicleType, setVehicleType] = useState('Bike');
  const [nationalId, setNationalId] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('Dhanmondi');

  // Error and UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate inputs according to exact specifications
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Shared checking
    if (!email || !password || !confirmPassword || !phone) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    // Role-specific check
    if (role === 'customer' && (!name || !address)) {
      setErrorMsg("Please provide your name and delivery address.");
      return;
    }
    if (role === 'owner' && (!restaurantName || !name || !address)) {
      setErrorMsg("Please fill in all restaurant partner details.");
      return;
    }
    if (role === 'delivery' && (!name || !nationalId || !deliveryArea)) {
      setErrorMsg("Please fill in all delivery rider details.");
      return;
    }

    // 1. Password length restrictions (6-8 characters limit)
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password.length > 8) {
      setErrorMsg("Password cannot exceed 8 characters");
      return;
    }

    // 2. Passwords Match checks
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      // Build form arguments
      const payload: any = {
        name: name,
        email,
        password,
        role,
        phone,
        address: address,
      };

      if (role === 'owner') {
        payload.restaurantName = restaurantName;
        payload.cuisineType = cuisineType;
        payload.openingHours = openingHours;
        payload.address = address; // Restaurant address
      } else if (role === 'delivery') {
        payload.vehicleType = vehicleType;
        payload.nationalId = nationalId;
        payload.deliveryArea = deliveryArea;
        payload.address = "Rider Depot";
      } else {
        payload.address = address; // Customer address
      }

      try {
        const res = await signup(payload);
        setIsLoading(false);

        if (res.success) {
          if (res.error === 'approval_pending') {
            setSuccessMsg("🎉 Registration submitted! Restaurant Partner is pending administrator approval. An email verification has been sent.");
            // Clear inputs
            setRestaurantName('');
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPhone('');
            setAddress('');
          } else {
            setSuccessMsg("🎉 Account created successfully! A verification email has been sent to your inbox.");
          }
        } else if (res.error) {
          setErrorMsg(res.error);
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || "An unexpected error occurred during signup.");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F8] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-premium p-6 sm:p-10 relative glass-card">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-1 mb-8 text-center">
          <Link href="/">
            <img src="/logo.png" alt="TEDDYFOOD" className="h-12 w-auto object-contain animate-float select-none mx-auto" />
          </Link>
          <h1 className="text-xl font-bold text-on-surface mt-2">Join TEDDYFOOD</h1>
          <p className="text-xs text-on-surface-variant font-medium">Choose your journey and create your account.</p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Customer Card */}
          <button
            type="button"
            onClick={() => { setRole('customer'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`p-4 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-36 relative ${
              role === 'customer'
                ? 'bg-white border-2 border-primary shadow-glow'
                : 'bg-white/50 border border-pink-100 hover:border-pink-300'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <UserRound size={28} className={role === 'customer' ? 'text-primary' : 'text-slate-400'} />
              {role === 'customer' && <CheckCircle2 size={18} className="text-primary font-bold" />}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">CUSTOMER</p>
              <p className="text-[10px] text-on-surface-variant/80 font-medium mt-0.5">I want to order food</p>
            </div>
          </button>

          {/* Restaurant Partner Card */}
          <button
            type="button"
            onClick={() => { setRole('owner'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`p-4 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-36 relative ${
              role === 'owner'
                ? 'bg-white border-2 border-primary shadow-glow'
                : 'bg-white/50 border border-pink-100 hover:border-pink-300'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <Store size={28} className={role === 'owner' ? 'text-primary' : 'text-slate-400'} />
              {role === 'owner' && <CheckCircle2 size={18} className="text-primary font-bold" />}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">PARTNER</p>
              <p className="text-[10px] text-on-surface-variant/80 font-medium mt-0.5">I have a restaurant</p>
            </div>
          </button>

          {/* Delivery Rider Card */}
          <button
            type="button"
            onClick={() => { setRole('delivery'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`p-4 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-36 relative ${
              role === 'delivery'
                ? 'bg-white border-2 border-primary shadow-glow'
                : 'bg-white/50 border border-pink-100 hover:border-pink-300'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <Bike size={28} className={role === 'delivery' ? 'text-primary' : 'text-slate-400'} />
              {role === 'delivery' && <CheckCircle2 size={18} className="text-primary font-bold" />}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">DELIVERY RIDER</p>
              <p className="text-[10px] text-on-surface-variant/80 font-medium mt-0.5">I want to deliver</p>
            </div>
          </button>
        </div>

        {/* Notifications banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 text-green-600 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Customer Form specific inputs */}
          {role === 'customer' && (
            <>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
            </>
          )}

          {/* 2. Restaurant Partner Form specific inputs */}
          {role === 'owner' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Restaurant Name</label>
                <input
                  type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="e.g. Sultan's Dine"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Owner's Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Owner Name"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Cuisine Type</label>
                <select
                  value={cuisineType} onChange={(e) => setCuisineType(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                >
                  {['Biryani', 'Bangladeshi', 'Fast Food', 'Pizza', 'Rice Dishes', 'Burgers', 'Cakes', 'Breakfast', 'Drinks'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Opening Hours</label>
                <input
                  type="text" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="10:00 AM - 10:00 PM"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
            </>
          )}

          {/* 3. Delivery Rider Form specific inputs */}
          {role === 'delivery' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rider Full Name"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Vehicle Type</label>
                <select
                  value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                >
                  <option value="Bike">Motorbike</option>
                  <option value="Cycle">Bicycle</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">National ID Number</label>
                <input
                  type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="NID-XXXXXX"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Preferred Delivery Area</label>
                <select
                  value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                >
                  {['Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Mirpur', 'Tejgaon'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Shared Standard fields */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Email Address</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. user@test.com"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Phone Number</label>
            <input
              type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 017XXXXXXXX"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Password (6-8 chars)</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
            />
          </div>

          {/* Address field for customers/owners */}
          {role !== 'delivery' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                {role === 'owner' ? 'Restaurant Physical Address' : 'Delivery Address'}
              </label>
              <textarea
                value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, Flat, Street, Area details..."
                rows={2}
                className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-medium text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none resize-none"
              />
            </div>
          )}

          {/* Password Validation Advice */}
          <div className="col-span-2 text-[9px] text-on-surface-variant/70 bg-[#FFF0F8]/50 p-2.5 rounded-xl border border-pink-100/50 mt-1">
            ⚠️ <strong>Password Rules:</strong> Must be between 6 and 8 characters long.
          </div>

          {/* Button submission */}
          <div className="col-span-2 mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 rounded-full font-bold text-xs tracking-wide flex items-center justify-center gap-2 active:scale-95 shadow-glow"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : role === 'customer' ? (
                <span>Create Account</span>
              ) : role === 'owner' ? (
                <span>Register Restaurant</span>
              ) : (
                <span>Join as Rider</span>
              )}
            </button>
          </div>
        </form>

        {/* Link to login */}
        <div className="mt-6 text-center text-xs font-semibold text-on-surface-variant">
          <span>Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-bold">Log in</Link>
        </div>

      </div>
    </div>
  );
}
