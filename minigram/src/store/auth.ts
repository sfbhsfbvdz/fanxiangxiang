import Taro from '@tarojs/taro'
import { User } from '../types'

const USER_KEY = 'fanxiangxiang_user'

export const authStore = {
  getUser(): User | null {
    try {
      const data = Taro.getStorageSync(USER_KEY)
      return data ? (JSON.parse(data) as User) : null
    } catch {
      return null
    }
  },

  setUser(user: User) {
    try {
      Taro.setStorageSync(USER_KEY, JSON.stringify(user))
    } catch {}
  },

  clearUser() {
    try {
      Taro.removeStorageSync(USER_KEY)
    } catch {}
  },

  isLoggedIn(): boolean {
    try {
      const token = Taro.getStorageSync('fanxiangxiang_token')
      return !!token
    } catch {
      return false
    }
  },

  getRole(): string {
    const user = authStore.getUser()
    return user?.role || 'customer'
  },
}

// Cart store
const CART_KEY = 'fanxiangxiang_cart'

export interface CartState {
  restaurantId: number | null
  restaurantName: string
  items: { id: number; name: string; price: number; quantity: number; image?: string }[]
}

export const cartStore = {
  getCart(): CartState {
    try {
      const data = Taro.getStorageSync(CART_KEY)
      return data
        ? JSON.parse(data)
        : { restaurantId: null, restaurantName: '', items: [] }
    } catch {
      return { restaurantId: null, restaurantName: '', items: [] }
    }
  },

  setCart(cart: CartState) {
    try {
      Taro.setStorageSync(CART_KEY, JSON.stringify(cart))
    } catch {}
  },

  clearCart() {
    try {
      Taro.setStorageSync(CART_KEY, JSON.stringify({ restaurantId: null, restaurantName: '', items: [] }))
    } catch {}
  },

  addItem(
    restaurantId: number,
    restaurantName: string,
    item: { id: number; name: string; price: number; image?: string }
  ) {
    const cart = cartStore.getCart()
    // If different restaurant, clear cart
    if (cart.restaurantId && cart.restaurantId !== restaurantId) {
      cartStore.setCart({
        restaurantId,
        restaurantName,
        items: [{ ...item, quantity: 1 }],
      })
      return
    }
    const existing = cart.items.find((i) => i.id === item.id)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.items.push({ ...item, quantity: 1 })
    }
    cart.restaurantId = restaurantId
    cart.restaurantName = restaurantName
    cartStore.setCart(cart)
  },

  removeItem(itemId: number) {
    const cart = cartStore.getCart()
    const existing = cart.items.find((i) => i.id === itemId)
    if (existing) {
      if (existing.quantity > 1) {
        existing.quantity -= 1
      } else {
        cart.items = cart.items.filter((i) => i.id !== itemId)
      }
    }
    if (cart.items.length === 0) {
      cart.restaurantId = null
      cart.restaurantName = ''
    }
    cartStore.setCart(cart)
  },

  getTotalCount(): number {
    const cart = cartStore.getCart()
    return cart.items.reduce((sum, i) => sum + i.quantity, 0)
  },

  getTotalPrice(): number {
    const cart = cartStore.getCart()
    return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  },
}
