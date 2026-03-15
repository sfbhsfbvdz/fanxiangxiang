import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Toast, Tabs } from '@nutui/nutui-react-taro'
import { adminApi, AdminOrder } from '../../api/admin'
import './index.scss'

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  preparing: '准备中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const TABS = [
  { title: '全部', status: undefined },
  { title: '进行中', status: 'preparing' },
  { title: '配送中', status: 'delivering' },
  { title: '已完成', status: 'completed' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchOrders = async (status?: string, p = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.getOrders({ status, page: p, limit: 20 })
      const data = res.data!
      if (p === 1) {
        setOrders(data.items)
      } else {
        setOrders((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
      setPage(p)
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(TABS[activeTab].status, 1)
  }, [activeTab])

  const handleLoadMore = () => {
    const nextPage = page + 1
    if (orders.length < total) {
      fetchOrders(TABS[activeTab].status, nextPage)
    }
  }

  return (
    <View className="admin-orders">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="admin-orders__header">
        <Text className="admin-orders__title">订单管理</Text>
        <Text className="admin-orders__total">共 {total} 条</Text>
      </View>

      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab(v as number)}
        activeColor="#333"
        className="admin-orders__tabs"
      >
        {TABS.map((tab, idx) => (
          <Tabs.TabPane key={idx} title={tab.title} value={idx} />
        ))}
      </Tabs>

      <ScrollView
        className="admin-orders__content"
        scrollY
        onScrollToLower={handleLoadMore}
      >
        {loading && orders.length === 0 ? (
          <View className="admin-orders__loading"><Text>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="admin-orders__empty">
            <Text className="admin-orders__empty-text">暂无订单</Text>
          </View>
        ) : (
          <>
            {orders.map((order) => (
              <View key={order.id} className="admin-orders__order">
                <View className="admin-orders__order-header">
                  <Text className="admin-orders__order-id">#{order.id}</Text>
                  <Text className={`admin-orders__order-status admin-orders__order-status--${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>

                <View className="admin-orders__order-info">
                  <Text className="admin-orders__order-row">
                    <Text className="admin-orders__order-key">用户：</Text>
                    {order.username} ({order.email})
                  </Text>
                  <Text className="admin-orders__order-row">
                    <Text className="admin-orders__order-key">餐厅：</Text>
                    {order.restaurant_name}
                  </Text>
                  <Text className="admin-orders__order-row">
                    <Text className="admin-orders__order-key">地址：</Text>
                    {order.delivery_address}
                  </Text>
                </View>

                <View className="admin-orders__order-footer">
                  <Text className="admin-orders__order-price">¥{Number(order.total_price).toFixed(2)}</Text>
                  <Text className="admin-orders__order-date">
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </Text>
                </View>
              </View>
            ))}
            {orders.length < total && (
              <View className="admin-orders__load-more" onClick={handleLoadMore}>
                <Text className="admin-orders__load-more-text">
                  {loading ? '加载中...' : '加载更多'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
