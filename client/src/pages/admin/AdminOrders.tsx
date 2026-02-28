import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, AdminOrder } from '../../api/admin';

const STATUS_OPTIONS = [
  { key: '', label: '全部' },
  { key: 'paid', label: '待接单' },
  { key: 'preparing', label: '备餐中' },
  { key: 'delivering', label: '配送中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  paid: 'bg-blue-50 text-blue-600',
  preparing: 'bg-orange-50 text-orange-600',
  delivering: 'bg-purple-50 text-purple-600',
  completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-gray-50 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待付款', paid: '待接单', preparing: '备餐中',
  delivering: '配送中', completed: '已完成', cancelled: '已取消',
};

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    adminApi.getOrders({ status: status || undefined, page, limit: 15 })
      .then(res => {
        if (res.data) {
          setOrders(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">订单管理</h1>
          <span className="text-xs text-gray-400">共 {total} 单</span>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatus(opt.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                status === opt.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
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
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无订单</div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">#{order.id} {order.restaurant_name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-50 text-gray-500'}`}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">顾客：{order.username} ({order.email})</p>
              <p className="text-xs text-gray-400 line-clamp-1 mb-1">{order.delivery_address}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('zh-CN')}</span>
                <span className="text-sm font-bold text-gray-900">¥{order.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
