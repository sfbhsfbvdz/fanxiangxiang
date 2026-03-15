import { apiClient } from './client'
import { ApiResponse } from '../types'

export interface MerchantOrder {
  id: number
  user_id: number
  restaurant_id: number
  rider_id: number | null
  status: string
  total_price: number
  delivery_fee: number
  tip: number
  extra_charge: number
  extra_charge_note: string | null
  delivery_address: string
  notes: string | null
  created_at: string
  updated_at: string
  username: string
  user_phone: string | null
  items: { id: number; name: string; quantity: number; price: number }[]
}

export interface MerchantMenuItem {
  id: number
  restaurant_id: number
  category_id: number
  name: string
  description: string | null
  price: number
  image: string | null
  status: 'available' | 'sold_out'
}

export interface MerchantCategory {
  id: number
  restaurant_id: number
  name: string
  sort_order: number
  items: MerchantMenuItem[]
}

export interface MerchantRestaurant {
  id: number
  name: string
  description: string | null
  image: string | null
  rating: number
  delivery_time: string
  delivery_fee: number
  min_order: number
  status: 'active' | 'inactive'
}

export const merchantApi = {
  getOrders: () =>
    apiClient.get<ApiResponse<MerchantOrder[]>>('/merchant/orders'),

  acceptOrder: (orderId: number) =>
    apiClient.put<ApiResponse<null>>(`/merchant/orders/${orderId}/accept`, {}),

  readyOrder: (orderId: number) =>
    apiClient.put<ApiResponse<null>>(`/merchant/orders/${orderId}/ready`, {}),

  extraCharge: (orderId: number, extra_charge: number, extra_charge_note?: string) =>
    apiClient.put<ApiResponse<null>>(`/merchant/orders/${orderId}/extra-charge`, { extra_charge, extra_charge_note }),

  getMenu: () =>
    apiClient.get<ApiResponse<MerchantCategory[]>>('/merchant/menu'),

  createCategory: (name: string, sort_order?: number) =>
    apiClient.post<ApiResponse<{ id: number }>>('/merchant/menu/categories', { name, sort_order }),

  updateCategory: (id: number, data: { name?: string; sort_order?: number }) =>
    apiClient.put<ApiResponse<null>>(`/merchant/menu/categories/${id}`, data),

  deleteCategory: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/merchant/menu/categories/${id}`),

  createItem: (data: {
    category_id: number
    name: string
    description?: string
    price: number
    image?: string
    status?: string
  }) =>
    apiClient.post<ApiResponse<{ id: number }>>('/merchant/menu/items', data),

  updateItem: (
    id: number,
    data: Partial<{
      name: string
      description: string
      price: number
      image: string
      status: string
    }>
  ) =>
    apiClient.put<ApiResponse<null>>(`/merchant/menu/items/${id}`, data),

  deleteItem: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/merchant/menu/items/${id}`),

  getRestaurant: () =>
    apiClient.get<ApiResponse<MerchantRestaurant>>('/merchant/restaurant'),

  updateRestaurant: (
    data: Partial<{
      name: string
      description: string
      delivery_fee: number
      min_order: number
      delivery_time: string
      status: string
    }>
  ) =>
    apiClient.put<ApiResponse<null>>('/merchant/restaurant', data),
}
