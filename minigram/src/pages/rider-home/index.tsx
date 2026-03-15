import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { riderApi, RiderStatus } from '../../api/rider'
import { authStore } from '../../store/auth'
import './index.scss'

export default function RiderHomePage() {
  const [riderStatus, setRiderStatus] = useState<RiderStatus | null>(null)
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
    if (!user || user.role !== 'rider') {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const res = await riderApi.getStatus()
        setRiderStatus(res.data!)
      } catch (err: any) {
        showToast(err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggleOnline = async () => {
    if (!riderStatus) return
    const newStatus = riderStatus.status === 'offline' ? 'online' : 'offline'
    setToggling(true)
    try {
      await riderApi.updateStatus(newStatus)
      setRiderStatus({ ...riderStatus, status: newStatus })
      showToast(newStatus === 'online' ? '已上线，开始接单' : '已下线')
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

  const isOnline = riderStatus?.status !== 'offline'

  return (
    <View className="rider-home">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="rider-home__header">
        <View className="rider-home__title-row">
          <Text className="rider-home__title">骑手中心</Text>
          <Text className="rider-home__logout" onClick={handleLogout}>退出</Text>
        </View>

        <View className={`rider-home__status-card rider-home__status-card--${riderStatus?.status || 'offline'}`}>
          <Text className="rider-home__status-icon">{isOnline ? '🛵' : '💤'}</Text>
          <Text className="rider-home__status-text">
            {riderStatus?.status === 'offline'
              ? '当前离线'
              : riderStatus?.status === 'delivering'
              ? '配送中'
              : '在线接单中'}
          </Text>
          {riderStatus?.vehicle_type && (
            <Text className="rider-home__vehicle">{riderStatus.vehicle_type}</Text>
          )}
        </View>
      </View>

      <View className="rider-home__actions">
        <View
          className="rider-home__action-card"
          onClick={() => Taro.navigateTo({ url: '/pages/rider-available/index' })}
        >
          <Text className="rider-home__action-icon">📦</Text>
          <Text className="rider-home__action-label">可接订单</Text>
        </View>
        <View
          className="rider-home__action-card"
          onClick={() => Taro.navigateTo({ url: '/pages/rider-delivery/index' })}
        >
          <Text className="rider-home__action-icon">🗺️</Text>
          <Text className="rider-home__action-label">我的配送</Text>
        </View>
      </View>

      <View className="rider-home__toggle">
        <Button
          type={isOnline ? 'default' : 'primary'}
          block
          loading={loading || toggling}
          onClick={handleToggleOnline}
          color={isOnline ? undefined : '#ff6b35'}
        >
          {isOnline ? '下线休息' : '上线接单'}
        </Button>
      </View>
    </View>
  )
}
