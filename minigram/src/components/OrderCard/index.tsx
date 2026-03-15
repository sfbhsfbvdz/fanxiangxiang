import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { OrderWithDetails, OrderStatus } from '../../types'
import './index.scss'

interface Props {
  order: OrderWithDetails
  onRefresh?: () => void
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  preparing: '准备中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#ff9500',
  paid: '#1989fa',
  preparing: '#ff6b35',
  delivering: '#07c160',
  completed: '#999',
  cancelled: '#999',
}

export default function OrderCard({ order, onRefresh }: Props) {
  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })
  }

  const status = order.status as OrderStatus
  const statusLabel = STATUS_LABELS[status] || status
  const statusColor = STATUS_COLORS[status] || '#999'

  return (
    <View className="order-card" onClick={handleClick}>
      <View className="order-card__header">
        <View className="order-card__restaurant">
          <Image
            className="order-card__restaurant-img"
            src={order.restaurant?.image || 'https://via.placeholder.com/40?text=餐'}
            mode="aspectFill"
          />
          <Text className="order-card__restaurant-name">{order.restaurant?.name}</Text>
        </View>
        <Text className="order-card__status" style={{ color: statusColor }}>
          {statusLabel}
        </Text>
      </View>

      <View className="order-card__items">
        {order.items?.slice(0, 2).map((item) => (
          <Text key={item.id} className="order-card__item">
            {item.name} x{item.quantity}
          </Text>
        ))}
        {order.items?.length > 2 && (
          <Text className="order-card__item-more">等{order.items.length}件商品</Text>
        )}
      </View>

      <View className="order-card__footer">
        <Text className="order-card__total">
          共{order.items?.reduce((s, i) => s + i.quantity, 0) || 0}件 合计{' '}
          <Text className="order-card__price">¥{Number(order.totalPrice).toFixed(2)}</Text>
        </Text>
        <Text className="order-card__date">
          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
        </Text>
      </View>
    </View>
  )
}
