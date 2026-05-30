"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  usersList: User[];
  login: (emailOrUserId: string, password: string, isAdminPortal?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserStatus: (userId: string, status: 'Active' | 'Banned') => Promise<void>;
  updateUserRestaurant: (userId: string, restaurantId: string) => Promise<void>;
  addNewUserFromAdmin: (user: User) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  refreshUsersList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Helper to map DB profile to User interface
  const mapProfileToUser = (profile: any): User => {
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone || '',
      address: profile.address || '',
      avatar: profile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.full_name}`,
      status: profile.status === 'active' ? 'Active' : profile.status === 'banned' ? 'Banned' : 'Pending',
      vehicleType: profile.vehicle_type || '',
      nationalId: profile.national_id || '',
      deliveryArea: profile.delivery_area || '',
      restaurantId: profile.restaurant_id || undefined,
    };
  };

  // Helper to map DB admin account to User interface
  const mapAdminToUser = (admin: any): User => {
    return {
      id: admin.id,
      name: admin.full_name,
      email: `${admin.username}@teddyfood.com`,
      role: admin.role,
      phone: '01112345678',
      address: 'TEDDYFOOD Head Office, Gulshan 1, Dhaka',
      status: admin.status === 'active' ? 'Active' : 'Banned',
    };
  };

  // 1. Fetch Users List for Administrators
  const refreshUsersList = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (profiles) {
        setUsersList(profiles.map(mapProfileToUser));
      }
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  };

  // 2. Auth State Change Listener & Hydration
  useEffect(() => {
    // Check if there is an active staff/admin session in localStorage first
    const staffSession = localStorage.getItem('tf_active_user');
    if (staffSession) {
      try {
        const parsedStaff = JSON.parse(staffSession) as User;
        if (['admin', 'manager', 'editor'].includes(parsedStaff.role)) {
          setCurrentUser(parsedStaff);
          setIsHydrated(true);
          // If staff is logged in, refresh users list
          refreshUsersList();
          return;
        }
      } catch (e) {
        console.error('Failed to parse staff session', e);
      }
    }

    // Otherwise, listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            // If the user exists in Auth but not in profiles yet, let's create a temporary session user
            setCurrentUser({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: 'customer',
              phone: '',
              address: '',
              status: 'Active'
            });
          } else if (profile) {
            const mappedUser = mapProfileToUser(profile);
            setCurrentUser(mappedUser);
            // Sync with local storage session just in case
            localStorage.setItem('tf_active_user', JSON.stringify(mappedUser));

            // Load all users if staff/admin
            if (['admin', 'manager', 'editor'].includes(mappedUser.role)) {
              refreshUsersList();
            }
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
        }
      } else {
        // No session
        const currentStaffSession = localStorage.getItem('tf_active_user');
        if (currentStaffSession) {
          try {
            const parsedStaff = JSON.parse(currentStaffSession) as User;
            if (['admin', 'manager', 'editor'].includes(parsedStaff.role)) {
              // Preserve staff session
              setCurrentUser(parsedStaff);
              setIsHydrated(true);
              return;
            }
          } catch (e) {}
        }
        setCurrentUser(null);
        localStorage.removeItem('tf_active_user');
      }
      setIsHydrated(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Login Flow
  const login = async (emailOrUserId: string, password: string, isAdminPortal: boolean = false) => {
    const inputCleaned = emailOrUserId.trim().toLowerCase();

    if (isAdminPortal) {
      // 3a. Admin / Staff login using `admin_accounts` table
      try {
        const { data: admin, error } = await supabase
          .from('admin_accounts')
          .select('*')
          .eq('username', inputCleaned)
          .eq('password', password)
          .single();

        if (error || !admin) {
          return { success: false, error: "Invalid Username or Password" };
        }

        if (admin.status === 'banned') {
          return { success: false, error: "Your administrator account has been disabled." };
        }

        const mappedAdmin = mapAdminToUser(admin);
        setCurrentUser(mappedAdmin);
        localStorage.setItem('tf_active_user', JSON.stringify(mappedAdmin));

        // Load all users
        await refreshUsersList();

        router.push('/admin/dashboard');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Admin login failed." };
      }
    } else {
      // 3b. Customer / Owner / Rider login using Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: inputCleaned,
          password: password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          return { success: false, error: "Profile not found for this user." };
        }

        if (profile.status === 'banned') {
          await supabase.auth.signOut();
          return { success: false, error: "Your account is banned. Contact support." };
        }

        const mappedUser = mapProfileToUser(profile);
        setCurrentUser(mappedUser);
        localStorage.setItem('tf_active_user', JSON.stringify(mappedUser));

        // Role redirects
        if (mappedUser.role === 'customer') {
          router.push('/');
        } else if (mappedUser.role === 'owner') {
          if (mappedUser.status === 'Pending') {
            await supabase.auth.signOut();
            return { success: true, error: "approval_pending" };
          }
          router.push('/owner/dashboard');
        } else if (mappedUser.role === 'delivery') {
          router.push('/delivery/dashboard');
        } else if (['admin', 'manager', 'editor'].includes(mappedUser.role)) {
          // If staff account is used on normal portal, deny access and log out
          await supabase.auth.signOut();
          return { success: false, error: "Staff accounts can only log in through the Admin Portal" };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Authentication failed." };
      }
    }
  };

  // 4. Signup Flow
  const signup = async (userData: any) => {
    const { email, password, role, name, phone, address } = userData;

    try {
      // Create user inside auth.users
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Failed to create user record." };
      }

      // Add profile info to profiles table
      const profilePayload: any = {
        id: data.user.id,
        full_name: name,
        email: email.trim().toLowerCase(),
        phone: phone,
        role: role,
        address: address,
        status: role === 'owner' ? 'pending' : 'active',
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      };

      if (role === 'delivery') {
        profilePayload.vehicle_type = userData.vehicleType || 'Bike';
        profilePayload.national_id = userData.nationalId || '';
        profilePayload.delivery_area = userData.deliveryArea || 'Dhanmondi';
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profilePayload);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // If user is a Restaurant Owner, insert pending restaurant profile
      if (role === 'owner') {
        const { error: restError } = await supabase
          .from('restaurants')
          .insert({
            owner_id: data.user.id,
            name: userData.restaurantName || `${name}'s Restaurant`,
            cuisine_type: userData.cuisineType || 'Biryani',
            address: address,
            phone: phone,
            email: email.trim().toLowerCase(),
            status: 'pending',
            rating: 0,
            delivery_time: 30,
            min_order: 100,
            delivery_fee: 30,
            is_open: true,
          });

        if (restError) {
          console.error("Restaurant insertion error:", restError);
        }

        return { success: true, error: "approval_pending" };
      }

      // Automatically sign-in and redirect for customers / delivery riders
      const mappedUser: User = {
        id: data.user.id,
        name: name,
        email: email,
        role: role,
        phone: phone,
        address: address,
        status: 'Active',
        vehicleType: userData.vehicleType || '',
        nationalId: userData.nationalId || '',
        deliveryArea: userData.deliveryArea || '',
      };

      setCurrentUser(mappedUser);
      localStorage.setItem('tf_active_user', JSON.stringify(mappedUser));

      if (role === 'customer') {
        router.push('/');
      } else if (role === 'delivery') {
        router.push('/delivery/dashboard');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  // 5. Logout Flow
  const logout = async () => {
    const wasAdmin = ['admin', 'manager', 'editor'].includes(currentUser?.role || '');
    
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    setCurrentUser(null);
    localStorage.removeItem('tf_active_user');

    if (wasAdmin) {
      router.push('/admin/login');
    } else {
      router.push('/login');
    }
  };

  // 6. Admin Panel / Staff mutations
  const updateUserStatus = async (userId: string, status: 'Active' | 'Banned') => {
    try {
      const dbStatus = status === 'Active' ? 'active' : 'banned';
      const { error } = await supabase
        .from('profiles')
        .update({ status: dbStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update state
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status } : u));

      // Force logout if banned user is currently logged in
      if (currentUser?.id === userId && status === 'Banned') {
        await logout();
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const updateUserRestaurant = async (userId: string, restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ restaurant_id: restaurantId })
        .eq('id', userId);

      if (error) throw error;

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, restaurantId } : u));
      
      if (currentUser?.id === userId) {
        const updated = { ...currentUser, restaurantId };
        setCurrentUser(updated);
        localStorage.setItem('tf_active_user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to update user restaurant:', err);
    }
  };

  const addNewUserFromAdmin = async (user: User) => {
    try {
      const dbStatus = user.status === 'Active' ? 'active' : 'banned';

      // If it is a staff role, also insert into admin_accounts
      if (['admin', 'manager', 'editor'].includes(user.role)) {
        const username = user.email.split('@')[0];
        const { error: adminError } = await supabase
          .from('admin_accounts')
          .insert({
            username: username,
            password: user.password || '123456',
            full_name: user.name,
            role: user.role,
            status: dbStatus
          });
        if (adminError) throw adminError;
      }

      // Insert profile record
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          status: dbStatus,
          avatar_url: user.avatar,
        });

      if (error) throw error;
      await refreshUsersList();
    } catch (err) {
      console.error('Failed to add user from admin:', err);
      throw err;
    }
  };

  const updateAdminPassword = async (newPassword: string) => {
    if (!currentUser || !['admin', 'manager', 'editor'].includes(currentUser.role)) return;

    try {
      const username = currentUser.email.split('@')[0];
      const { error } = await supabase
        .from('admin_accounts')
        .update({ password: newPassword })
        .eq('username', username);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update admin password:', err);
      throw err;
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const matched = usersList.find(u => u.id === userId);
      if (matched && ['admin', 'manager', 'editor'].includes(matched.role)) {
        const username = matched.email.split('@')[0];
        const { error } = await supabase
          .from('admin_accounts')
          .update({ password: newPassword })
          .eq('username', username);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to update user password:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      usersList,
      login,
      signup,
      logout,
      updateUserStatus,
      updateUserRestaurant,
      addNewUserFromAdmin,
      updateAdminPassword,
      updateUserPassword,
      refreshUsersList
    }}>
      {isHydrated ? children : <div className="min-h-screen bg-[#FFF0F8] flex items-center justify-center font-sans font-semibold text-primary animate-pulse text-lg">🧸 Loading TEDDYFOOD...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
