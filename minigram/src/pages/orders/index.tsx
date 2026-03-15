import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Tabs, Toast } from '@nutui/nutui-react-taro'
import { ordersApi } from '../../api/orders'
import { OrderWithDetails, OrderStatus } from '../../types'
import { authStore } from '../../store/auth'
import OrderCard from '../../components/OrderCard'
import './index.scss'

const TAB_LIST = [
  { title: '全部', value: undefined },
  { title: '进行中', value: 'preparing' as OrderStatus },
  { title: '配送中', value: 'delivering' as OrderStatus },
  { title: '已完成', value: 'completed' as OrderStatus },
  { title: '已取消', value: 'cancelled' as OrderStatus },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchOrders = async (status?: OrderStatus) => {
    if (!authStore.isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setLoading(true)
    try {
      const result = await ordersApi.getOrders(status)
      setOrders(result.orders)
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(TAB_LIST[activeTab].value)
  }, [activeTab])

  // Refresh when page shows
  useEffect(() => {
    Taro.eventCenter.on('orderRefresh', () => {
      fetchOrders(TAB_LIST[activeTab].value)
    })
    return () => {
      Taro.eventCenter.off('orderRefresh')
    }
  }, [activeTab])

  return (
    <View className="orders-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      <View className="orders-page__header">
        <Text className="orders-page__title">我的订单</Text>
      </View>

      <Tabs
        className="orders-page__tabs"
        value={activeTab}
        onChange={(v) => setActiveTab(v as number)}
        activeColor="#ff6b35"
      >
        {TAB_LIST.map((tab, idx) => (
          <Tabs.TabPane key={idx} title={tab.title} value={idx} />
        ))}
      </Tabs>

      <ScrollView className="orders-page__content" scrollY>
        {loading ? (
          <View className="orders-page__loading">
            <Text className="orders-page__loading-text">加载中...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="orders-page__empty">
            <Text className="orders-page__empty-icon">📋</Text>
            <Text className="orders-page__empty-text">暂无订单</Text>
            <Text
              className="orders-page__empty-link"
              onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
            >
              去点餐
            </Text>
          </View>
        ) : (
          <View className="orders-page__list">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRefresh={() => fetchOrders(TAB_LIST[activeTab].value)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
