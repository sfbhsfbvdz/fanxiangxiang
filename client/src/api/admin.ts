import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeRestaurants: number;
  dailyOrders: { date: string; count: number; revenue: number }[];
}

export interface AdminOrder {
  id: number;
  user_id: number;
  restaurant_id: number;
  rider_id: number | null;
  status: string;
  total_price: number;
  delivery_fee: number;
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  restaurant_name: string;
  username: string;
  email: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  created_at: string;
}

export interface AdminRestaurant {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  rating: number;
  delivery_fee: number;
  min_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  order_count: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const adminApi = {
  getStats: () =>
    apiClient.get<ApiResponse<AdminStats>>('/admin/stats'),

  getOrders: (params?: { status?: string; restaurant_id?: number; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.restaurant_id) qs.set('restaurant_id', String(params.restaurant_id));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiClient.get<ApiResponse<PaginatedResult<AdminOrder>>>(`/admin/orders?${qs}`);
  },

  getUsers: (params?: { role?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.role) qs.set('role', params.role);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiClient.get<ApiResponse<PaginatedResult<AdminUser>>>(`/admin/users?${qs}`);
  },

  updateUserRole: (userId: number, role: string, restaurant_id?: number) =>
    apiClient.put<ApiResponse<null>>(`/admin/users/${userId}/role`, { role, restaurant_id }),

  getRestaurants: () =>
    apiClient.get<ApiResponse<AdminRestaurant[]>>('/admin/restaurants'),

  updateRestaurantStatus: (restaurantId: number, status: 'active' | 'inactive') =>
    apiClient.put<ApiResponse<null>>(`/admin/restaurants/${restaurantId}/status`, { status }),
};
