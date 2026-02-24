import React from 'react';
import { User, Settings, CreditCard, MapPin, Heart, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: '个人信息', path: '/profile/info' },
    { icon: MapPin, label: '地址管理', path: '/profile/address' },
    { icon: CreditCard, label: '支付方式', path: '/profile/payment' },
    { icon: Heart, label: '我的收藏', path: '/profile/favorites' },
    { icon: Settings, label: '设置', path: '/profile/settings' },
  ];

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">
          同学
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">张同学</h1>
          <p className="text-sm text-gray-500">zhang.student@university.edu</p>
        </div>
      </div>

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
            <span className="text-gray-400">›</span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => alert('已退出登录')}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        退出登录
      </button>
    </div>
  );
};
