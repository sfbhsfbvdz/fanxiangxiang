import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { adminApi, AdminUser, AdminRestaurant } from '../../api/admin';

const ROLE_OPTIONS = [
  { key: '', label: '全部' },
  { key: 'customer', label: '顾客' },
  { key: 'merchant', label: '商家' },
  { key: 'rider', label: '骑手' },
  { key: 'admin', label: '管理员' },
];

const ROLE_COLOR: Record<string, string> = {
  customer: 'bg-gray-100 text-gray-600',
  merchant: 'bg-orange-50 text-orange-600',
  rider:    'bg-blue-50 text-blue-600',
  admin:    'bg-purple-50 text-purple-600',
};

const ROLE_LABEL: Record<string, string> = {
  customer: '顾客', merchant: '商家', rider: '骑手', admin: '管理员',
};

interface RoleModal {
  open: boolean;
  user: AdminUser | null;
  role: string;
  restaurantId: string;
}

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<RoleModal>({ open: false, user: null, role: '', restaurantId: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    adminApi.getUsers({ role: roleFilter || undefined, page, limit: 15 })
      .then(res => {
        if (res.data) {
          setUsers(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [roleFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [roleFilter]);

  useEffect(() => {
    adminApi.getRestaurants()
      .then(res => { if (res.data) setRestaurants(res.data); })
      .catch(() => {});
  }, []);

  const openModal = (user: AdminUser) => {
    setModal({ open: true, user, role: user.role, restaurantId: '' });
  };

  const saveRole = async () => {
    if (!modal.user) return;
    setSaving(true);
    try {
      await adminApi.updateUserRole(
        modal.user.id,
        modal.role,
        modal.role === 'merchant' && modal.restaurantId ? parseInt(modal.restaurantId) : undefined
      );
      setModal({ open: false, user: null, role: '', restaurantId: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">用户管理</h1>
          <span className="text-xs text-gray-400">共 {total} 人</span>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setRoleFilter(opt.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                roleFilter === opt.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无用户</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-gray-600 text-sm">{user.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLOR[user.role] || 'bg-gray-100 text-gray-600'}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <button
                onClick={() => openModal(user)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <UserCog size={16} />
              </button>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Role edit modal */}
      {modal.open && modal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">修改角色</h2>
            <p className="text-sm text-gray-500">用户：{modal.user.username} ({modal.user.email})</p>

            <div className="grid grid-cols-2 gap-2">
              {['customer', 'merchant', 'rider', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setModal(p => ({ ...p, role: r }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                    modal.role === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>

            {modal.role === 'merchant' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">绑定餐厅</label>
                <select
                  value={modal.restaurantId}
                  onChange={e => setModal(p => ({ ...p, restaurantId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">选择餐厅</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModal({ open: false, user: null, role: '', restaurantId: '' })}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveRole}
                disabled={saving}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {saving ? '保存中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
