import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, TrendingUp, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { merchantApi, MerchantOrder, MerchantRestaurant } from '../../api/merchant';
import { useAuth } from '../../context/AuthContext';

export const MerchantHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<MerchantRestaurant | null>(null);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([merchantApi.getRestaurant(), merchantApi.getOrders()])
      .then(([rRes, oRes]) => {
        if (rRes.data) setRestaurant(rRes.data);
        if (oRes.data) setOrders(oRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const todayOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_price, 0);

  const pendingCount = orders.filter(o => o.status === 'paid').length;

  const toggleStatus = async () => {
    if (!restaurant || toggling) return;
    setToggling(true);
    const newStatus = restaurant.status === 'active' ? 'inactive' : 'active';
    try {
      await merchantApi.updateRestaurant({ status: newStatus });
      setRestaurant({ ...restaurant, status: newStatus });
    } catch {
      // ignore
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
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-6">
        <p className="text-emerald-200 text-sm">商家后台</p>
        <h1 className="text-2xl font-bold mt-1">{restaurant?.name || '我的餐厅'}</h1>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium"
          >
            {restaurant?.status === 'active'
              ? <><ToggleRight size={18} /> 营业中</>
              : <><ToggleLeft size={18} /> 已打烊</>}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-2 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '今日订单', value: todayOrders.length, Icon: ShoppingBag, color: 'text-blue-500' },
            { label: '今日收入', value: `¥${todayRevenue.toFixed(0)}`, Icon: TrendingUp, color: 'text-emerald-600' },
            { label: '待接单', value: pendingCount, Icon: Store, color: 'text-orange-500' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <Icon size={20} className={`${color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* New orders alert */}
        {pendingCount > 0 && (
          <div
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer"
            onClick={() => navigate('/merchant/orders')}
          >
            <div>
              <p className="font-bold text-orange-700">有 {pendingCount} 个新订单待处理</p>
              <p className="text-xs text-orange-500 mt-0.5">点击前往处理</p>
            </div>
            <ChevronRight size={20} className="text-orange-400" />
          </div>
        )}

        {/* Quick nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: '订单管理', desc: '接单、备餐操作', path: '/merchant/orders' },
            { label: '菜单管理', desc: '菜品上下架、新增编辑', path: '/merchant/menu' },
            { label: '餐厅设置', desc: '配送费、营业时间等', path: '/merchant/settings' },
          ].map(({ label, desc, path }, i) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}
            >
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">当前登录：{user?.username}</p>
      </div>
    </div>
  );
};
