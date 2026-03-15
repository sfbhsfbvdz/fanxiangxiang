import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { SearchBar, Toast } from '@nutui/nutui-react-taro'
import { restaurantsApi } from '../../api/restaurants'
import { Restaurant } from '../../types'
import { authStore } from '../../store/auth'
import RestaurantCard from '../../components/RestaurantCard'
import './index.scss'

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchRestaurants = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const result = await restaurantsApi.getRestaurants(q || undefined)
      setRestaurants(result.restaurants)
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Redirect non-customer roles
    const role = authStore.getRole()
    if (role === 'merchant') {
      Taro.reLaunch({ url: '/pages/merchant-home/index' })
      return
    }
    if (role === 'rider') {
      Taro.reLaunch({ url: '/pages/rider-home/index' })
      return
    }
    if (role === 'admin') {
      Taro.reLaunch({ url: '/pages/admin-dashboard/index' })
      return
    }
    fetchRestaurants()
  }, [fetchRestaurants])

  const handleSearch = () => {
    setSearch(searchInput)
    fetchRestaurants(searchInput)
  }

  const handleSearchClear = () => {
    setSearchInput('')
    setSearch('')
    fetchRestaurants()
  }

  const user = authStore.getUser()

  return (
    <View className="home-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <View className="home-page__header">
        <View className="home-page__header-top">
          <View className="home-page__greeting">
            <Text className="home-page__greeting-text">
              {user ? `👋 ${user.username}` : '👋 欢迎来到饭饭香'}
            </Text>
            <Text className="home-page__greeting-sub">发现校园美食</Text>
          </View>
          {!user && (
            <View
              className="home-page__login-btn"
              onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
            >
              <Text className="home-page__login-btn-text">登录</Text>
            </View>
          )}
        </View>

        <View className="home-page__search-wrap">
          <SearchBar
            className="home-page__search"
            placeholder="搜索餐厅或菜品"
            value={searchInput}
            onChange={(val) => setSearchInput(val)}
            onSearch={handleSearch}
            onClear={handleSearchClear}
          />
        </View>
      </View>

      <ScrollView
        className="home-page__content"
        scrollY
        enableFlex
        enhanced
      >
        {loading ? (
          <View className="home-page__loading">
            <Text className="home-page__loading-text">加载中...</Text>
          </View>
        ) : restaurants.length === 0 ? (
          <View className="home-page__empty">
            <Text className="home-page__empty-icon">🍽️</Text>
            <Text className="home-page__empty-text">
              {search ? '没有找到相关餐厅' : '暂无餐厅'}
            </Text>
          </View>
        ) : (
          <View className="home-page__list">
            <Text className="home-page__section-title">
              {search ? `"${search}" 搜索结果` : '附近餐厅'}
              <Text className="home-page__section-count">共{restaurants.length}家</Text>
            </Text>
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
