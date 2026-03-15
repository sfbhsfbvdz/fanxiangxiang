import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { merchantApi, MerchantRestaurant } from '../../api/merchant'
import { authStore } from '../../store/auth'
import './index.scss'

export default function MerchantHomePage() {
  const [restaurant, setRestaurant] = useState<MerchantRestaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    const user = authStore.getUser()
    if (!user || user.role !== 'merchant') {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const res = await merchantApi.getRestaurant()
        setRestaurant(res.data!)
      } catch (err: any) {
        showToast(err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggleStatus = async () => {
    if (!restaurant) return
    const newStatus = restaurant.status === 'active' ? 'inactive' : 'active'
    setToggling(true)
    try {
      await merchantApi.updateRestaurant({ status: newStatus })
      setRestaurant({ ...restaurant, status: newStatus })
      showToast(newStatus === 'active' ? '已开店' : '已休息')
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    } finally {
      setToggling(false)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定退出吗？',
      success: (res) => {
        if (res.confirm) {
          authStore.clearUser()
          Taro.removeStorageSync('fanxiangxiang_token')
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  if (loading) {
    return (
      <View className="merchant-home__loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="merchant-home">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <View className="merchant-home__header">
        <View className="merchant-home__title-row">
          <Text className="merchant-home__title">商家中心</Text>
          <Text className="merchant-home__logout" onClick={handleLogout}>退出</Text>
        </View>
        {restaurant && (
          <View className="merchant-home__restaurant-card">
            <Text className="merchant-home__restaurant-name">{restaurant.name}</Text>
            <View
              className={`merchant-home__status-badge merchant-home__status-badge--${restaurant.status}`}
            >
              <Text className="merchant-home__status-text">
                {restaurant.status === 'active' ? '营业中' : '已休息'}
              </Text>
            </View>
            <View className="merchant-home__meta">
              <Text className="merchant-home__meta-item">
                配送费: ¥{restaurant.delivery_fee}
              </Text>
              <Text className="merchant-home__meta-item">
                起送: ¥{restaurant.min_order}
              </Text>
              <Text className="merchant-home__meta-item">
                时间: {restaurant.delivery_time}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="merchant-home__quick-actions">
        <View
          className="merchant-home__action-card"
          onClick={() => Taro.navigateTo({ url: '/pages/merchant-orders/index' })}
        >
          <Text className="merchant-home__action-icon">📋</Text>
          <Text className="merchant-home__action-label">订单管理</Text>
        </View>
        <View
          className="merchant-home__action-card"
          onClick={() => Taro.navigateTo({ url: '/pages/merchant-menu/index' })}
        >
          <Text className="merchant-home__action-icon">🍜</Text>
          <Text className="merchant-home__action-label">菜单管理</Text>
        </View>
      </View>

      <View className="merchant-home__toggle">
        <Button
          type={restaurant?.status === 'active' ? 'default' : 'primary'}
          block
          loading={toggling}
          onClick={handleToggleStatus}
          color={restaurant?.status === 'active' ? undefined : '#ff6b35'}
        >
          {restaurant?.status === 'active' ? '暂停营业' : '开始营业'}
        </Button>
      </View>
    </View>
  )
}
