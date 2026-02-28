import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin, DollarSign } from 'lucide-react';
import { riderApi, RiderOrder } from '../../api/rider';

export const RiderAvailable = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    riderApi.getAvailableOrders()
      .then(res => { if (res.data) setOrders(res.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (id: number) => {
    setAcceptingId(id);
    try {
      await riderApi.acceptOrder(id);
      load();
      navigate('/rider/delivery');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rider')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">抢单大厅</h1>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-blue-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-10 bg-gray-200 rounded-xl" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">暂无可接订单</p>
            <p className="text-sm mt-1">下拉刷新查看最新订单</p>
            <button
              onClick={load}
              className="mt-4 text-blue-600 font-semibold text-sm hover:underline"
            >
              刷新
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{order.restaurant_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">订单 #{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">¥{order.delivery_fee.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">配送费</p>
                </div>
              </div>

              <div className="flex items-start gap-1.5 mb-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 line-clamp-2">{order.delivery_address}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span>订单金额 ¥{order.total_price.toFixed(2)}</span>
              </div>

              <button
                onClick={() => handleAccept(order.id)}
                disabled={acceptingId === order.id}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {acceptingId === order.id ? '抢单中...' : '立即接单'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
