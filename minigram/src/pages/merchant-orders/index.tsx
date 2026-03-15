import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast, Tabs } from '@nutui/nutui-react-taro'
import { merchantApi, MerchantOrder } from '../../api/merchant'
import './index.scss'

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付',
  paid: '待接单',
  preparing: '准备中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const TABS = [
  { title: '待接单', statuses: ['paid'] },
  { title: '准备中', statuses: ['preparing'] },
  { title: '配送中', statuses: ['delivering'] },
  { title: '全部', statuses: [] },
]

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [extraOrderId, setExtraOrderId] = useState<number | null>(null)
  const [extraAmount, setExtraAmount] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [extraLoading, setExtraLoading] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await merchantApi.getOrders()
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
    setActionLoading(orderId)
    try {
      await merchantApi.acceptOrder(orderId)
      showToast('已接单')
      await fetchOrders()
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReady = async (orderId: number) => {
    setActionLoading(orderId)
    try {
      await merchantApi.readyOrder(orderId)
      showToast('已标记备好')
      await fetchOrders()
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExtraCharge = async () => {
    if (extraOrderId === null) return
    const amount = parseFloat(extraAmount)
    if (isNaN(amount) || amount < 0) {
      showToast('请输入合法金额')
      return
    }
    setExtraLoading(true)
    try {
      await merchantApi.extraCharge(extraOrderId, amount, extraNote || undefined)
      showToast('加价成功')
      setExtraOrderId(null)
      setExtraAmount('')
      setExtraNote('')
      await fetchOrders()
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    } finally {
      setExtraLoading(false)
    }
  }

  const filteredOrders = () => {
    const statuses = TABS[activeTab].statuses
    if (statuses.length === 0) return orders
    return orders.filter((o) => statuses.includes(o.status))
  }

  const displayOrders = filteredOrders()

  return (
    <View className="merchant-orders">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      {/* 加价弹窗 */}
      {extraOrderId !== null && (
        <View className="merchant-orders__modal-mask">
          <View className="merchant-orders__modal">
            <Text className="merchant-orders__modal-title">订单加价</Text>
            <Text className="merchant-orders__modal-desc">为特殊要求或食材成本增加加价</Text>
            <View className="merchant-orders__modal-field">
              <Text className="merchant-orders__modal-label">加价金额（元）</Text>
              <Input
                className="merchant-orders__modal-input"
                type="digit"
                value={extraAmount}
                onInput={(e) => setExtraAmount(e.detail.value)}
                placeholder="0.00"
              />
            </View>
            <View className="merchant-orders__modal-field">
              <Text className="merchant-orders__modal-label">加价原因（可选）</Text>
              <Input
                className="merchant-orders__modal-input"
                value={extraNote}
                onInput={(e) => setExtraNote(e.detail.value)}
                placeholder="如：特殊食材..."
                maxlength={100}
              />
            </View>
            <View className="merchant-orders__modal-btns">
              <Button
                size="small"
                type="default"
                onClick={() => { setExtraOrderId(null); setExtraAmount(''); setExtraNote('') }}
              >
                取消
              </Button>
              <Button
                size="small"
                type="primary"
                loading={extraLoading}
                onClick={handleExtraCharge}
                color="#ff6b35"
              >
                确认加价
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className="merchant-orders__header">
        <Text className="merchant-orders__title">订单管理</Text>
        <Text className="merchant-orders__refresh" onClick={fetchOrders}>刷新</Text>
      </View>

      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab(v as number)}
        activeColor="#ff6b35"
        className="merchant-orders__tabs"
      >
        {TABS.map((tab, idx) => (
          <Tabs.TabPane key={idx} title={tab.title} value={idx} />
        ))}
      </Tabs>

      <ScrollView className="merchant-orders__content" scrollY>
        {loading ? (
          <View className="merchant-orders__loading">
            <Text>加载中...</Text>
          </View>
        ) : displayOrders.length === 0 ? (
          <View className="merchant-orders__empty">
            <Text className="merchant-orders__empty-icon">📋</Text>
            <Text className="merchant-orders__empty-text">暂无订单</Text>
          </View>
        ) : (
          displayOrders.map((order) => (
            <View key={order.id} className="merchant-orders__order">
              <View className="merchant-orders__order-header">
                <Text className="merchant-orders__order-id">#{order.id}</Text>
                <Text className={`merchant-orders__order-status merchant-orders__order-status--${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </Text>
              </View>

              <View className="merchant-orders__order-customer">
                <Text className="merchant-orders__order-name">{order.username}</Text>
                {order.user_phone && (
                  <Text className="merchant-orders__order-phone">{order.user_phone}</Text>
                )}
              </View>

              <View className="merchant-orders__order-items">
                {order.items.map((item) => (
                  <Text key={item.id} className="merchant-orders__order-item">
                    {item.name} × {item.quantity}
                  </Text>
                ))}
              </View>

              <View className="merchant-orders__order-footer">
                <View>
                  <Text className="merchant-orders__order-price">
                    ¥{Number(order.total_price).toFixed(2)}
                    {order.extra_charge > 0 && (
                      <Text className="merchant-orders__order-extra">（含加价¥{Number(order.extra_charge).toFixed(2)}）</Text>
                    )}
                  </Text>
                  <Text className="merchant-orders__order-address">{order.delivery_address}</Text>
                </View>
                <View className="merchant-orders__order-actions">
                  {order.status === 'paid' && (
                    <Button
                      size="small"
                      type="primary"
                      loading={actionLoading === order.id}
                      onClick={() => handleAccept(order.id)}
                      color="#ff6b35"
                    >
                      接单
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="small"
                      type="primary"
                      loading={actionLoading === order.id}
                      onClick={() => handleReady(order.id)}
                      color="#07c160"
                    >
                      备好了
                    </Button>
                  )}
                  {['paid', 'preparing'].includes(order.status) && (
                    <Button
                      size="small"
                      type="default"
                      onClick={() => { setExtraOrderId(order.id); setExtraAmount(order.extra_charge > 0 ? String(order.extra_charge) : ''); setExtraNote(order.extra_charge_note || '') }}
                    >
                      加价
                    </Button>
                  )}
                </View>
              </View>

              {order.notes && (
                <Text className="merchant-orders__order-notes">备注：{order.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
