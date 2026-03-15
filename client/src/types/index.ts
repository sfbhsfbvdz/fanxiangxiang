/**
 * Type definitions - aligned with server types
 */

export interface MenuItem {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  status: 'available' | 'sold_out';
}

export interface Category {
  id: number;
  restaurantId: number;
  name: string;
  sortOrder: number;
}

export interface MenuCategory extends Category {
  items: MenuItem[];
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image?: string;
  tags: string[];
  categories?: Category[];
  status: 'active' | 'inactive';
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  userId: number;
  name: string;
  phone: string;
  address: string;
  detail?: string;
  isDefault: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  status: OrderStatus;
  totalPrice: number;
  deliveryFee: number;
  tip: number;
  extraCharge: number;
  extraChargeNote?: string;
  deliveryAddress: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  restaurant: {
    id: number;
    name: string;
    image?: string;
  };
  items: OrderItem[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
