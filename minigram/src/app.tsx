import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { authApi } from './api/auth'
import { authStore } from './store/auth'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check auth status on app launch
    const checkAuth = async () => {
      if (!authStore.isLoggedIn()) return
      try {
        const user = await authApi.getProfile()
        authStore.setUser(user)
        // Redirect based on role if currently on login page
        const pages = Taro.getCurrentPages()
        const currentPage = pages[pages.length - 1]
        if (!currentPage) return
        const path = currentPage.route || ''
        if (path.includes('login') || path === '') {
          redirectByRole(user.role || 'customer')
        }
      } catch {
        // Token invalid, clear it
        authStore.clearUser()
        Taro.removeStorageSync('fanxiangxiang_token')
      }
    }
    checkAuth()
  }, [])

  return children
}

function redirectByRole(role: string) {
  switch (role) {
    case 'merchant':
      Taro.reLaunch({ url: '/pages/merchant-home/index' })
      break
    case 'rider':
      Taro.reLaunch({ url: '/pages/rider-home/index' })
      break
    case 'admin':
      Taro.reLaunch({ url: '/pages/admin-dashboard/index' })
      break
    default:
      Taro.switchTab({ url: '/pages/home/index' })
  }
}

export default App
