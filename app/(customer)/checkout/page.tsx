"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Order } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, 
  ArrowLeft, 
  Minus, 
  Plus, 
  MapPin, 
  Ticket, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  PackageCheck, 
  Bike,
  ShieldCheck
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { 
    cartItems, 
    currentRestaurant, 
    subtotal, 
    deliveryFee, 
    discountAmount, 
    total, 
    appliedVoucher,
    addToCart, 
    removeFromCart, 
    removeItemFully,
    applyVoucher,
    removeVoucher,
    clearCart
  } = useCart();

  // Delivery details form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('Dhanmondi');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Voucher input
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'card'>('cod');

  // Checkout UI states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');

  // Pre-fill profile values on mount
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name);
      setPhone(currentUser.phone);
      if (currentUser.role === 'customer') {
        setDeliveryAddress(currentUser.address);
      }
    }
  }, [currentUser]);

  if (cartItems.length === 0 && !showSuccessModal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 page-fade-in">
        <span className="text-6xl animate-float block mb-4">🛒</span>
        <h3 className="text-base font-bold text-on-surface">Your Cart is Empty</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-1">Explore our restaurants and load up on delicious food first.</p>
        <Link href="/" className="btn-primary text-xs px-8 py-3 rounded-full mt-5">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  // Handle voucher submissions
  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    setVoucherSuccess('');
    
    if (!voucherCode) return;

    const res = await applyVoucher(voucherCode);
    if (res.success) {
      setVoucherSuccess(res.message);
      setVoucherCode('');
    } else {
      setVoucherError(res.message);
    }
  };

  // Submit and create order
  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !deliveryAddress) {
      alert("Please fill in your name, contact phone, and delivery address.");
      return;
    }

    setIsPlacingOrder(true);

    const orderId = `TF-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewOrderId(orderId);

    try {
      const { error: insertErr } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_id: currentUser?.id || null,
          customer_name: fullName,
          customer_phone: phone,
          customer_address: deliveryAddress,
          customer_area: deliveryArea,
          restaurant_id: currentRestaurant?.id || null,
          restaurant_name: currentRestaurant?.name || '',
          items: cartItems, // JSONB structure
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          discount: discountAmount,
          total: total,
          status: 'pending',
          payment_method: paymentMethod,
          special_instructions: specialInstructions
        });

      if (insertErr) throw insertErr;

      setIsPlacingOrder(false);
      setShowSuccessModal(true);
    } catch (e: any) {
      console.error("Failed to register order in Supabase:", e);
      alert(`Order placement failed: ${e.message || e}`);
      setIsPlacingOrder(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    clearCart();
    router.push(`/tracking/${newOrderId}`);
  };

  return (
    <div className="max-w-container-max mx-auto px-4 sm:px-gutter py-6 page-fade-in">
      <h1 className="text-xl sm:text-2xl font-black text-on-surface mb-8 flex items-center gap-2">
        <span>Secure Checkout</span>
        <span className="text-xs font-semibold text-on-surface-variant bg-[#FFF0F8] px-3 py-1 rounded-full border border-pink-100 flex items-center gap-1">
          <ShieldCheck size={12} className="text-primary" />
          <span>256-bit encryption</span>
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL 1: Left - Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm glass-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-on-surface flex items-center gap-1.5">
                <ClipboardList size={16} className="text-primary shrink-0" />
                <span>Order Summary</span>
              </h2>
              <Link href={`/restaurant/${currentRestaurant?.id}`} className="text-[10px] font-bold text-primary hover:underline">
                Add Items
              </Link>
            </div>

            <p className="text-[10px] font-bold text-on-surface-variant mb-4">
              Ordering from: <strong className="text-primary">{currentRestaurant?.name}</strong>
            </p>

            {/* List */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
              {cartItems.map((item) => (
                <div key={item.itemId} className="flex gap-3 text-xs border-b border-gray-100/50 pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <p className="font-extrabold text-on-surface truncate max-w-[120px]">{item.name}</p>
                      <span className="font-black text-on-surface shrink-0">৳ {item.price * item.quantity}</span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-1.5 py-0.5">
                        <button 
                          onClick={() => removeFromCart(item.itemId)}
                          className="w-4 h-4 rounded-full bg-white text-gray-500 flex items-center justify-center hover:bg-gray-100 shadow-xs"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-[10px] font-bold w-3 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            const matchedMenuItem = currentRestaurant?.menu.find(m => m.id === item.itemId);
                            if (matchedMenuItem && currentRestaurant) addToCart(matchedMenuItem, currentRestaurant);
                          }}
                          className="w-4 h-4 rounded-full bg-white text-gray-500 flex items-center justify-center hover:bg-gray-100 shadow-xs"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItemFully(item.itemId)}
                        className="text-[9px] font-bold text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Shop */}
            <Link 
              href={`/restaurant/${currentRestaurant?.id}`} 
              className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 pt-4 border-t border-gray-100 mt-2"
            >
              <ArrowLeft size={12} className="text-slate-500" />
              <span>Add more items from restaurant</span>
            </Link>
          </div>
        </div>

        {/* PANEL 2: Center - Delivery Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm glass-card space-y-4">
            <h2 className="text-sm font-black text-on-surface flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <MapPin size={16} className="text-primary shrink-0" />
              <span>Delivery Details</span>
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Pre-filled Name"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Contact Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                />
              </div>

              {/* Area Zone Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Delivery Area / Zone</label>
                <select 
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  className="w-full rounded-full bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none"
                >
                  {['Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Mirpur', 'Tejgaon', 'Mohammadpur', 'Badda', 'Khilgaon'].map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Full Delivery Address</label>
                <textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House #, Flat #, Street Details, Landmark..."
                  rows={3}
                  className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none resize-none"
                />
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Rider Instructions (Optional)</label>
                <textarea 
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Leave at reception, don't ring the bell, etc..."
                  rows={2}
                  className="w-full rounded-[1.5rem] bg-[#FFF0F8] border-none py-2.5 px-4 text-xs font-semibold text-on-surface focus:bg-white focus:ring-1 focus:ring-primary focus:shadow-glow outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: Right - Price Breakdown & Checkout (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Price breakdown */}
          <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm glass-card space-y-4">
            <h2 className="text-sm font-black text-on-surface border-b border-gray-100 pb-3">Checkout Payment</h2>
            
            {/* Promo code form */}
            <form onSubmit={handleApplyVoucher} className="space-y-2">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block flex items-center gap-1">
                <Ticket size={12} className="text-primary" />
                <span>Apply Promo Voucher</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="e.g. WELCOMEFREE"
                  disabled={!!appliedVoucher}
                  className="flex-1 rounded-full bg-[#FFF0F8] border-none py-2 px-3 text-[10px] font-semibold focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
                {appliedVoucher ? (
                  <button 
                    type="button" 
                    onClick={removeVoucher}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-extrabold border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Clear
                  </button>
                ) : (
                  <button 
                    type="submit"
                    className="btn-primary px-4 py-2 rounded-full text-[10px] font-extrabold shadow-glow active:scale-95"
                  >
                    Apply
                  </button>
                )}
              </div>
              {voucherError && <p className="text-[9px] text-red-600 font-semibold">{voucherError}</p>}
              {voucherSuccess && <p className="text-[9px] text-green-600 font-semibold">{voucherSuccess}</p>}
              {appliedVoucher && (
                <div className="p-2 rounded-xl bg-green-50 border border-green-100 text-[9px] text-green-700 font-semibold mt-1">
                  🎉 Code <strong>{appliedVoucher.code}</strong> applied: <strong>-৳{discountAmount}</strong> discount.
                </div>
              )}
            </form>

            <hr className="border-pink-50" />

            {/* Calculations table */}
            <div className="space-y-2 text-xs font-bold text-on-surface-variant">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>৳ {deliveryFee}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳ {discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-primary font-black text-sm pt-2 border-t border-dashed border-gray-200">
                <span>Total Amount</span>
                <span>৳ {total}</span>
              </div>
            </div>

            <hr className="border-pink-50" />

            {/* Payment options */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Payment Method</h4>
              
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
                  paymentMethod === 'cod'
                    ? 'border-primary bg-white shadow-glow text-primary'
                    : 'border-pink-50 hover:bg-gray-50 text-on-surface-variant'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Banknote size={16} className="text-[#E91E8C]" />
                  <span>Cash on Delivery</span>
                </div>
                {paymentMethod === 'cod' && <CheckCircle2 size={16} className="text-[#E91E8C]" />}
              </button>

              <button
                onClick={() => setPaymentMethod('bkash')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
                  paymentMethod === 'bkash'
                    ? 'border-primary bg-white shadow-glow text-primary'
                    : 'border-pink-50 hover:bg-gray-50 text-on-surface-variant'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Smartphone size={16} className="text-[#E91E8C]" />
                  <span>bKash wallet</span>
                </div>
                {paymentMethod === 'bkash' && <CheckCircle2 size={16} className="text-[#E91E8C]" />}
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-white shadow-glow text-primary'
                    : 'border-pink-50 hover:bg-gray-50 text-on-surface-variant'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard size={16} className="text-[#E91E8C]" />
                  <span>Credit / Debit Card</span>
                </div>
                {paymentMethod === 'card' && <CheckCircle2 size={16} className="text-[#E91E8C]" />}
              </button>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="btn-primary w-full py-3.5 rounded-full text-xs font-black tracking-wide mt-4 flex items-center justify-center gap-2 active:scale-95 shadow-glow"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Securing Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order</span>
                  <PackageCheck size={16} className="text-white font-bold" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* D. SUCCESS OVERLAY MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full border border-pink-100 shadow-premium glass-card text-center space-y-6 animate-float relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
            
            <span className="text-7xl block animate-bounce">🧸</span>
            <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-green-500 mx-auto shadow-sm">
              <CheckCircle2 size={32} className="text-green-500 font-bold" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-on-surface">Order Placed Successfully!</h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Thank you for choosing TEDDYFOOD. Your order ID is <strong className="text-primary font-mono text-sm">{newOrderId}</strong>.
              </p>
              <p className="text-[10px] text-on-surface-variant/80 font-medium">
                The restaurant is accepting your order. We are routing you to the live dispatch tracker.
              </p>
            </div>

            <button 
              onClick={handleModalClose}
              className="btn-primary w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-glow"
            >
              <span>Track Order Live</span>
              <Bike size={16} className="text-white animate-pulse" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
