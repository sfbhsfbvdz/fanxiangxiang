import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PlaceholderPage = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const titles: Record<string, string> = {
    'address': '地址管理',
    'payment': '支付方式',
    'favorites': '我的收藏',
    'settings': '设置',
    'notifications': '消息中心',
    'info': '个人信息'
  };

  const title = page ? titles[page] : '页面';

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">{title}</h1>
      </header>
      <div className="p-8 text-center text-gray-500">
        <p>这里是{title}页面。</p>
        <p className="text-xs mt-2">（功能开发中）</p>
      </div>
    </div>
  );
};
