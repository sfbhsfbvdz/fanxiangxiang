import { useState, useEffect } from 'react'
import { View, Text, Image, Textarea, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast } from '@nutui/nutui-react-taro'
import { cartStore } from '../../store/auth'
import { authStore } from '../../store/auth'
import { usersApi } from '../../api/users'
import { ordersApi } from '../../api/orders'
import { Address } from '../../types'
import './index.scss'

const TIP_PRESETS = [0, 1, 2, 5]

export default function CartPage() {
  const [cart, setCart] = useState(cartStore.getCart())
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [tip, setTip] = useState(0)
  const [customTip, setCustomTip] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const refreshCart = () => setCart(cartStore.getCart())

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const fetchAddresses = async () => {
      try {
        const list = await usersApi.getAddresses()
        setAddresses(list)
        const def = list.find((a) => a.isDefault)
        if (def) setSelectedAddressId(def.id)
        else if (list.length > 0) setSelectedAddressId(list[0].id)
      } catch {}
    }
    fetchAddresses()
  }, [])

  const handleAdd = (itemId: number) => {
    const item = cart.items.find((i) => i.id === itemId)
    if (!item || !cart.restaurantId) return
    cartStore.addItem(cart.restaurantId, cart.restaurantName, {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    })
    refreshCart()
  }

  const handleRemove = (itemId: number) => {
    cartStore.removeItem(itemId)
    refreshCart()
  }

  const handleClear = () => {
    Taro.showModal({
      title: '清空购物车',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          cartStore.clearCart()
          refreshCart()
        }
      },
    })
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      showToast('购物车是空的')
      return
    }
    if (!selectedAddressId) {
      showToast('请选择收货地址')
      return
    }
    if (!cart.restaurantId) return

    setLoading(true)
    try {
      const order = await ordersApi.createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        deliveryAddressId: selectedAddressId,
        notes: notes || undefined,
        tip: tip > 0 ? tip : undefined,
      })
      cartStore.clearCart()
      Taro.redirectTo({ url: `/pages/order-detail/index?id=${order.id}&success=1` })
    } catch (err: any) {
      showToast(err?.message || '下单失败')
    } finally {
      setLoading(false)
    }
  }

  const itemsTotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalPrice = itemsTotal + tip
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  if (cart.items.length === 0) {
    return (
      <View className="cart-page">
        <View className="cart-page__empty">
          <Text className="cart-page__empty-icon">🛒</Text>
          <Text className="cart-page__empty-text">购物车是空的</Text>
          <Button
            type="primary"
            onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
            color="#ff6b35"
          >
            去逛逛
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="cart-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      {/* Address */}
      <View className="cart-page__section">
        <View className="cart-page__section-header">
          <Text className="cart-page__section-title">📍 收货地址</Text>
          <Text
            className="cart-page__section-action"
            onClick={() => Taro.navigateTo({ url: '/pages/address/index' })}
          >
            管理地址
          </Text>
        </View>
        {addresses.length === 0 ? (
          <View
            className="cart-page__add-address"
            onClick={() => Taro.navigateTo({ url: '/pages/address/index' })}
          >
            <Text className="cart-page__add-address-text">+ 添加收货地址</Text>
          </View>
        ) : (
          <View className="cart-page__addresses">
            {addresses.map((addr) => (
              <View
                key={addr.id}
                className={`cart-page__address ${selectedAddressId === addr.id ? 'cart-page__address--selected' : ''}`}
                onClick={() => setSelectedAddressId(addr.id)}
              >
                <View className="cart-page__address-radio">
                  {selectedAddressId === addr.id && (
                    <View className="cart-page__address-radio-inner" />
                  )}
                </View>
                <View className="cart-page__address-content">
                  <View className="cart-page__address-row">
                    <Text className="cart-page__address-name">{addr.name}</Text>
                    <Text className="cart-page__address-phone">{addr.phone}</Text>
                    {addr.isDefault && (
                      <Text className="cart-page__address-default">默认</Text>
                    )}
                  </View>
                  <Text className="cart-page__address-text">
                    {addr.address}{addr.detail ? ` ${addr.detail}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Cart items */}
      <View className="cart-page__section">
        <View className="cart-page__section-header">
          <Text className="cart-page__section-title">🍜 {cart.restaurantName}</Text>
          <Text className="cart-page__section-action" onClick={handleClear}>
            清空
          </Text>
        </View>
        {cart.items.map((item) => (
          <View key={item.id} className="cart-page__item">
            <Image
              className="cart-page__item-img"
              src={item.image || 'https://via.placeholder.com/60?text=菜'}
              mode="aspectFill"
            />
            <View className="cart-page__item-info">
              <Text className="cart-page__item-name">{item.name}</Text>
              <Text className="cart-page__item-price">¥{Number(item.price).toFixed(2)}</Text>
            </View>
            <View className="cart-page__item-ctrl">
              <View
                className="cart-page__ctrl-btn cart-page__ctrl-btn--minus"
                onClick={() => handleRemove(item.id)}
              >
                <Text>-</Text>
              </View>
              <Text className="cart-page__ctrl-count">{item.quantity}</Text>
              <View
                className="cart-page__ctrl-btn cart-page__ctrl-btn--plus"
                onClick={() => handleAdd(item.id)}
              >
                <Text>+</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Notes */}
      <View className="cart-page__section">
        <Text className="cart-page__section-title">📝 备注</Text>
        <Textarea
          className="cart-page__notes"
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
          placeholder="如：少辣，不要香菜..."
          maxlength={500}
          autoHeight
        />
      </View>

      {/* Tip */}
      <View className="cart-page__section">
        <Text className="cart-page__section-title">🎁 打赏骑手</Text>
        <View className="cart-page__tip-row">
          {TIP_PRESETS.map((amount) => (
            <View
              key={amount}
              className={`cart-page__tip-btn ${tip === amount && customTip === '' ? 'cart-page__tip-btn--active' : ''}`}
              onClick={() => { setTip(amount); setCustomTip('') }}
            >
              <Text>{amount === 0 ? '不打赏' : `¥${amount}`}</Text>
            </View>
          ))}
        </View>
        <View className="cart-page__tip-custom">
          <Text className="cart-page__tip-custom-label">自定义：¥</Text>
          <Input
            className="cart-page__tip-custom-input"
            type="digit"
            value={customTip}
            onInput={(e) => {
              setCustomTip(e.detail.value)
              const v = parseFloat(e.detail.value)
              setTip(isNaN(v) ? 0 : Math.max(0, Math.min(999, v)))
            }}
            placeholder="0"
          />
        </View>
        {tip > 0 && (
          <Text className="cart-page__tip-hint">已选择打赏 ¥{tip.toFixed(2)}，感谢您的支持！</Text>
        )}
      </View>

      {/* Bottom bar */}
      <View className="cart-page__bottom">
        <View className="cart-page__total-info">
          <Text className="cart-page__total-label">合计：</Text>
          <Text className="cart-page__total-price">¥{totalPrice.toFixed(2)}</Text>
        </View>
        <Button
          className="cart-page__checkout-btn"
          type="primary"
          loading={loading}
          onClick={handleCheckout}
          color="#ff6b35"
        >
          提交订单
        </Button>
      </View>
    </View>
  )
}
