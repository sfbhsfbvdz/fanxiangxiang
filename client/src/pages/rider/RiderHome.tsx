import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, TrendingUp, Package, History, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { riderApi, RiderOrder, RiderStatus } from '../../api/rider';
import { useAuth } from '../../context/AuthContext';

export const RiderHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<RiderStatus>({ status: 'offline', vehicle_type: 'bike' });
  const [myOrders, setMyOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([riderApi.getStatus(), riderApi.getMyOrders()])
      .then(([sRes, oRes]) => {
        if (sRes.data) setStatus(sRes.data);
        if (oRes.data) setMyOrders(oRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const todayOrders = myOrders.filter(o => {
    const d = new Date(o.updated_at);
    return d.toDateString() === new Date().toDateString();
  });
  const todayEarnings = todayOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.delivery_fee, 0);
  const currentDeliveries = myOrders.filter(o => o.status === 'delivering');

  const toggleOnline = async () => {
    if (toggling) return;
    setToggling(true);
    const newStatus = status.status === 'offline' ? 'online' : 'offline';
    try {
      await riderApi.updateStatus(newStatus);
      setStatus(p => ({ ...p, status: newStatus }));
    } finally {
      setToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isOnline = status.status !== 'offline';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${isOnline ? 'bg-blue-600' : 'bg-gray-600'} text-white px-4 pt-12 pb-6 transition-colors`}>
        <p className="text-white/70 text-sm">骑手工作台</p>
        <h1 className="text-2xl font-bold mt-1">你好，{user?.username}</h1>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium"
          >
            {isOnline ? <><ToggleRight size={18} /> 在线接单</> : <><ToggleLeft size={18} /> 已下线</>}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-2 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '今日配送', value: todayOrders.filter(o => o.status === 'completed').length, Icon: Package, color: 'text-blue-500' },
            { label: '今日收入', value: `¥${todayEarnings.toFixed(0)}`, Icon: TrendingUp, color: 'text-emerald-600' },
            { label: '配送中', value: currentDeliveries.length, Icon: Bike, color: 'text-orange-500' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <Icon size={20} className={`${color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Current delivery alert */}
        {currentDeliveries.length > 0 && (
          <div
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer"
            onClick={() => navigate('/rider/delivery')}
          >
            <div>
              <p className="font-bold text-blue-700">有 {currentDeliveries.length} 单配送中</p>
              <p className="text-xs text-blue-500 mt-0.5">点击查看详情</p>
            </div>
            <ChevronRight size={20} className="text-blue-400" />
          </div>
        )}

        {/* Quick nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: '抢单大厅', desc: '查看可接配送订单', path: '/rider/available', disabled: !isOnline },
            { label: '当前配送', desc: `${currentDeliveries.length} 单进行中`, path: '/rider/delivery' },
            { label: '历史配送', desc: '已完成的配送记录', path: '/rider/history' },
          ].map(({ label, desc, path, disabled }, i) => (
            <button
              key={label}
              onClick={() => !disabled && navigate(path)}
              className={`w-full flex items-center justify-between p-4 text-left transition-colors ${i > 0 ? 'border-t border-gray-50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{disabled ? '请先上线再接单' : desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
