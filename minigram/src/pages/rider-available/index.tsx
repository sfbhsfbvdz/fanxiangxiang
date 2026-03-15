import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { riderApi, RiderOrder } from '../../api/rider'
import './index.scss'

export default function RiderAvailablePage() {
  const [orders, setOrders] = useState<RiderOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await riderApi.getAvailableOrders()
      setOrders(res.data || [])
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleAccept = async (orderId: number) => {
    setActionId(orderId)
    try {
      await riderApi.acceptOrder(orderId)
      showToast('已接单，请前往取餐')
      await fetchOrders()
    } catch (err: any) {
      showToast(err?.message || '接单失败')
    } finally {
      setActionId(null)
    }
  }

  return (
    <View className="rider-available">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="rider-available__header">
        <Text className="rider-available__title">可接订单</Text>
        <Text className="rider-available__refresh" onClick={fetchOrders}>刷新</Text>
      </View>

      <ScrollView className="rider-available__content" scrollY>
        {loading ? (
          <View className="rider-available__loading"><Text>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="rider-available__empty">
            <Text className="rider-available__empty-icon">📭</Text>
            <Text className="rider-available__empty-text">暂无可接订单</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} className="rider-available__order">
              <View className="rider-available__order-header">
                <Text className="rider-available__order-id">订单 #{order.id}</Text>
                <Text className="rider-available__order-fee">配送费 ¥{Number(order.delivery_fee).toFixed(2)}</Text>
              </View>

              <View className="rider-available__order-restaurant">
                <Text className="rider-available__label">取餐点：</Text>
                <Text className="rider-available__value">{order.restaurant_name}</Text>
              </View>

              <View className="rider-available__order-address">
                <Text className="rider-available__label">配送到：</Text>
                <Text className="rider-available__value">{order.delivery_address}</Text>
              </View>

              <View className="rider-available__order-amount">
                <Text className="rider-available__label">订单金额：</Text>
                <Text className="rider-available__amount">¥{Number(order.total_price).toFixed(2)}</Text>
              </View>

              {order.notes && (
                <Text className="rider-available__notes">备注：{order.notes}</Text>
              )}

              <Button
                type="primary"
                block
                loading={actionId === order.id}
                onClick={() => handleAccept(order.id)}
                color="#07c160"
                className="rider-available__accept-btn"
              >
                接单
              </Button>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
