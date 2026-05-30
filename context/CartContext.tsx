"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Restaurant, OrderItem } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

interface Voucher {
  code: string;
  discount: number;
  description: string;
}

interface CartContextType {
  cartItems: OrderItem[];
  currentRestaurant: Restaurant | null;
  wishlist: string[]; // Restaurant IDs
  appliedVoucher: Voucher | null;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  addToCart: (item: MenuItem, restaurant: Restaurant) => { success: boolean; conflict?: boolean };
  removeFromCart: (itemId: string) => void;
  removeItemFully: (itemId: string) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => Promise<{ success: boolean; message: string }>;
  removeVoucher: () => void;
  toggleWishlist: (restaurantId: string) => void;
  isInWishlist: (restaurantId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tf_cart_items');
    const savedRest = localStorage.getItem('tf_cart_restaurant');
    const savedWish = localStorage.getItem('tf_wishlist');
    const savedVoucher = localStorage.getItem('tf_cart_voucher');

    if (savedCart) {
      try { setCartItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
    if (savedRest) {
      try { setCurrentRestaurant(JSON.parse(savedRest)); } catch (e) { console.error(e); }
    }
    if (savedWish) {
      try { setWishlist(JSON.parse(savedWish)); } catch (e) { console.error(e); }
    }
    if (savedVoucher) {
      try { setAppliedVoucher(JSON.parse(savedVoucher)); } catch (e) { console.error(e); }
    }

    setIsHydrated(true);
  }, []);

  // Save to localStorage when states change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('tf_cart_items', JSON.stringify(cartItems));
      localStorage.setItem('tf_wishlist', JSON.stringify(wishlist));
      if (currentRestaurant) {
        localStorage.setItem('tf_cart_restaurant', JSON.stringify(currentRestaurant));
      } else {
        localStorage.removeItem('tf_cart_restaurant');
      }
      if (appliedVoucher) {
        localStorage.setItem('tf_cart_voucher', JSON.stringify(appliedVoucher));
      } else {
        localStorage.removeItem('tf_cart_voucher');
      }
    }
  }, [cartItems, currentRestaurant, wishlist, appliedVoucher, isHydrated]);

  // Derived calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = currentRestaurant && subtotal > 0 ? currentRestaurant.deliveryFee : 0;
  
  // Voucher calculations (free delivery or flat discount)
  let discountAmount = 0;
  if (appliedVoucher && subtotal > 0) {
    discountAmount = Math.min(appliedVoucher.discount, subtotal);
  }
  
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Cart operations
  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    // 1. Single Restaurant constraint validation
    if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
      return { success: false, conflict: true };
    }

    // Set active restaurant if empty
    if (!currentRestaurant) {
      setCurrentRestaurant(restaurant);
    }

    // Add item or increment quantity
    setCartItems(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      }];
    });

    return { success: true };
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (!existing) return prev;
      
      if (existing.quantity <= 1) {
        const remaining = prev.filter(i => i.itemId !== itemId);
        if (remaining.length === 0) {
          setCurrentRestaurant(null);
          setAppliedVoucher(null);
        }
        return remaining;
      }
      
      return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const removeItemFully = (itemId: string) => {
    setCartItems(prev => {
      const remaining = prev.filter(i => i.itemId !== itemId);
      if (remaining.length === 0) {
        setCurrentRestaurant(null);
        setAppliedVoucher(null);
      }
      return remaining;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentRestaurant(null);
    setAppliedVoucher(null);
  };

  // Voucher operations
  const applyVoucher = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (subtotal === 0) {
      return { success: false, message: "Cart is empty" };
    }

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, message: "Invalid or inactive voucher code" };
      }

      const voucher: Voucher = {
        code: data.code,
        discount: Number(data.discount),
        description: data.description || '',
      };

      setAppliedVoucher(voucher);
      return { success: true, message: `Voucher "${cleanCode}" applied successfully!` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Voucher validation failed." };
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  // Wishlist operations
  const toggleWishlist = (restaurantId: string) => {
    setWishlist(prev => {
      if (prev.includes(restaurantId)) {
        return prev.filter(id => id !== restaurantId);
      }
      return [...prev, restaurantId];
    });
  };

  const isInWishlist = (restaurantId: string) => {
    return wishlist.includes(restaurantId);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      currentRestaurant,
      wishlist,
      appliedVoucher,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      addToCart,
      removeFromCart,
      removeItemFully,
      clearCart,
      applyVoucher,
      removeVoucher,
      toggleWishlist,
      isInWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
