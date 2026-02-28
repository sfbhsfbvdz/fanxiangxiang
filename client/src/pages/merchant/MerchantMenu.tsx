import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { merchantApi, MerchantCategory, MerchantMenuItem } from '../../api/merchant';

export const MerchantMenu = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  // Modal state
  const [catModal, setCatModal] = useState<{ open: boolean; id?: number; name: string }>({ open: false, name: '' });
  const [itemModal, setItemModal] = useState<{
    open: boolean; id?: number; category_id: number;
    name: string; price: string; description: string; status: string;
  }>({ open: false, category_id: 0, name: '', price: '', description: '', status: 'available' });

  const load = useCallback(() => {
    setIsLoading(true);
    merchantApi.getMenu()
      .then(res => {
        if (res.data) {
          setCategories(res.data);
          if (res.data.length > 0 && expandedCat === null) {
            setExpandedCat(res.data[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Category actions
  const saveCat = async () => {
    if (!catModal.name.trim()) return;
    if (catModal.id) {
      await merchantApi.updateCategory(catModal.id, { name: catModal.name });
    } else {
      await merchantApi.createCategory(catModal.name);
    }
    setCatModal({ open: false, name: '' });
    load();
  };

  const deleteCat = async (id: number) => {
    if (!confirm('确认删除该分类？分类下的菜品也会被删除。')) return;
    await merchantApi.deleteCategory(id);
    load();
  };

  // Item actions
  const saveItem = async () => {
    if (!itemModal.name.trim() || !itemModal.price) return;
    const payload = {
      category_id: itemModal.category_id,
      name: itemModal.name,
      description: itemModal.description,
      price: parseFloat(itemModal.price),
      status: itemModal.status,
    };
    if (itemModal.id) {
      await merchantApi.updateItem(itemModal.id, payload);
    } else {
      await merchantApi.createItem(payload);
    }
    setItemModal({ open: false, category_id: 0, name: '', price: '', description: '', status: 'available' });
    load();
  };

  const toggleItemStatus = async (item: MerchantMenuItem) => {
    const newStatus = item.status === 'available' ? 'sold_out' : 'available';
    await merchantApi.updateItem(item.id, { status: newStatus });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('确认删除该菜品？')) return;
    await merchantApi.deleteItem(id);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/merchant')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">菜单管理</h1>
          <button
            onClick={() => setCatModal({ open: true, name: '' })}
            className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg"
          >
            <Plus size={16} /> 新增分类
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
            </div>
          ))
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Category header */}
            <div className="flex items-center p-4">
              <button
                className="flex-1 flex items-center gap-2 text-left"
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              >
                {expandedCat === cat.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="font-bold text-gray-900">{cat.name}</span>
                <span className="text-xs text-gray-400">({cat.items.length} 项)</span>
              </button>
              <button
                onClick={() => setCatModal({ open: true, id: cat.id, name: cat.name })}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => deleteCat(cat.id)}
                className="p-2 hover:bg-red-50 rounded-lg text-red-400"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setItemModal({ open: true, category_id: cat.id, name: '', price: '', description: '', status: 'available' })}
                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Items */}
            {expandedCat === cat.id && cat.items.map((item, idx) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-gray-50' : 'border-t border-gray-100'}`}>
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${item.status === 'sold_out' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold">¥{item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => toggleItemStatus(item)}
                  className={`${item.status === 'available' ? 'text-emerald-600' : 'text-gray-400'}`}
                >
                  {item.status === 'available' ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <button
                  onClick={() => setItemModal({
                    open: true, id: item.id, category_id: item.category_id,
                    name: item.name, price: String(item.price),
                    description: item.description || '', status: item.status,
                  })}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {catModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h2 className="text-lg font-bold mb-4">{catModal.id ? '编辑分类' : '新增分类'}</h2>
            <input
              autoFocus
              value={catModal.name}
              onChange={e => setCatModal(p => ({ ...p, name: e.target.value }))}
              placeholder="分类名称"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCatModal({ open: false, name: '' })}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveCat}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {itemModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-y-auto">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold">{itemModal.id ? '编辑菜品' : '新增菜品'}</h2>
            <input
              autoFocus
              value={itemModal.name}
              onChange={e => setItemModal(p => ({ ...p, name: e.target.value }))}
              placeholder="菜品名称 *"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              value={itemModal.price}
              onChange={e => setItemModal(p => ({ ...p, price: e.target.value }))}
              placeholder="价格（元）*"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <textarea
              value={itemModal.description}
              onChange={e => setItemModal(p => ({ ...p, description: e.target.value }))}
              placeholder="描述（可选）"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">状态</span>
              <button
                onClick={() => setItemModal(p => ({ ...p, status: p.status === 'available' ? 'sold_out' : 'available' }))}
                className={`flex items-center gap-1.5 text-sm font-medium ${itemModal.status === 'available' ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                {itemModal.status === 'available' ? <><ToggleRight size={20} /> 上架</> : <><ToggleLeft size={20} /> 下架</>}
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setItemModal({ open: false, category_id: 0, name: '', price: '', description: '', status: 'available' })}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveItem}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
