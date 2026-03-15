import Taro from '@tarojs/taro'

const TOKEN_KEY = 'fanxiangxiang_token'
const API_BASE = 'http://8.148.214.192/api' // TODO: change to HTTPS when ready

export const tokenStorage = {
  get: (): string => {
    try {
      return Taro.getStorageSync(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  },
  set: (token: string) => {
    try {
      Taro.setStorageSync(TOKEN_KEY, token)
    } catch {}
  },
  remove: () => {
    try {
      Taro.removeStorageSync(TOKEN_KEY)
    } catch {}
  },
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = tokenStorage.get()
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    Taro.request({
      url: `${API_BASE}${endpoint}`,
      method: method as any,
      data: data !== undefined ? data : undefined,
      header,
      success: (res) => {
        const { statusCode, data: resData } = res
        if (statusCode === 401) {
          tokenStorage.remove()
          // Emit global logout event via storage
          try {
            Taro.setStorageSync('auth_logout_event', Date.now())
          } catch {}
        }
        if (statusCode >= 200 && statusCode < 300) {
          resolve(resData as T)
        } else {
          const json = resData as any
          const message =
            json?.error?.message || json?.message || `请求失败 (${statusCode})`
          const code = json?.error?.code
          reject(new ApiError(statusCode, message, code))
        }
      },
      fail: (err) => {
        reject(new ApiError(0, err.errMsg || '网络请求失败'))
      },
    })
  })
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, data: unknown) => request<T>('POST', endpoint, data),
  put: <T>(endpoint: string, data: unknown) => request<T>('PUT', endpoint, data),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
}
