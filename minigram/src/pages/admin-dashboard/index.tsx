import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Toast } from '@nutui/nutui-react-taro'
import { adminApi, AdminStats, AdminRestaurant } from '../../api/admin'
import { authStore } from '../../store/auth'
import './index.scss'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    const user = authStore.getUser()
    if (!user || user.role !== 'admin') {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const [statsRes, restRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getRestaurants(),
        ])
        setStats(statsRes.data!)
        setRestaurants(restRes.data || [])
      } catch (err: any) {
        showToast(err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggleRestaurant = async (rest: AdminRestaurant) => {
    const newStatus = rest.status === 'active' ? 'inactive' : 'active'
    try {
      await adminApi.updateRestaurantStatus(rest.id, newStatus)
      setRestaurants(restaurants.map((r) =>
        r.id === rest.id ? { ...r, status: newStatus } : r
      ))
      showToast(`${rest.name} 已${newStatus === 'active' ? '开启' : '暂停'}`)
    } catch (err: any) {
      showToast(err?.message || '操作失败')
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

  return (
    <View className="admin-dashboard">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="admin-dashboard__header">
        <View className="admin-dashboard__title-row">
          <Text className="admin-dashboard__title">管理后台</Text>
          <Text className="admin-dashboard__logout" onClick={handleLogout}>退出</Text>
        </View>
      </View>

      <ScrollView className="admin-dashboard__content" scrollY>
        {/* Stats cards */}
        {loading ? (
          <View className="admin-dashboard__loading"><Text>加载中...</Text></View>
        ) : (
          <>
            {stats && (
              <View className="admin-dashboard__stats">
                <View className="admin-dashboard__stat-card admin-dashboard__stat-card--blue">
                  <Text className="admin-dashboard__stat-val">{stats.totalOrders}</Text>
                  <Text className="admin-dashboard__stat-label">总订单数</Text>
                </View>
                <View className="admin-dashboard__stat-card admin-dashboard__stat-card--orange">
                  <Text className="admin-dashboard__stat-val">¥{Number(stats.totalRevenue).toFixed(0)}</Text>
                  <Text className="admin-dashboard__stat-label">总营业额</Text>
                </View>
                <View className="admin-dashboard__stat-card admin-dashboard__stat-card--green">
                  <Text className="admin-dashboard__stat-val">{stats.totalUsers}</Text>
                  <Text className="admin-dashboard__stat-label">注册用户</Text>
                </View>
                <View className="admin-dashboard__stat-card admin-dashboard__stat-card--purple">
                  <Text className="admin-dashboard__stat-val">{stats.activeRestaurants}</Text>
                  <Text className="admin-dashboard__stat-label">营业餐厅</Text>
                </View>
              </View>
            )}

            {/* Quick nav */}
            <View className="admin-dashboard__quick-nav">
              <View
                className="admin-dashboard__nav-item"
                onClick={() => Taro.navigateTo({ url: '/pages/admin-orders/index' })}
              >
                <Text className="admin-dashboard__nav-icon">📋</Text>
                <Text className="admin-dashboard__nav-label">订单管理</Text>
              </View>
            </View>

            {/* Restaurants */}
            <View className="admin-dashboard__section">
              <Text className="admin-dashboard__section-title">餐厅列表</Text>
              {restaurants.map((rest) => (
                <View key={rest.id} className="admin-dashboard__restaurant">
                  <View className="admin-dashboard__restaurant-info">
                    <Text className="admin-dashboard__restaurant-name">{rest.name}</Text>
                    <Text className="admin-dashboard__restaurant-stats">
                      订单 {rest.order_count} · 评分 {Number(rest.rating).toFixed(1)}
                    </Text>
                  </View>
                  <View
                    className={`admin-dashboard__restaurant-toggle admin-dashboard__restaurant-toggle--${rest.status}`}
                    onClick={() => handleToggleRestaurant(rest)}
                  >
                    <Text className="admin-dashboard__restaurant-toggle-text">
                      {rest.status === 'active' ? '营业中' : '已关闭'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
