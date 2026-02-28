import React from 'react';
import { User, Settings, CreditCard, MapPin, Heart, LogOut, ChevronRight, Store, Bike, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const menuItems = [
    { icon: MapPin, label: '地址管理', path: '/profile/address' },
    { icon: CreditCard, label: '支付方式', path: '/profile/payment' },
    { icon: Heart, label: '我的收藏', path: '/profile/favorites' },
    { icon: Settings, label: '设置', path: '/profile/settings' },
  ];

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
        <div className="flex items-center gap-4 mb-8 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-36" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User size={36} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">未登录</h2>
          <p className="text-gray-500 text-sm mb-6">登录后查看个人信息和订单</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors mb-3"
          >
            立即登录
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-emerald-600 font-medium hover:underline"
          >
            没有账号？注册
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="bg-gray-50 p-2 rounded-lg text-gray-400">
                <item.icon size={20} />
              </div>
              <span className="font-medium text-gray-500 flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const avatarText = user?.username?.charAt(0).toUpperCase() ?? '我';

  const ROLE_HOME: Record<string, string> = {
    merchant: '/merchant', rider: '/rider', admin: '/admin', customer: '/home',
  };
  const portalConfig: Record<string, { label: string; path: string; Icon: React.ElementType; color: string; bg: string }> = {
    merchant: { label: '进入商家后台',   path: '/merchant', Icon: Store,       color: 'text-orange-600', bg: 'bg-orange-50' },
    rider:    { label: '进入骑手工作台', path: '/rider',    Icon: Bike,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    admin:    { label: '进入管理后台',   path: '/admin',    Icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  };
  const portal = portalConfig[user?.role ?? ''];

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      {/* User Avatar & Info */}
      <div className="flex items-center gap-4 mb-8">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100"
          />
        ) : (
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">
            {avatarText}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user?.username}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {user?.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
        </div>
      </div>

      {portal && (
        <button
          onClick={() => navigate(portal.path)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl mb-4 ${portal.bg} border border-transparent hover:brightness-95 transition-all`}
        >
          <div className={`p-2 rounded-xl bg-white/70 ${portal.color}`}>
            <portal.Icon size={20} />
          </div>
          <span className={`font-semibold flex-1 text-left ${portal.color}`}>{portal.label}</span>
          <ChevronRight size={16} className={portal.color} />
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors ${
              i !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="bg-gray-50 p-2 rounded-lg text-gray-600">
              <item.icon size={20} />
            </div>
            <span className="font-medium text-gray-700 flex-1">{item.label}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        退出登录
      </button>
    </div>
  );
};
