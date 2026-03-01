import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { ApiError } from '../api/client';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [editingField, setEditingField] = useState<'username' | 'phone' | null>(null);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successField, setSuccessField] = useState<string | null>(null);

  const openEdit = (field: 'username' | 'phone') => {
    setEditingField(field);
    setValue(field === 'username' ? user?.username ?? '' : user?.phone ?? '');
    setError('');
  };

  const handleSave = async () => {
    if (!editingField) return;
    setError('');
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ [editingField]: value || undefined });
      await refreshUser();
      setSuccessField(editingField);
      setEditingField(null);
      setTimeout(() => setSuccessField(null), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">设置</h1>
      </header>

      <div className="px-4 pt-5 space-y-4">
        {/* Profile Section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">个人信息</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Username */}
            <div className="border-b border-gray-50">
              {editingField === 'username' ? (
                <div className="p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">用户名</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-3"
                  />
                  {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingField(null)}
                      className="flex-1 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openEdit('username')}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">用户名</p>
                    <p className="text-xs text-gray-400 truncate">{user?.username ?? '未设置'}</p>
                  </div>
                  {successField === 'username' ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-300" />
                  )}
                </button>
              )}
            </div>

            {/* Phone */}
            <div>
              {editingField === 'phone' ? (
                <div className="p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">手机号码</label>
                  <input
                    type="tel"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="请输入11位手机号"
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-3"
                  />
                  {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingField(null)}
                      className="flex-1 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openEdit('phone')}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-500">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">手机号码</p>
                    <p className="text-xs text-gray-400 truncate">{user?.phone ?? '未绑定'}</p>
                  </div>
                  {successField === 'phone' ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-300" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">账号</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">邮箱</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>
              <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">不可修改</span>
            </div>
          </div>
        </div>

        {/* About section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">关于</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-700">版本</span>
              <span className="text-sm text-gray-400">v0.0.1</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-gray-700">饭饭香校园外卖</span>
              <span className="text-sm text-gray-400">© 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
