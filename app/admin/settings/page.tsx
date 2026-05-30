"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { ImagePlus, Trash2, PlusCircle, KeyRound, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { currentUser, usersList, refreshUsersList, updateAdminPassword, updateUserPassword, addNewUserFromAdmin } = useAuth();
  
  // 1. Logo Customizer States
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSuccess, setLogoSuccess] = useState('');
  const [logoError, setLogoError] = useState('');
  const [isLogoSaving, setIsLogoSaving] = useState(false);

  // 2. Global Platform Limits States
  const [minOrderLimit, setMinOrderLimit] = useState('100');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('30');
  const [maxVoucherDiscount, setMaxVoucherDiscount] = useState('500');
  const [limitsSuccess, setLimitsSuccess] = useState('');
  const [limitsError, setLimitsError] = useState('');
  const [isLimitsSaving, setIsLimitsSaving] = useState(false);

  // 3. Passwords Reset States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [isAdminPassSaving, setIsAdminPassSaving] = useState(false);

  // Staff pass resets
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffPassSuccess, setStaffPassSuccess] = useState('');
  const [staffPassError, setStaffPassError] = useState('');
  const [isStaffPassSaving, setIsStaffPassSaving] = useState(false);

  // 4. Staff Accounts CRUD States
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUserId, setNewStaffUserId] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'manager' | 'editor'>('manager');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [staffError, setStaffError] = useState('');
  const [isStaffCreating, setIsStaffCreating] = useState(false);

  // Load all configurations on mount
  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const logo = data.find(s => s.key === 'app_logo');
        if (logo) {
          setLogoUrl(logo.value);
          setLogoPreview(logo.value);
        }

        const minOrder = data.find(s => s.key === 'min_order_limit');
        if (minOrder) setMinOrderLimit(minOrder.value);

        const deliveryFee = data.find(s => s.key === 'base_delivery_fee');
        if (deliveryFee) setBaseDeliveryFee(deliveryFee.value);

        const maxVoucher = data.find(s => s.key === 'max_voucher_discount');
        if (maxVoucher) setMaxVoucherDiscount(maxVoucher.value);
      }
    } catch (e) {
      console.error("Failed to load settings from DB:", e);
    }
  };

  useEffect(() => {
    loadConfiguration();
    refreshUsersList();
  }, []);

  // Filter manager & editor accounts
  const staffAccounts = usersList.filter(u => u.role === 'manager' || u.role === 'editor');

  // --- LOGO MANAGEMENT HANDLERS ---
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoSuccess('');
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size & formats (SVG, PNG, JPG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError("Please upload only PNG, JPG, or SVG images.");
      return;
    }

    setLogoFile(file);

    // Convert file to Base64 data URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.onerror = () => {
      setLogoError("Failed to parse file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    setLogoSuccess('');
    setLogoError('');
    if (!logoFile) {
      setLogoError("No logo to save. Please choose a file first.");
      return;
    }

    try {
      setIsLogoSaving(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // 1. Upload logo to Supabase Storage 'app-assets'
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      // 3. Upsert setting in app_settings table
      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert({ key: 'app_logo', value: publicUrl });

      if (dbError) throw dbError;

      setLogoUrl(publicUrl);
      setLogoPreview(publicUrl);
      setLogoFile(null);
      setLogoSuccess("🎉 Brand logo saved successfully! Updates will propagate across the app.");
    } catch (e: any) {
      console.error(e);
      setLogoError(e.message || "Failed to save logo.");
    } finally {
      setIsLogoSaving(false);
    }
  };

  const handleResetLogo = async () => {
    if (confirm("Reset logo to default TEDDYFOOD brand mascot?")) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .delete()
          .eq('key', 'app_logo');

        if (error) throw error;

        setLogoUrl(null);
        setLogoPreview(null);
        setLogoFile(null);
        setLogoSuccess("Logo reset to default brand mascot.");
      } catch (e: any) {
        console.error(e);
        setLogoError(e.message || "Failed to reset logo.");
      }
    }
  };

  // --- SAVE LIMITS HANDLER ---
  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setLimitsSuccess('');
    setLimitsError('');

    try {
      setIsLimitsSaving(true);
      const payloads = [
        { key: 'min_order_limit', value: minOrderLimit },
        { key: 'base_delivery_fee', value: baseDeliveryFee },
        { key: 'max_voucher_discount', value: maxVoucherDiscount }
      ];

      const { error } = await supabase
        .from('app_settings')
        .upsert(payloads);

      if (error) throw error;
      setLimitsSuccess("🎉 Global Platform Limits updated successfully!");
    } catch (e: any) {
      console.error(e);
      setLimitsError(e.message || "Failed to update platform limits.");
    } finally {
      setIsLimitsSaving(false);
    }
  };

  // --- PASSWORD MANAGEMENT HANDLERS ---
  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 8) {
      setPassError("Password must be between 6 and 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    try {
      setIsAdminPassSaving(true);
      const username = currentUser?.email?.split('@')[0];
      if (!username) {
        setPassError("Unable to identify current administrative user.");
        return;
      }

      // Verify current password against admin_accounts
      const { data: admin, error: verifyError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', username)
        .eq('password', currentPassword)
        .single();

      if (verifyError || !admin) {
        setPassError("Incorrect current password.");
        return;
      }

      await updateAdminPassword(newPassword);
      setPassSuccess("🎉 Admin password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      console.error(e);
      setPassError(e.message || "Failed to reset password.");
    } finally {
      setIsAdminPassSaving(false);
    }
  };

  const handleUpdateStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffPassError('');
    setStaffPassSuccess('');

    if (!selectedStaffId) {
      setStaffPassError("Please select a staff account.");
      return;
    }

    if (!staffNewPassword) {
      setStaffPassError("Please specify a new password.");
      return;
    }

    if (staffNewPassword.length < 6 || staffNewPassword.length > 8) {
      setStaffPassError("Password must be between 6 and 8 characters.");
      return;
    }

    try {
      setIsStaffPassSaving(true);
      await updateUserPassword(selectedStaffId, staffNewPassword);
      setStaffPassSuccess("🎉 Staff password changed successfully!");
      setStaffNewPassword('');
      setSelectedStaffId('');
    } catch (e: any) {
      console.error(e);
      setStaffPassError(e.message || "Failed to update staff credentials.");
    } finally {
      setIsStaffPassSaving(false);
    }
  };

  // --- STAFF CRUD HANDLERS ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    if (!newStaffName || !newStaffUserId || !newStaffPassword) {
      setStaffError("Please fill in all fields to create an account.");
      return;
    }

    if (newStaffPassword.length < 6 || newStaffPassword.length > 8) {
      setStaffError("Password must be between 6 and 8 characters.");
      return;
    }

    const username = newStaffUserId.trim().toLowerCase();

    try {
      setIsStaffCreating(true);
      // Check duplicate in admin_accounts
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', username);

      if (existingAdmin && existingAdmin.length > 0) {
        setStaffError("This User ID / Username is already registered.");
        return;
      }

      const newStaff: User = {
        id: `user-${Date.now()}`,
        name: newStaffName,
        email: `${username}@test.com`,
        password: newStaffPassword,
        role: newStaffRole,
        phone: "01700000000",
        address: "TEDDYFOOD Head Office",
        status: "Active"
      };

      await addNewUserFromAdmin(newStaff);
      setStaffSuccess(`🎉 ${newStaffRole} account for "${newStaffName}" created successfully!`);
      setNewStaffName('');
      setNewStaffUserId('');
      setNewStaffPassword('');
      await refreshUsersList();
    } catch (e: any) {
      console.error(e);
      setStaffError(e.message || "Failed to register staff account.");
    } finally {
      setIsStaffCreating(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (confirm("Permanently revoke this staff account? This will log the user out and block login.")) {
      try {
        const staffMember = staffAccounts.find(s => s.id === userId);
        if (staffMember) {
          const username = staffMember.email.split('@')[0];
          // Delete from admin_accounts
          const { error: adminError } = await supabase
            .from('admin_accounts')
            .delete()
            .eq('username', username);

          if (adminError) throw adminError;
        }

        // Delete from profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) throw profileError;

        alert("Staff account deleted successfully!");
        await refreshUsersList();
      } catch (e: any) {
        console.error(e);
        alert(`Failed to delete staff account: ${e.message || e}`);
      }
    }
  };

  return (
    <div className="space-y-8 text-slate-350 max-w-7xl mx-auto">
      
      {/* 1. Header Section */}
      <section className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">System Configuration</h1>
          <p className="text-xs text-slate-500 font-semibold font-sans">Modify brand assets, reset passwords, and manage administrative sub-roles.</p>
        </div>
      </section>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLUMN LEFT: Logo, Limits & Staff CRUD (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Logo Customizer */}
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">App Brand Logo</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Change app-wide branding logo (PNG, JPG, SVG).</p>
            </div>

            {logoError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-2xl animate-bounce">
                {logoError}
              </div>
            )}
            {logoSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/50 text-green-400 text-xs font-semibold rounded-2xl">
                {logoSuccess}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950 p-4 rounded-[2rem] border border-slate-850">
              {/* Logo Preview Container */}
              <div className="w-32 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-3 overflow-hidden relative shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Brand Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <img src="/logo.png" alt="Default Mascot Logo" className="max-w-full max-h-12 object-contain animate-float" onError={(e) => {
                      (e.target as any).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=TeddyFood';
                    }} />
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block mt-1">Default mascot</span>
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-3 w-full">
                <input 
                  type="file" 
                  accept=".png, .jpg, .jpeg, .svg"
                  onChange={handleLogoChange}
                  id="logo-file-input"
                  className="hidden"
                />
                <label 
                  htmlFor="logo-file-input"
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white w-full py-2.5 px-4 rounded-full text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <ImagePlus size={14} className="text-slate-400" />
                  <span>Choose Logo Image File</span>
                </label>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleResetLogo}
                    disabled={!logoUrl}
                    className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/50 flex-1 py-2 rounded-full text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} className="text-rose-400" />
                    <span>Reset to Default</span>
                  </button>
                  <button 
                    onClick={handleSaveLogo}
                    disabled={isLogoSaving || !logoFile}
                    className="btn-primary flex-1 py-2 rounded-full text-[10px] font-black shadow-glow active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <ImagePlus size={12} className="text-white" />
                    <span>{isLogoSaving ? 'Saving...' : 'Save Brand Logo'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Global Platform Limits Preference Uploader */}
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Global Platform Limits</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Enforce system restrictions in app settings registers.</p>
            </div>

            {limitsError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-2xl animate-bounce">
                {limitsError}
              </div>
            )}
            {limitsSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/50 text-green-400 text-xs font-semibold rounded-2xl">
                {limitsSuccess}
              </div>
            )}

            <form onSubmit={handleSaveLimits} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Min Order (৳)</label>
                  <input 
                    type="number"
                    value={minOrderLimit}
                    onChange={(e) => setMinOrderLimit(e.target.value)}
                    className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Base Deliv. Fee (৳)</label>
                  <input 
                    type="number"
                    value={baseDeliveryFee}
                    onChange={(e) => setBaseDeliveryFee(e.target.value)}
                    className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Max Discount (৳)</label>
                  <input 
                    type="number"
                    value={maxVoucherDiscount}
                    onChange={(e) => setMaxVoucherDiscount(e.target.value)}
                    className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLimitsSaving}
                className="btn-primary px-8 py-3 rounded-full text-xs font-black shadow-glow flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Save size={14} className="text-white" />
                <span>{isLimitsSaving ? 'Updating...' : 'Save Limits Preference'}</span>
              </button>
            </form>
          </div>

          {/* User CRUD Section */}
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Staff Accounts Register</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Provision and revoke Managers and Editors credentials.</p>
            </div>

            {staffError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-2xl animate-bounce">
                {staffError}
              </div>
            )}
            {staffSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/50 text-green-400 text-xs font-semibold rounded-2xl">
                {staffSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="E.g., John Manager"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Clearance Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                >
                  <option value="manager">Manager 👔</option>
                  <option value="editor">Editor ✏️</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">User ID / Username</label>
                <input 
                  type="text" 
                  value={newStaffUserId}
                  onChange={(e) => setNewStaffUserId(e.target.value)}
                  placeholder="E.g., manager2"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Password (6-8 characters)</label>
                <input 
                  type="password" 
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="•••••"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="col-span-2 pt-2">
                <button 
                  type="submit"
                  disabled={isStaffCreating}
                  className="btn-primary px-8 py-3 rounded-full text-xs font-black shadow-glow flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <PlusCircle size={14} className="text-white" />
                  <span>{isStaffCreating ? 'Provisioning...' : 'Create Staff Account'}</span>
                </button>
              </div>
            </form>

            <hr className="border-slate-800" />

            {/* Staff Accounts List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-white">Clearance Registry Directory</h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 hide-scrollbar">
                {staffAccounts.length > 0 ? (
                  staffAccounts.map(account => (
                    <div 
                      key={account.id}
                      className="bg-slate-950 p-4 rounded-[2rem] border border-slate-850 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-white">{account.name}</p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            account.role === 'manager' 
                              ? 'bg-blue-950/20 text-blue-400 border-blue-900/50' 
                              : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
                          }`}>
                            {account.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold font-mono">User ID: {account.email.split('@')[0]}</p>
                      </div>

                      <button 
                        onClick={() => handleDeleteStaff(account.id)}
                        className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 p-2 rounded-full flex hover:text-rose-350 transition-colors active:scale-90"
                        title="Revoke Credentials"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
                    <span>🛌 No managers or editors registered in system database.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN RIGHT: Credentials reset (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Admin Credentials Reset */}
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Reset Admin Password</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Secure your administrator control terminal password.</p>
            </div>

            {passError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-2xl animate-bounce">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/50 text-green-400 text-xs font-semibold rounded-2xl">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">New Password (6-8 chars)</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isAdminPassSaving}
                className="btn-primary w-full py-3.5 rounded-full text-xs font-black shadow-glow flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <KeyRound size={14} className="text-white" />
                <span>{isAdminPassSaving ? 'Updating...' : 'Update Admin Password'}</span>
              </button>
            </form>
          </div>

          {/* Reset Staff Credentials */}
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Reset Staff Passwords</h2>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Admin-override passwords for Managers and Editors.</p>
            </div>

            {staffPassError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-2xl animate-bounce">
                {staffPassError}
              </div>
            )}
            {staffPassSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/50 text-green-400 text-xs font-semibold rounded-2xl">
                {staffPassSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateStaffPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Select Staff Account</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {staffAccounts.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role}) - ID: {s.email.split('@')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Set New Password (6-8 chars)</label>
                <input 
                  type="password"
                  value={staffNewPassword}
                  onChange={(e) => setStaffNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-full bg-slate-950 border border-slate-800 py-2.5 px-4 text-xs font-semibold text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isStaffPassSaving}
                className="btn-primary w-full py-3.5 rounded-full text-xs font-black shadow-glow flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <KeyRound size={14} className="text-white" />
                <span>{isStaffPassSaving ? 'Resetting...' : 'Reset Staff Password'}</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
