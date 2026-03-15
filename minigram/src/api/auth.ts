import { apiClient, tokenStorage } from './client'
import { ApiResponse, User } from '../types'

interface RegisterParams {
  username: string
  email: string
  password: string
  phone?: string
}

interface LoginParams {
  email: string
  password: string
}

interface AuthResult {
  token: string
  user: User
}

export const authApi = {
  async register(params: RegisterParams): Promise<AuthResult> {
    const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', params)
    if (res.data) {
      tokenStorage.set(res.data.token)
    }
    return res.data!
  },

  async login(params: LoginParams): Promise<AuthResult> {
    const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', params)
    if (res.data) {
      tokenStorage.set(res.data.token)
    }
    return res.data!
  },

  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/profile')
    return res.data!
  },

  logout() {
    tokenStorage.remove()
  },
}
