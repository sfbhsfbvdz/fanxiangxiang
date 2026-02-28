import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface RiderOrder {
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
  restaurant_image: string | null;
}

export interface RiderStatus {
  status: 'offline' | 'online' | 'delivering';
  vehicle_type: string;
}

export const riderApi = {
  getAvailableOrders: () =>
    apiClient.get<ApiResponse<RiderOrder[]>>('/rider/orders/available'),

  getMyOrders: () =>
    apiClient.get<ApiResponse<RiderOrder[]>>('/rider/orders/mine'),

  acceptOrder: (orderId: number) =>
    apiClient.put<ApiResponse<null>>(`/rider/orders/${orderId}/accept`, {}),

  pickedOrder: (orderId: number) =>
    apiClient.put<ApiResponse<null>>(`/rider/orders/${orderId}/picked`, {}),

  deliveredOrder: (orderId: number) =>
    apiClient.put<ApiResponse<null>>(`/rider/orders/${orderId}/delivered`, {}),

  getStatus: () =>
    apiClient.get<ApiResponse<RiderStatus>>('/rider/status'),

  updateStatus: (status: 'offline' | 'online' | 'delivering') =>
    apiClient.put<ApiResponse<null>>('/rider/status', { status }),
};
