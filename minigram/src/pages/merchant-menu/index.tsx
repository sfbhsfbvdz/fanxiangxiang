import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Toast, Tabs } from '@nutui/nutui-react-taro'
import { merchantApi, MerchantCategory, MerchantMenuItem } from '../../api/merchant'
import './index.scss'

export default function MerchantMenuPage() {
  const [categories, setCategories] = useState<MerchantCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Item form
  const [showItemForm, setShowItemForm] = useState(false)
  const [editItem, setEditItem] = useState<MerchantMenuItem | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemCatId, setItemCatId] = useState<number | null>(null)
  const [savingItem, setSavingItem] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const res = await merchantApi.getMenu()
      setCategories(res.data || [])
    } catch (err: any) {
      showToast(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  const handleEditItem = (item: MerchantMenuItem) => {
    setEditItem(item)
    setItemName(item.name)
    setItemPrice(String(item.price))
    setItemDesc(item.description || '')
    setItemCatId(item.category_id)
    setShowItemForm(true)
  }

  const handleAddItem = (catId: number) => {
    setEditItem(null)
    setItemName('')
    setItemPrice('')
    setItemDesc('')
    setItemCatId(catId)
    setShowItemForm(true)
  }

  const handleSaveItem = async () => {
    if (!itemName.trim()) { showToast('请输入菜名'); return }
    const price = parseFloat(itemPrice)
    if (isNaN(price) || price <= 0) { showToast('请输入有效价格'); return }
    if (!itemCatId) { showToast('请选择分类'); return }
    setSavingItem(true)
    try {
      if (editItem) {
        await merchantApi.updateItem(editItem.id, {
          name: itemName.trim(),
          price,
          description: itemDesc.trim() || undefined,
        })
        showToast('已更新')
      } else {
        await merchantApi.createItem({
          category_id: itemCatId,
          name: itemName.trim(),
          price,
          description: itemDesc.trim() || undefined,
        })
        showToast('已添加')
      }
      setShowItemForm(false)
      await fetchMenu()
    } catch (err: any) {
      showToast(err?.message || '保存失败')
    } finally {
      setSavingItem(false)
    }
  }

  const handleToggleItemStatus = async (item: MerchantMenuItem) => {
    const newStatus = item.status === 'available' ? 'sold_out' : 'available'
    try {
      await merchantApi.updateItem(item.id, { status: newStatus })
      showToast(newStatus === 'available' ? '已上架' : '已下架')
      await fetchMenu()
    } catch (err: any) {
      showToast(err?.message || '操作失败')
    }
  }

  const handleDeleteItem = (item: MerchantMenuItem) => {
    Taro.showModal({
      title: '删除菜品',
      content: `确定删除"${item.name}"吗？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await merchantApi.deleteItem(item.id)
          showToast('已删除')
          await fetchMenu()
        } catch (err: any) {
          showToast(err?.message || '删除失败')
        }
      },
    })
  }

  if (showItemForm) {
    return (
      <View className="merchant-menu">
        <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />
        <View className="merchant-menu__form">
          <Text className="merchant-menu__form-title">
            {editItem ? '编辑菜品' : '添加菜品'}
          </Text>
          <View className="merchant-menu__field">
            <Text className="merchant-menu__field-label">菜名 *</Text>
            <Input
              className="merchant-menu__input"
              placeholder="请输入菜品名称"
              value={itemName}
              onInput={(e) => setItemName(e.detail.value)}
            />
          </View>
          <View className="merchant-menu__field">
            <Text className="merchant-menu__field-label">价格(元) *</Text>
            <Input
              className="merchant-menu__input"
              type="digit"
              placeholder="请输入价格"
              value={itemPrice}
              onInput={(e) => setItemPrice(e.detail.value)}
            />
          </View>
          <View className="merchant-menu__field">
            <Text className="merchant-menu__field-label">描述</Text>
            <Input
              className="merchant-menu__input"
              placeholder="菜品简介（选填）"
              value={itemDesc}
              onInput={(e) => setItemDesc(e.detail.value)}
            />
          </View>
          <View className="merchant-menu__form-btns">
            <Button type="default" onClick={() => setShowItemForm(false)}>
              取消
            </Button>
            <Button
              type="primary"
              loading={savingItem}
              onClick={handleSaveItem}
              color="#ff6b35"
            >
              保存
            </Button>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="merchant-menu">
      <Toast visible={toastVisible} content={toastMsg} onClose={() => setToastVisible(false)} />

      <View className="merchant-menu__header">
        <Text className="merchant-menu__title">菜单管理</Text>
      </View>

      {loading ? (
        <View className="merchant-menu__loading"><Text>加载中...</Text></View>
      ) : categories.length === 0 ? (
        <View className="merchant-menu__empty">
          <Text className="merchant-menu__empty-text">暂无菜单分类</Text>
        </View>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={(v) => setActiveTab(v as number)}
            activeColor="#ff6b35"
            className="merchant-menu__tabs"
          >
            {categories.map((cat, idx) => (
              <Tabs.TabPane key={cat.id} title={cat.name} value={idx} />
            ))}
          </Tabs>

          {categories[activeTab] && (
            <View className="merchant-menu__items">
              {categories[activeTab].items.map((item) => (
                <View key={item.id} className="merchant-menu__item">
                  <View className="merchant-menu__item-info">
                    <Text className="merchant-menu__item-name">{item.name}</Text>
                    {item.description && (
                      <Text className="merchant-menu__item-desc">{item.description}</Text>
                    )}
                    <Text className="merchant-menu__item-price">¥{Number(item.price).toFixed(2)}</Text>
                  </View>
                  <View className="merchant-menu__item-actions">
                    <Text
                      className={`merchant-menu__item-status merchant-menu__item-status--${item.status}`}
                      onClick={() => handleToggleItemStatus(item)}
                    >
                      {item.status === 'available' ? '上架' : '已下架'}
                    </Text>
                    <Text className="merchant-menu__item-edit" onClick={() => handleEditItem(item)}>
                      编辑
                    </Text>
                    <Text
                      className="merchant-menu__item-delete"
                      onClick={() => handleDeleteItem(item)}
                    >
                      删除
                    </Text>
                  </View>
                </View>
              ))}
              <View className="merchant-menu__add-item">
                <Button
                  type="primary"
                  block
                  color="#ff6b35"
                  onClick={() => handleAddItem(categories[activeTab].id)}
                >
                  + 添加菜品到 {categories[activeTab].name}
                </Button>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  )
}
