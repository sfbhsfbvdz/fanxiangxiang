import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, History } from 'lucide-react';
import { riderApi, RiderOrder } from '../../api/rider';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `今天 ${time}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
};

export const RiderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    riderApi.getMyOrders()
      .then(res => {
        if (res.data) setOrders(res.data.filter(o => o.status === 'completed'));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalEarnings = orders.reduce((sum, o) => sum + o.delivery_fee, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rider')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">历史配送</h1>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="bg-blue-600 text-white px-4 py-4 flex justify-between items-center">
          <div>
            <p className="text-blue-200 text-xs">累计配送</p>
            <p className="text-2xl font-bold">{orders.length} 单</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">累计收入</p>
            <p className="text-2xl font-bold">¥{totalEarnings.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <History size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">暂无历史记录</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900">{order.restaurant_name}</p>
                <span className="text-emerald-600 font-bold">+¥{order.delivery_fee.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1 line-clamp-1">{order.delivery_address}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{formatDate(order.updated_at)}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 size={12} />
                  已送达
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
