import { apiClient } from './client';
import { ApiResponse, User, Address } from '../types';

interface UpdateProfileParams {
  username?: string;
  phone?: string;
  avatar?: string;
}

interface CreateAddressParams {
  name: string;
  phone: string;
  address: string;
  detail?: string;
  isDefault?: boolean;
}

export const usersApi = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/users/profile');
    return res.data!;
  },

  async updateProfile(params: UpdateProfileParams): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>('/users/profile', params);
    return res.data!;
  },

  async getAddresses(): Promise<Address[]> {
    const res = await apiClient.get<ApiResponse<Address[]>>('/users/addresses');
    return res.data!;
  },

  async createAddress(params: CreateAddressParams): Promise<Address> {
    const res = await apiClient.post<ApiResponse<Address>>('/users/addresses', params);
    return res.data!;
  },

  async updateAddress(id: number, params: Partial<CreateAddressParams>): Promise<Address> {
    const res = await apiClient.put<ApiResponse<Address>>(`/users/addresses/${id}`, params);
    return res.data!;
  },

  async deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/users/addresses/${id}`);
  },
};
