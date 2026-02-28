import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Package, RefreshCw } from 'lucide-react';
import { riderApi, RiderOrder } from '../../api/rider';

export const RiderDelivery = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    riderApi.getMyOrders()
      .then(res => {
        if (res.data) setOrders(res.data.filter(o => o.status === 'delivering'));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePicked = async (id: number) => {
    setActionId(id);
    try {
      await riderApi.pickedOrder(id);
      // Status stays the same, just show feedback
    } finally {
      setActionId(null);
    }
  };

  const handleDelivered = async (id: number) => {
    setActionId(id);
    try {
      await riderApi.deliveredOrder(id);
      load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rider')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">当前配送</h1>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-blue-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">暂无配送中的订单</p>
            <button
              onClick={() => navigate('/rider/available')}
              className="mt-4 text-blue-600 font-semibold text-sm hover:underline"
            >
              去抢单
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{order.restaurant_name}</p>
                  <p className="text-xs text-gray-500">订单 #{order.id}</p>
                </div>
                <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">
                  配送中
                </span>
              </div>

              <div className="flex items-start gap-1.5 mb-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                配送费 ¥{order.delivery_fee.toFixed(2)} · 订单金额 ¥{order.total_price.toFixed(2)}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePicked(order.id)}
                  disabled={actionId === order.id}
                  className="py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Package size={15} />
                  已取餐
                </button>
                <button
                  onClick={() => handleDelivered(order.id)}
                  disabled={actionId === order.id}
                  className="py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  已送达
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
