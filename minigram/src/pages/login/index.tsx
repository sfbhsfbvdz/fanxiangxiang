import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Input, Toast } from '@nutui/nutui-react-taro'
import { authApi } from '../../api/auth'
import { authStore } from '../../store/auth'
import './index.scss'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const handleLogin = async () => {
    if (!email.trim()) {
      showToast('请输入邮箱')
      return
    }
    if (!password) {
      showToast('请输入密码')
      return
    }
    setLoading(true)
    try {
      const result = await authApi.login({ email: email.trim(), password })
      authStore.setUser(result.user)
      const role = result.user.role || 'customer'
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
    } catch (err: any) {
      showToast(err?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className="login-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <View className="login-page__header">
        <View className="login-page__logo">🍱</View>
        <Text className="login-page__title">饭饭香</Text>
        <Text className="login-page__subtitle">校园外卖，快速送达</Text>
      </View>

      <View className="login-page__form">
        <View className="login-page__field">
          <Input
            className="login-page__input"
            type="text"
            placeholder="请输入邮箱"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>
        <View className="login-page__field">
          <Input
            className="login-page__input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button
          className="login-page__btn"
          type="primary"
          block
          loading={loading}
          onClick={handleLogin}
          color="#ff6b35"
        >
          登录
        </Button>

        <View className="login-page__register" onClick={handleToRegister}>
          <Text className="login-page__register-text">还没有账号？</Text>
          <Text className="login-page__register-link">立即注册</Text>
        </View>
      </View>
    </View>
  )
}
