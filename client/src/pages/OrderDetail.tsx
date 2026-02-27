import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Truck, XCircle, MapPin, FileText } from 'lucide-react';
import { OrderWithDetails, OrderStatus } from '../types';
import { ordersApi } from '../api/orders';
import { ApiError } from '../api/client';

const STATUS_CONFIG: Record<OrderStatus, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: '待付款', Icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  paid: { label: '已付款', Icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  preparing: { label: '备餐中', Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  delivering: { label: '配送中', Icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  completed: { label: '已送达', Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancelled: { label: '已取消', Icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    ordersApi
      .getOrderById(parseInt(id))
      .then(setOrder)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : '加载失败');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!order || !window.confirm('确定要取消这个订单吗？')) return;
    setIsCancelling(true);
    try {
      await ordersApi.cancelOrder(order.id);
      setOrder((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '取消失败');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">订单详情</h1>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{error || '订单不存在'}</p>
        <button onClick={() => navigate(-1)} className="text-emerald-600 font-semibold">返回</button>
      </div>
    );
  }

  const status = STATUS_CONFIG[order.status];
  const canCancel = order.status === 'pending' || order.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 pb-8 max-w-md mx-auto">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">订单详情</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className={`${status.bg} rounded-2xl p-5 flex items-center gap-4`}>
          <status.Icon size={32} className={status.color} />
          <div>
            <p className={`font-bold text-lg ${status.color}`}>{status.label}</p>
            <p className="text-sm text-gray-500">订单号: #{order.id}</p>
          </div>
        </div>

        {/* Restaurant */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={order.restaurant.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80'}
              alt={order.restaurant.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-bold text-gray-900">{order.restaurant.name}</h3>
              <p className="text-xs text-gray-500">下单时间: {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">商品明细</h3>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                ¥{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
          <div className="px-4 py-3 bg-gray-50 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>配送费</span>
              <span>¥{order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>合计</span>
              <span>¥{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mt-0.5">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">配送地址</p>
              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="bg-gray-50 p-2 rounded-lg text-gray-500 mt-0.5">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">备注</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {isCancelling ? '取消中...' : '取消订单'}
          </button>
        )}
      </div>
    </div>
  );
};
