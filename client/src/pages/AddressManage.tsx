import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Star, Edit2, Check, X } from 'lucide-react';
import { Address } from '../types';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

interface AddressFormState {
  name: string;
  phone: string;
  address: string;
  detail: string;
  isDefault: boolean;
}

const emptyForm: AddressFormState = {
  name: '',
  phone: '',
  address: '',
  detail: '',
  isDefault: false,
};

export const AddressManage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadAddresses = async () => {
    try {
      const addrs = await usersApi.getAddresses();
      setAddresses(addrs);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAddresses();
  }, [isAuthenticated, navigate]);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      detail: addr.detail ?? '',
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError('请填写姓名、手机号和地址');
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      const params = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        detail: form.detail.trim() || undefined,
        isDefault: form.isDefault,
      };
      if (editingId !== null) {
        await usersApi.updateAddress(editingId, params);
      } else {
        await usersApi.createAddress(params);
      }
      await loadAddresses();
      closeForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除这个地址吗？')) return;
    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8 max-w-md mx-auto">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">地址管理</h1>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          添加
        </button>
      </header>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 mb-4">还没有收货地址</p>
            <button
              onClick={openAddForm}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              添加地址
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{addr.name}</span>
                  <span className="text-gray-500 text-sm">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] text-emerald-600 border border-emerald-300 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                      <Star size={8} className="fill-emerald-500 text-emerald-500" />
                      默认
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {addr.address}
                {addr.detail ? `，${addr.detail}` : ''}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId !== null ? '编辑地址' : '添加地址'}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">收货人姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="138 0000 0000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">地址</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="如：学生公寓A栋"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  详细地址 <span className="text-gray-400 font-normal">(可选)</span>
                </label>
                <input
                  type="text"
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                  placeholder="如：301室"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    form.isDefault
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'border-gray-300'
                  }`}
                >
                  {form.isDefault && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-700">设为默认地址</span>
              </label>

              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
