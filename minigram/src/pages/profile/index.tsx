import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Cell, Toast } from '@nutui/nutui-react-taro'
import { authStore } from '../../store/auth'
import { authApi } from '../../api/auth'
import { User } from '../../types'
import './index.scss'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(authStore.getUser())
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    if (!authStore.isLoggedIn()) return
    const refresh = async () => {
      try {
        const u = await authApi.getProfile()
        authStore.setUser(u)
        setUser(u)
      } catch {}
    }
    refresh()
  }, [])

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authApi.logout()
          authStore.clearUser()
          setUser(null)
          showToast('已退出登录')
        }
      },
    })
  }

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'merchant': return '商家'
      case 'rider': return '骑手'
      case 'admin': return '管理员'
      default: return '用户'
    }
  }

  return (
    <View className="profile-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <View className="profile-page__header">
        {user ? (
          <View className="profile-page__user-info">
            <View className="profile-page__avatar">
              {user.avatar ? (
                <Image
                  className="profile-page__avatar-img"
                  src={user.avatar}
                  mode="aspectFill"
                />
              ) : (
                <Text className="profile-page__avatar-default">
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View className="profile-page__user-detail">
              <Text className="profile-page__username">{user.username}</Text>
              <Text className="profile-page__email">{user.email}</Text>
              <View className="profile-page__role-badge">
                <Text className="profile-page__role-text">{roleLabel(user.role)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="profile-page__guest" onClick={handleLogin}>
            <View className="profile-page__avatar profile-page__avatar--guest">
              <Text className="profile-page__avatar-default">?</Text>
            </View>
            <View className="profile-page__user-detail">
              <Text className="profile-page__username">点击登录</Text>
              <Text className="profile-page__email">登录后享受更多功能</Text>
            </View>
          </View>
        )}
      </View>

      <View className="profile-page__menu">
        {user && (
          <>
            <View className="profile-page__section">
              <Text className="profile-page__section-title">账户</Text>
              <View
                className="profile-page__cell"
                onClick={() => Taro.navigateTo({ url: '/pages/address/index' })}
              >
                <Text className="profile-page__cell-icon">📍</Text>
                <Text className="profile-page__cell-label">收货地址</Text>
                <Text className="profile-page__cell-arrow">›</Text>
              </View>
              <View
                className="profile-page__cell"
                onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
              >
                <Text className="profile-page__cell-icon">📋</Text>
                <Text className="profile-page__cell-label">我的订单</Text>
                <Text className="profile-page__cell-arrow">›</Text>
              </View>
            </View>

            {user.role === 'merchant' && (
              <View className="profile-page__section">
                <Text className="profile-page__section-title">商家工具</Text>
                <View
                  className="profile-page__cell"
                  onClick={() => Taro.navigateTo({ url: '/pages/merchant-home/index' })}
                >
                  <Text className="profile-page__cell-icon">🏪</Text>
                  <Text className="profile-page__cell-label">商家中心</Text>
                  <Text className="profile-page__cell-arrow">›</Text>
                </View>
              </View>
            )}

            {user.role === 'rider' && (
              <View className="profile-page__section">
                <Text className="profile-page__section-title">骑手工具</Text>
                <View
                  className="profile-page__cell"
                  onClick={() => Taro.navigateTo({ url: '/pages/rider-home/index' })}
                >
                  <Text className="profile-page__cell-icon">🛵</Text>
                  <Text className="profile-page__cell-label">骑手中心</Text>
                  <Text className="profile-page__cell-arrow">›</Text>
                </View>
              </View>
            )}

            {user.role === 'admin' && (
              <View className="profile-page__section">
                <Text className="profile-page__section-title">管理工具</Text>
                <View
                  className="profile-page__cell"
                  onClick={() => Taro.navigateTo({ url: '/pages/admin-dashboard/index' })}
                >
                  <Text className="profile-page__cell-icon">⚙️</Text>
                  <Text className="profile-page__cell-label">管理后台</Text>
                  <Text className="profile-page__cell-arrow">›</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View className="profile-page__section">
          <Text className="profile-page__section-title">关于</Text>
          <View className="profile-page__cell">
            <Text className="profile-page__cell-icon">🍱</Text>
            <Text className="profile-page__cell-label">饭饭香</Text>
            <Text className="profile-page__cell-val">v1.0.0</Text>
          </View>
        </View>
      </View>

      {user && (
        <View className="profile-page__logout">
          <Button
            block
            type="default"
            onClick={handleLogout}
            className="profile-page__logout-btn"
          >
            退出登录
          </Button>
        </View>
      )}

      {!user && (
        <View className="profile-page__login-action">
          <Button
            block
            type="primary"
            onClick={handleLogin}
            color="#ff6b35"
          >
            登录账号
          </Button>
        </View>
      )}
    </View>
  )
}
