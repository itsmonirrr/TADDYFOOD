export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  deliveryFee: number;
  isOpen: boolean;
  isSuper?: boolean;
  discountPercent?: number;
  ownerEmail?: string;
  address?: string;
  openingHours?: string;
  menu: MenuItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'owner' | 'delivery' | 'admin' | 'manager' | 'editor';
  phone: string;
  address: string;
  avatar?: string;
  vehicleType?: string;
  nationalId?: string;
  deliveryArea?: string;
  restaurantId?: string;
  status?: 'Active' | 'Banned' | 'Pending';
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  riderId?: string;
  riderName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  date: string;
  paymentMethod: 'cod' | 'bkash' | 'card';
  specialInstructions?: string;
}
