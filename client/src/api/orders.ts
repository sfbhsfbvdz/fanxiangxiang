import { apiClient } from './client';
import { ApiResponse, OrderWithDetails, OrderStatus } from '../types';

interface OrdersResult {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

interface CreateOrderParams {
  restaurantId: number;
  items: { menuItemId: number; quantity: number }[];
  deliveryAddressId: number;
  notes?: string;
}

export const ordersApi = {
  async createOrder(params: CreateOrderParams): Promise<OrderWithDetails> {
    const res = await apiClient.post<ApiResponse<OrderWithDetails>>('/orders', params);
    return res.data!;
  },

  async getOrders(status?: OrderStatus, page = 1, limit = 20): Promise<OrdersResult> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await apiClient.get<ApiResponse<OrdersResult>>(
      `/orders?${params.toString()}`
    );
    return res.data!;
  },

  async getOrderById(id: number): Promise<OrderWithDetails> {
    const res = await apiClient.get<ApiResponse<OrderWithDetails>>(`/orders/${id}`);
    return res.data!;
  },

  async cancelOrder(id: number): Promise<void> {
    await apiClient.put(`/orders/${id}/cancel`, {});
  },
};
