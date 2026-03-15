import { apiClient } from './client'
import { ApiResponse, Restaurant, MenuCategory } from '../types'

interface RestaurantsResult {
  restaurants: Restaurant[]
  total: number
  page: number
  totalPages: number
}

export const restaurantsApi = {
  async getRestaurants(search?: string, page = 1, limit = 20): Promise<RestaurantsResult> {
    const parts: string[] = []
    if (search) parts.push(`search=${encodeURIComponent(search)}`)
    parts.push(`page=${page}`)
    parts.push(`limit=${limit}`)
    const qs = parts.length ? `?${parts.join('&')}` : ''
    const res = await apiClient.get<ApiResponse<RestaurantsResult>>(`/restaurants${qs}`)
    return res.data!
  },

  async getRestaurantById(id: number): Promise<Restaurant> {
    const res = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`)
    return res.data!
  },

  async getRestaurantMenu(id: number): Promise<{ categories: MenuCategory[] }> {
    const res = await apiClient.get<ApiResponse<{ categories: MenuCategory[] }>>(
      `/restaurants/${id}/menu`
    )
    return res.data!
  },
}
