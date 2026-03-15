import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RefreshCw, PlusCircle, X } from 'lucide-react';
import { merchantApi, MerchantOrder } from '../../api/merchant';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '待付款',  color: 'text-yellow-600', bg: 'bg-yellow-50' },
  paid:      { label: '待接单',  color: 'text-blue-600',   bg: 'bg-blue-50' },
  preparing: { label: '备餐中',  color: 'text-orange-600', bg: 'bg-orange-50' },
  delivering:{ label: '配送中',  color: 'text-purple-600', bg: 'bg-purple-50' },
  completed: { label: '已完成',  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  cancelled: { label: '已取消',  color: 'text-gray-500',   bg: 'bg-gray-50' },
};

const TABS = [
  { key: 'active', label: '待处理' },
  { key: 'all', label: '全部' },
];

interface ExtraChargeModal {
  orderId: number;
  currentExtra: number;
}

export const MerchantOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [tab, setTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [extraModal, setExtraModal] = useState<ExtraChargeModal | null>(null);
  const [extraAmount, setExtraAmount] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [extraSubmitting, setExtraSubmitting] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    merchantApi.getOrders()
      .then(res => { if (res.data) setOrders(res.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayOrders = tab === 'active'
    ? orders.filter(o => ['paid', 'preparing'].includes(o.status))
    : orders;

  const handleAccept = async (id: number) => {
    setActionId(id);
    try {
      await merchantApi.acceptOrder(id);
      load();
    } finally { setActionId(null); }
  };

  const handleReady = async (id: number) => {
    setActionId(id);
    try {
      await merchantApi.readyOrder(id);
      load();
    } finally { setActionId(null); }
  };

  const openExtraModal = (order: MerchantOrder) => {
    setExtraModal({ orderId: order.id, currentExtra: order.extra_charge ?? 0 });
    setExtraAmount(String(order.extra_charge > 0 ? order.extra_charge : ''));
    setExtraNote(order.extra_charge_note ?? '');
  };

  const handleExtraCharge = async () => {
    if (!extraModal) return;
    const amount = parseFloat(extraAmount);
    if (isNaN(amount) || amount < 0) return;
    setExtraSubmitting(true);
    try {
      await merchantApi.extraCharge(extraModal.orderId, amount, extraNote || undefined);
      setExtraModal(null);
      load();
    } catch (e: any) {
      alert(e?.message ?? '操作失败');
    } finally {
      setExtraSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 加价 Modal */}
      {extraModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">订单加价</h3>
              <button onClick={() => setExtraModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">如顾客有特殊要求或食材成本增加，可在此加价。</p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">加价金额（元）</label>
              <input
                type="number"
                min="0"
                max="999"
                step="0.5"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">加价原因（可选）</label>
              <input
                type="text"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="如：特殊食材、定制包装..."
                maxLength={100}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              onClick={handleExtraCharge}
              disabled={extraSubmitting || !extraAmount}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {extraSubmitting ? '提交中...' : '确认加价'}
            </button>
          </div>
        </div>
      )}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/merchant')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">订单管理</h1>
          <button onClick={load} className="ml-auto p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-emerald-600' : 'text-gray-500'} />
          </button>
        </div>
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
              {t.key === 'active' && orders.filter(o => ['paid', 'preparing'].includes(o.status)).length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {orders.filter(o => ['paid', 'preparing'].includes(o.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-200" />
            <p>暂无订单</p>
          </div>
        ) : (
          displayOrders.map(order => {
            const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">订单 #{order.id}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.color} ${sc.bg}`}>
                    {sc.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {order.items.map(i => `${i.name} x${i.quantity}`).join('、')}
                </p>
                <p className="text-xs text-gray-400 mb-1">顾客：{order.username}</p>
                <p className="text-xs text-gray-400 mb-1">
                  备注：{order.notes || '无'}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  合计：¥{order.total_price.toFixed(2)}
                  {order.extra_charge > 0 && (
                    <span className="text-orange-500 ml-1">（含加价 ¥{order.extra_charge.toFixed(2)}）</span>
                  )}
                </p>

                <div className="flex gap-2">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={actionId === order.id}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                    >
                      {actionId === order.id ? '处理中...' : '接单'}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleReady(order.id)}
                      disabled={actionId === order.id}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
                    >
                      {actionId === order.id ? '处理中...' : '备餐完成'}
                    </button>
                  )}
                  {['paid', 'preparing'].includes(order.status) && (
                    <button
                      onClick={() => openExtraModal(order)}
                      className="px-3 py-2 border border-orange-300 text-orange-500 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors flex items-center gap-1"
                    >
                      <PlusCircle size={14} />
                      加价
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
