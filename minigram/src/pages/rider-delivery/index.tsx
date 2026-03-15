import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { riderApi, RiderOrder } from '../../api/rider'
import './index.scss'

const STATUS_LABELS: Record<string, string> = {
  preparing: '备餐中',
  delivering: '配送中',
  completed: '已完成',
}

export default function RiderDeliveryPage() {
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
      const res = await riderApi.getMyOrders()
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

  const handlePicked = async (orderId: number) => {
    setActionId(orderId)
    try {
      await riderApi.pickedOrder(orderId)
      showToast('已取餐，开始配送')
      await fetchOrders()
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    } finally {
      setActionId(null)
    }
  }

  const handleDelivered = async (orderId: number) => {
    Taro.showModal({
      title: '确认送达',
      content: '是否上传配送凭证照片？',
      confirmText: '拍照上传',
      cancelText: '直接完成',
      success: async (res) => {
        if (res.confirm) {
          // 拍照上传
          try {
            const chosen = await Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['camera', 'album'] })
            const filePath = chosen.tempFilePaths[0]
            setActionId(orderId)
            try {
              // 读取为 base64
              const fsm = Taro.getFileSystemManager()
              const base64 = await new Promise<string>((resolve, reject) => {
                fsm.readFile({ filePath, encoding: 'base64', success: (r) => resolve(`data:image/jpeg;base64,${r.data}`), fail: reject })
              })
              await riderApi.deliveredOrder(orderId, base64)
              showToast('配送完成，已上传凭证！')
              await fetchOrders()
            } catch (err: any) {
              showToast(err?.message || '操作失败')
            } finally {
              setActionId(null)
            }
          } catch {
            // 取消选图，不做任何操作
          }
        } else {
          // 直接完成，不上传照片
          setActionId(orderId)
          try {
            await riderApi.deliveredOrder(orderId)
            showToast('配送完成！')
            await fetchOrders()
          } catch (err: any) {
            showToast(err?.message || '操作失败')
          } finally {
            setActionId(null)
          }
        }
      },
    })
  }

  const activeOrders = orders.filter((o) => o.status !== 'completed')
  const completedOrders = orders.filter((o) => o.status === 'completed')

  return (
    <View className="rider-delivery">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="rider-delivery__header">
        <Text className="rider-delivery__title">我的配送</Text>
        <Text className="rider-delivery__refresh" onClick={fetchOrders}>刷新</Text>
      </View>

      <ScrollView className="rider-delivery__content" scrollY>
        {loading ? (
          <View className="rider-delivery__loading"><Text>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="rider-delivery__empty">
            <Text className="rider-delivery__empty-icon">🏍️</Text>
            <Text className="rider-delivery__empty-text">暂无配送任务</Text>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <View className="rider-delivery__section">
                <Text className="rider-delivery__section-title">进行中 ({activeOrders.length})</Text>
                {activeOrders.map((order) => (
                  <View key={order.id} className="rider-delivery__order">
                    <View className="rider-delivery__order-header">
                      <Text className="rider-delivery__order-id">#{order.id}</Text>
                      <Text className={`rider-delivery__order-status rider-delivery__order-status--${order.status}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Text>
                    </View>
                    <View className="rider-delivery__order-row">
                      <Text className="rider-delivery__order-label">取餐：</Text>
                      <Text className="rider-delivery__order-val">{order.restaurant_name}</Text>
                    </View>
                    <View className="rider-delivery__order-row">
                      <Text className="rider-delivery__order-label">配送到：</Text>
                      <Text className="rider-delivery__order-val">{order.delivery_address}</Text>
                    </View>
                    <View className="rider-delivery__order-row">
                      <Text className="rider-delivery__order-label">配送费：</Text>
                      <Text className="rider-delivery__order-fee">¥{Number(order.delivery_fee).toFixed(2)}</Text>
                    </View>
                    <View className="rider-delivery__order-actions">
                      {order.status === 'preparing' && (
                        <Button
                          type="primary"
                          block
                          loading={actionId === order.id}
                          onClick={() => handlePicked(order.id)}
                          color="#07c160"
                        >
                          已取餐
                        </Button>
                      )}
                      {order.status === 'delivering' && (
                        <Button
                          type="primary"
                          block
                          loading={actionId === order.id}
                          onClick={() => handleDelivered(order.id)}
                          color="#1989fa"
                        >
                          确认送达
                        </Button>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {completedOrders.length > 0 && (
              <View className="rider-delivery__section">
                <Text className="rider-delivery__section-title">已完成 ({completedOrders.length})</Text>
                {completedOrders.map((order) => (
                  <View key={order.id} className="rider-delivery__order rider-delivery__order--completed">
                    <View className="rider-delivery__order-header">
                      <Text className="rider-delivery__order-id">#{order.id}</Text>
                      <Text className="rider-delivery__order-status rider-delivery__order-status--completed">
                        已完成
                      </Text>
                    </View>
                    <Text className="rider-delivery__order-summary">
                      {order.restaurant_name} → {order.delivery_address}
                    </Text>
                    <Text className="rider-delivery__order-fee">
                      配送费 ¥{Number(order.delivery_fee).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
