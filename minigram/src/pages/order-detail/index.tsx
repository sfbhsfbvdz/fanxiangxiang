import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { ordersApi } from '../../api/orders'
import { OrderWithDetails, OrderStatus } from '../../types'
import './index.scss'

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  preparing: '准备中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_STEPS = ['pending', 'paid', 'preparing', 'delivering', 'completed']

export default function OrderDetailPage() {
  const router = useRouter()
  const id = Number(router.params.id)
  const isSuccess = router.params.success === '1'

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    if (isSuccess) {
      showToast('下单成功！')
    }
  }, [isSuccess])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await ordersApi.getOrderById(id)
        setOrder(data)
      } catch (err: any) {
        showToast(err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleCancel = () => {
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        setCancelling(true)
        try {
          await ordersApi.cancelOrder(id)
          const updated = await ordersApi.getOrderById(id)
          setOrder(updated)
          showToast('订单已取消')
        } catch (err: any) {
          showToast(err?.message || '取消失败')
        } finally {
          setCancelling(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <View className="order-detail__loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!order) {
    return (
      <View className="order-detail__loading">
        <Text>订单不存在</Text>
      </View>
    )
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status
  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <View className="order-detail">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      {/* Status banner */}
      <View className={`order-detail__banner order-detail__banner--${order.status}`}>
        <Text className="order-detail__banner-status">{statusLabel}</Text>
        <Text className="order-detail__banner-id">订单号：{order.id}</Text>
      </View>

      {/* Progress bar */}
      {order.status !== 'cancelled' && (
        <View className="order-detail__progress">
          {STATUS_STEPS.map((step, idx) => (
            <View key={step} className="order-detail__step">
              <View
                className={`order-detail__step-dot ${idx <= currentStep ? 'order-detail__step-dot--active' : ''}`}
              />
              <Text
                className={`order-detail__step-label ${idx <= currentStep ? 'order-detail__step-label--active' : ''}`}
              >
                {STATUS_LABELS[step]}
              </Text>
              {idx < STATUS_STEPS.length - 1 && (
                <View
                  className={`order-detail__step-line ${idx < currentStep ? 'order-detail__step-line--active' : ''}`}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Restaurant */}
      <View className="order-detail__section">
        <View className="order-detail__restaurant">
          <Image
            className="order-detail__restaurant-img"
            src={order.restaurant?.image || 'https://via.placeholder.com/48?text=餐'}
            mode="aspectFill"
          />
          <Text className="order-detail__restaurant-name">{order.restaurant?.name}</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} className="order-detail__item">
            <Text className="order-detail__item-name">{item.name}</Text>
            <Text className="order-detail__item-count">x{item.quantity}</Text>
            <Text className="order-detail__item-price">¥{Number(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View className="order-detail__divider" />
        <View className="order-detail__fee-row">
          <Text className="order-detail__fee-label">配送费</Text>
          <Text className="order-detail__fee-val">
            {Number(order.deliveryFee) === 0 ? '免费' : `¥${Number(order.deliveryFee).toFixed(2)}`}
          </Text>
        </View>
        {order.tip > 0 && (
          <View className="order-detail__fee-row">
            <Text className="order-detail__fee-label">🎁 骑手打赏</Text>
            <Text className="order-detail__fee-val order-detail__fee-val--tip">¥{Number(order.tip).toFixed(2)}</Text>
          </View>
        )}
        {order.extraCharge > 0 && (
          <View className="order-detail__fee-row">
            <Text className="order-detail__fee-label">
              商家加价{order.extraChargeNote ? `（${order.extraChargeNote}）` : ''}
            </Text>
            <Text className="order-detail__fee-val order-detail__fee-val--extra">¥{Number(order.extraCharge).toFixed(2)}</Text>
          </View>
        )}
        <View className="order-detail__total-row">
          <Text className="order-detail__total-label">合计</Text>
          <Text className="order-detail__total-val">¥{Number(order.totalPrice).toFixed(2)}</Text>
        </View>
      </View>

      {/* Delivery info */}
      <View className="order-detail__section">
        <Text className="order-detail__section-title">配送信息</Text>
        <View className="order-detail__info-row">
          <Text className="order-detail__info-key">收货地址</Text>
          <Text className="order-detail__info-val">{order.deliveryAddress}</Text>
        </View>
        {order.notes && (
          <View className="order-detail__info-row">
            <Text className="order-detail__info-key">备注</Text>
            <Text className="order-detail__info-val">{order.notes}</Text>
          </View>
        )}
        {order.photoUrl && (
          <View className="order-detail__info-row order-detail__info-row--photo">
            <Text className="order-detail__info-key">📷 配送凭证</Text>
            <Image
              className="order-detail__delivery-photo"
              src={order.photoUrl}
              mode="widthFix"
            />
          </View>
        )}
        <View className="order-detail__info-row">
          <Text className="order-detail__info-key">下单时间</Text>
          <Text className="order-detail__info-val">
            {new Date(order.createdAt).toLocaleString('zh-CN')}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="order-detail__actions">
        {(order.status === 'pending' || order.status === 'paid') && (
          <Button
            className="order-detail__cancel-btn"
            type="default"
            loading={cancelling}
            onClick={handleCancel}
          >
            取消订单
          </Button>
        )}
        {order.status === 'completed' && (
          <Button
            type="primary"
            onClick={() =>
              Taro.navigateTo({ url: `/pages/restaurant/index?id=${order.restaurantId}` })
            }
            color="#ff6b35"
          >
            再来一单
          </Button>
        )}
        <Button
          type="default"
          onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
        >
          返回订单列表
        </Button>
      </View>
    </View>
  )
}
