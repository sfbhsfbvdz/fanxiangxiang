import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, Store, TrendingUp, ChevronRight } from 'lucide-react';
import { adminApi, AdminStats } from '../../api/admin';

const BAR_COLORS = ['bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(res => { if (res.data) setStats(res.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pt-14">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const maxCount = stats ? Math.max(...stats.dailyOrders.map(d => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-12 pb-6">
        <p className="text-gray-400 text-sm">管理后台</p>
        <h1 className="text-2xl font-bold mt-1">数据概览</h1>
      </div>

      <div className="px-4 -mt-2 pb-8 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '总订单数', value: stats?.totalOrders ?? 0, Icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: '总收入', value: `¥${(stats?.totalRevenue ?? 0).toFixed(0)}`, Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: '注册用户', value: stats?.totalUsers ?? 0, Icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: '活跃餐厅', value: stats?.activeRestaurants ?? 0, Icon: Store, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`inline-flex p-2 rounded-xl ${bg} mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        {stats && stats.dailyOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-bold text-gray-900 mb-4">近7日订单趋势</h2>
            <div className="flex items-end gap-2 h-32">
              {stats.dailyOrders.map((d, i) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{d.count}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(d.date).getMonth() + 1}/{new Date(d.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: '订单管理', desc: '全平台订单查询', path: '/admin/orders' },
            { label: '餐厅管理', desc: '启用/禁用餐厅', path: '/admin/restaurants' },
            { label: '用户管理', desc: '分配角色权限', path: '/admin/users' },
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
      </div>
    </div>
  );
};
