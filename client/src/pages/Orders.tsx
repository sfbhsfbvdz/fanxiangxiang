import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Truck, XCircle, ShoppingBag, ChevronRight } from 'lucide-react';
import { OrderWithDetails, OrderStatus } from '../types';
import { ordersApi } from '../api/orders';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG: Record<OrderStatus, { label: string; Icon: React.ElementType; color: string }> = {
  pending: { label: '待付款', Icon: Clock, color: 'text-yellow-500' },
  paid: { label: '已付款', Icon: CheckCircle2, color: 'text-blue-500' },
  preparing: { label: '备餐中', Icon: Clock, color: 'text-orange-500' },
  delivering: { label: '配送中', Icon: Truck, color: 'text-purple-500' },
  completed: { label: '已送达', Icon: CheckCircle2, color: 'text-emerald-600' },
  cancelled: { label: '已取消', Icon: XCircle, color: 'text-gray-400' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday =
    d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `今天, ${time}`;
  if (isYesterday) return `昨天, ${time}`;
  return `${d.getMonth() + 1}月${d.getDate()}日, ${time}`;
};

export const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    ordersApi
      .getOrders()
      .then((res) => setOrders(res.orders))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">历史订单</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">查看你的订单</h2>
        <p className="text-gray-500 text-center mb-6">登录后即可查看历史订单</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          立即登录
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">历史订单</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <ShoppingBag size={40} className="text-gray-300" />
          </div>
          <p className="text-gray-500">还没有订单记录</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-emerald-600 font-semibold hover:underline"
          >
            去点餐
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status];
            return (
              <div
                key={order.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex gap-4 mb-3">
                  <img
                    src={order.restaurant.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80'}
                    alt={order.restaurant.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900">{order.restaurant.name}</h3>
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${status.color}`}>
                      <status.Icon size={12} />
                      {status.label}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-3 mb-3">
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {order.items.map((i) => `${i.name} x${i.quantity}`).join('、')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} 件商品 · ¥{order.totalPrice.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/restaurant/${order.restaurantId}`); }}
                    className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    再来一单
                  </button>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    查看详情 <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
