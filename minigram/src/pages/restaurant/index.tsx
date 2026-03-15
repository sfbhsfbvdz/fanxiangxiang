import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Toast, Badge } from '@nutui/nutui-react-taro'
import { restaurantsApi } from '../../api/restaurants'
import { Restaurant, MenuCategory, MenuItem } from '../../types'
import { cartStore } from '../../store/auth'
import './index.scss'

export default function RestaurantPage() {
  const router = useRouter()
  const id = Number(router.params.id)

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeCat, setActiveCat] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(cartStore.getCart())
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const refreshCart = () => setCart(cartStore.getCart())

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const [rest, menu] = await Promise.all([
          restaurantsApi.getRestaurantById(id),
          restaurantsApi.getRestaurantMenu(id),
        ])
        setRestaurant(rest)
        setCategories(menu.categories)
        Taro.setNavigationBarTitle({ title: rest.name })
      } catch (err: any) {
        showToast(err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAdd = (item: MenuItem) => {
    if (!restaurant) return
    // Check if item is from a different restaurant
    const currentCart = cartStore.getCart()
    if (currentCart.restaurantId && currentCart.restaurantId !== restaurant.id) {
      // In WeChat mini program, use modal via Taro
      Taro.showModal({
        title: '切换餐厅',
        content: '购物车中有其他餐厅的商品，切换后将清空购物车',
        success: (res) => {
          if (res.confirm) {
            cartStore.clearCart()
            cartStore.addItem(restaurant.id, restaurant.name, {
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
            })
            refreshCart()
          }
        },
      })
      return
    }
    cartStore.addItem(restaurant.id, restaurant.name, {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    })
    refreshCart()
  }

  const handleRemove = (itemId: number) => {
    cartStore.removeItem(itemId)
    refreshCart()
  }

  const getItemCount = (itemId: number): number => {
    const cartItem = cart.items.find((i) => i.id === itemId)
    return cartItem?.quantity || 0
  }

  const totalCount = cart.restaurantId === id ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0
  const totalPrice = cart.restaurantId === id ? cart.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0

  const handleGoToCart = () => {
    Taro.navigateTo({ url: '/pages/cart/index' })
  }

  if (loading) {
    return (
      <View className="restaurant-page__loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="restaurant-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      {restaurant && (
        <View className="restaurant-page__hero">
          <Image
            className="restaurant-page__hero-img"
            src={restaurant.image || 'https://via.placeholder.com/750x300?text=餐厅'}
            mode="aspectFill"
          />
          <View className="restaurant-page__hero-info">
            <Text className="restaurant-page__hero-name">{restaurant.name}</Text>
            <View className="restaurant-page__hero-meta">
              <Text className="restaurant-page__hero-rating">★ {restaurant.rating?.toFixed(1) || '5.0'}</Text>
              <Text className="restaurant-page__hero-sep">·</Text>
              <Text className="restaurant-page__hero-time">{restaurant.deliveryTime}</Text>
              <Text className="restaurant-page__hero-sep">·</Text>
              <Text className="restaurant-page__hero-fee">
                {restaurant.deliveryFee === 0 ? '免配送费' : `配送费¥${restaurant.deliveryFee}`}
              </Text>
            </View>
            <Text className="restaurant-page__hero-min">起送价¥{restaurant.minOrder}</Text>
          </View>
        </View>
      )}

      {categories.length > 0 && (
        <View className="restaurant-page__menu">
          <ScrollView className="restaurant-page__cats" scrollX>
            {categories.map((cat, idx) => (
              <View
                key={cat.id}
                className={`restaurant-page__cat ${activeCat === idx ? 'restaurant-page__cat--active' : ''}`}
                onClick={() => setActiveCat(idx)}
              >
                <Text className="restaurant-page__cat-name">{cat.name}</Text>
              </View>
            ))}
          </ScrollView>

          <ScrollView className="restaurant-page__items-scroll" scrollY>
            {categories[activeCat]?.items.map((item) => {
              const count = getItemCount(item.id)
              return (
                <View key={item.id} className="restaurant-page__item">
                  <Image
                    className="restaurant-page__item-img"
                    src={item.image || 'https://via.placeholder.com/80?text=菜'}
                    mode="aspectFill"
                  />
                  <View className="restaurant-page__item-info">
                    <Text className="restaurant-page__item-name">{item.name}</Text>
                    {item.description && (
                      <Text className="restaurant-page__item-desc">{item.description}</Text>
                    )}
                    <View className="restaurant-page__item-bottom">
                      <Text className="restaurant-page__item-price">¥{Number(item.price).toFixed(2)}</Text>
                      <View className="restaurant-page__item-ctrl">
                        {count > 0 && (
                          <>
                            <View
                              className="restaurant-page__ctrl-btn restaurant-page__ctrl-btn--minus"
                              onClick={() => handleRemove(item.id)}
                            >
                              <Text>-</Text>
                            </View>
                            <Text className="restaurant-page__ctrl-count">{count}</Text>
                          </>
                        )}
                        <View
                          className={`restaurant-page__ctrl-btn restaurant-page__ctrl-btn--plus ${item.status === 'sold_out' ? 'restaurant-page__ctrl-btn--disabled' : ''}`}
                          onClick={() => item.status !== 'sold_out' && handleAdd(item)}
                        >
                          <Text>{item.status === 'sold_out' ? '售完' : '+'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}
            <View style={{ height: '160px' }} />
          </ScrollView>
        </View>
      )}

      {totalCount > 0 && (
        <View className="restaurant-page__cart-bar" onClick={handleGoToCart}>
          <View className="restaurant-page__cart-icon-wrap">
            <Text className="restaurant-page__cart-icon">🛒</Text>
            <View className="restaurant-page__cart-badge">
              <Text className="restaurant-page__cart-badge-text">{totalCount}</Text>
            </View>
          </View>
          <Text className="restaurant-page__cart-price">¥{totalPrice.toFixed(2)}</Text>
          <Text className="restaurant-page__cart-action">去结算</Text>
        </View>
      )}
    </View>
  )
}
