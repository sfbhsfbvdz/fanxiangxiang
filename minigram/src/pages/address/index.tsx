import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast, Switch } from '@nutui/nutui-react-taro'
import { usersApi } from '../../api/users'
import { Address } from '../../types'
import './index.scss'

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [detail, setDetail] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const list = await usersApi.getAddresses()
      setAddresses(list)
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const resetForm = () => {
    setName('')
    setPhone('')
    setAddress('')
    setDetail('')
    setIsDefault(false)
    setEditId(null)
  }

  const handleEdit = (addr: Address) => {
    setEditId(addr.id)
    setName(addr.name)
    setPhone(addr.phone)
    setAddress(addr.address)
    setDetail(addr.detail || '')
    setIsDefault(addr.isDefault)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { showToast('请输入姓名'); return }
    if (!phone.trim()) { showToast('请输入手机号'); return }
    if (!address.trim()) { showToast('请输入地址'); return }
    setSaving(true)
    try {
      if (editId) {
        await usersApi.updateAddress(editId, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          detail: detail.trim() || undefined,
          isDefault,
        })
        showToast('已更新')
      } else {
        await usersApi.createAddress({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          detail: detail.trim() || undefined,
          isDefault,
        })
        showToast('已添加')
      }
      resetForm()
      setShowForm(false)
      await fetchAddresses()
    } catch (err: any) {
      showToast(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '删除地址',
      content: '确定删除此地址吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await usersApi.deleteAddress(id)
          showToast('已删除')
          await fetchAddresses()
        } catch (err: any) {
          showToast(err?.message || '删除失败')
        }
      },
    })
  }

  return (
    <View className="address-page">
      <Toast
        visible={toastVisible}
        content={toastMsg}
        onClose={() => setToastVisible(false)}
      />

      {!showForm ? (
        <>
          {loading ? (
            <View className="address-page__loading">
              <Text>加载中...</Text>
            </View>
          ) : (
            <View className="address-page__list">
              {addresses.length === 0 && (
                <View className="address-page__empty">
                  <Text className="address-page__empty-icon">📍</Text>
                  <Text className="address-page__empty-text">暂无地址，请添加</Text>
                </View>
              )}
              {addresses.map((addr) => (
                <View key={addr.id} className="address-page__item">
                  <View className="address-page__item-content">
                    <View className="address-page__item-row">
                      <Text className="address-page__item-name">{addr.name}</Text>
                      <Text className="address-page__item-phone">{addr.phone}</Text>
                      {addr.isDefault && (
                        <Text className="address-page__item-default">默认</Text>
                      )}
                    </View>
                    <Text className="address-page__item-address">
                      {addr.address}{addr.detail ? ` ${addr.detail}` : ''}
                    </Text>
                  </View>
                  <View className="address-page__item-actions">
                    <Text
                      className="address-page__action-edit"
                      onClick={() => handleEdit(addr)}
                    >
                      编辑
                    </Text>
                    <Text
                      className="address-page__action-delete"
                      onClick={() => handleDelete(addr.id)}
                    >
                      删除
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="address-page__add-btn">
            <Button
              type="primary"
              block
              color="#ff6b35"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              + 添加新地址
            </Button>
          </View>
        </>
      ) : (
        <View className="address-page__form">
          <Text className="address-page__form-title">
            {editId ? '编辑地址' : '添加地址'}
          </Text>

          <View className="address-page__field">
            <Text className="address-page__field-label">姓名 *</Text>
            <Input
              className="address-page__input"
              placeholder="请输入收件人姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View className="address-page__field">
            <Text className="address-page__field-label">手机号 *</Text>
            <Input
              className="address-page__input"
              type="number"
              placeholder="请输入手机号"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          <View className="address-page__field">
            <Text className="address-page__field-label">地址 *</Text>
            <Input
              className="address-page__input"
              placeholder="宿舍楼/教学楼名称"
              value={address}
              onInput={(e) => setAddress(e.detail.value)}
            />
          </View>
          <View className="address-page__field">
            <Text className="address-page__field-label">详细地址</Text>
            <Input
              className="address-page__input"
              placeholder="门牌号、宿舍号等"
              value={detail}
              onInput={(e) => setDetail(e.detail.value)}
            />
          </View>
          <View className="address-page__field address-page__field--row">
            <Text className="address-page__field-label">设为默认地址</Text>
            <Switch
              checked={isDefault}
              onChange={(val) => setIsDefault(val)}
              activeColor="#ff6b35"
            />
          </View>

          <View className="address-page__form-btns">
            <Button
              type="default"
              onClick={() => { setShowForm(false); resetForm() }}
              className="address-page__cancel-btn"
            >
              取消
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              color="#ff6b35"
              className="address-page__save-btn"
            >
              保存
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
