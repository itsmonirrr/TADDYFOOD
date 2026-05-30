"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Restaurant } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

export default function OwnerProfilePage() {
  const { currentUser } = useAuth();
  
  // States
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [resName, setResName] = useState('');
  const [resAddress, setResAddress] = useState('');
  const [resCuisine, setResCuisine] = useState('Burgers');
  const [resHours, setResHours] = useState('10:00 AM - 10:00 PM');
  const [resImage, setResImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alert States
  const [resError, setResError] = useState('');
  const [resSuccess, setResSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Helper to map DB restaurant to Restaurant interface
  const mapDbRestaurantToRestaurant = (dbRes: any): Restaurant => {
    return {
      id: dbRes.id,
      name: dbRes.name,
      image: dbRes.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=60',
      cuisine: dbRes.cuisine_type || 'Fast Food',
      rating: Number(dbRes.rating || 0),
      deliveryTime: `${dbRes.delivery_time || 30} min`,
      minOrder: Number(dbRes.min_order || 100),
      deliveryFee: Number(dbRes.delivery_fee || 30),
      isOpen: dbRes.is_open,
      ownerEmail: dbRes.email || '',
      address: dbRes.address || '',
      menu: [],
    };
  };

  // 1. Initial Load
  const loadRestaurantProfile = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      // Query restaurant where owner_id matches currentUser.id
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', currentUser.id)
        .single();

      if (error) throw error;

      if (data) {
        const mapped = mapDbRestaurantToRestaurant(data);
        setRestaurant(mapped);
        setResName(mapped.name);
        setResAddress(mapped.address || '');
        setResCuisine(mapped.cuisine);
        setResHours(data.description || '10:00 AM - 10:00 PM'); // mapped description to hours or keep it simple
        setResImage(mapped.image);
      }
    } catch (e) {
      console.error("Failed to load restaurant profile from Supabase:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantProfile();
  }, [currentUser]);

  // 2. Save Restaurant parameters
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');
    setResSuccess('');

    if (!resName || !resAddress || !resImage) {
      setResError("Please fill in all store parameters.");
      return;
    }

    if (!restaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: resName,
          cuisine_type: resCuisine,
          image_url: resImage,
          address: resAddress,
          description: resHours
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      setResSuccess("🎉 Restaurant profile updated successfully!");
      await loadRestaurantProfile();
    } catch(e: any) {
      console.error(e);
      setResError(e.message || "Failed to update profile details.");
    }
  };

  // 3. Change Merchant password using Supabase Auth
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters");
      return;
    }
    if (newPassword.length > 8) {
      setPassError("Password cannot exceed 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match");
      return;
    }

    try {
      // Direct password update using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPassSuccess("🎉 Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      console.error(e);
      setPassError(e.message || "Failed to update credentials.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] bg-white rounded-[2.5rem] p-8 flex items-center justify-center font-semibold text-primary animate-pulse text-xs">
        🧸 Loading merchant profile details...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUMN 1: Restaurant Info Fields (7 cols) */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-800">Store Profile Settings</h2>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">Customize your public restaurant details.</p>
        </div>

        {resError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-2xl animate-bounce">
            {resError}
          </div>
        )}
        {resSuccess && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-xs font-semibold rounded-2xl">
            {resSuccess}
          </div>
        )}

        <form onSubmit={handleSaveRestaurant} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Res Name */}
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Restaurant Name</label>
            <input 
              type="text" 
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Cuisine Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Cuisine Type</label>
            <select
              value={resCuisine}
              onChange={(e) => setResCuisine(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
            >
              {['Biryani', 'Bangladeshi', 'Fast Food', 'Pizza', 'Rice Dishes', 'Burgers', 'Cakes', 'Breakfast', 'Drinks'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Opening Hours */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Opening Hours/Description</label>
            <input 
              type="text" 
              value={resHours}
              onChange={(e) => setResHours(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Cover Photo URL</label>
            <input 
              type="text" 
              value={resImage}
              onChange={(e) => setResImage(e.target.value)}
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Address */}
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Store Address</label>
            <textarea 
              value={resAddress}
              onChange={(e) => setResAddress(e.target.value)}
              rows={2}
              className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="col-span-2 pt-2">
            <button 
              type="submit"
              className="btn-primary px-8 py-3 rounded-full text-xs font-black"
            >
              Update Store details
            </button>
          </div>
        </form>
      </div>

      {/* COLUMN 2: Change Password (5 cols) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-800">Change Password</h2>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">Secure your merchant account credentials.</p>
        </div>

        {passError && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl animate-bounce">
            {passError}
          </div>
        )}
        {passSuccess && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-xs font-semibold rounded-2xl">
            {passSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Current Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          {/* New */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">New Password (6-8 chars)</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          {/* Confirm */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="btn-primary w-full py-3 rounded-full text-xs font-black"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
