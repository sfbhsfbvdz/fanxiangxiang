import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Input, Toast, NavBar } from '@nutui/nutui-react-taro'
import { authApi } from '../../api/auth'
import { authStore } from '../../store/auth'
import './index.scss'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      showToast('请输入用户名')
      return
    }
    if (!email.trim()) {
      showToast('请输入邮箱')
      return
    }
    if (!password || password.length < 6) {
      showToast('密码至少6位')
      return
    }
    setLoading(true)
    try {
      const result = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      })
      authStore.setUser(result.user)
      showToast('注册成功！')
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' })
      }, 1000)
    } catch (err: any) {
      showToast(err?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="register-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <NavBar
        className="register-page__navbar"
        title="注册账号"
        back={<Text className="register-page__back">‹</Text>}
        onBackClick={handleBack}
      />

      <View className="register-page__body">
        <View className="register-page__header">
          <View className="register-page__logo">🍱</View>
          <Text className="register-page__title">创建账号</Text>
          <Text className="register-page__subtitle">加入饭饭香，享受校园美食</Text>
        </View>

        <View className="register-page__form">
          <View className="register-page__field">
            <Text className="register-page__label">用户名 *</Text>
            <Input
              className="register-page__input"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
          <View className="register-page__field">
            <Text className="register-page__label">邮箱 *</Text>
            <Input
              className="register-page__input"
              type="text"
              placeholder="请输入邮箱"
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>
          <View className="register-page__field">
            <Text className="register-page__label">密码 *</Text>
            <Input
              className="register-page__input"
              type="password"
              placeholder="请输入密码（至少6位）"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
          <View className="register-page__field">
            <Text className="register-page__label">手机号</Text>
            <Input
              className="register-page__input"
              type="number"
              placeholder="请输入手机号（选填）"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>

          <Button
            className="register-page__btn"
            type="primary"
            block
            loading={loading}
            onClick={handleRegister}
            color="#ff6b35"
          >
            立即注册
          </Button>

          <View className="register-page__login" onClick={() => Taro.navigateBack()}>
            <Text className="register-page__login-text">已有账号？</Text>
            <Text className="register-page__login-link">返回登录</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
