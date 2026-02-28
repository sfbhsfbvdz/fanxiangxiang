import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Truck, Package, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'order_placed' | 'order_preparing' | 'order_delivering' | 'order_completed' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderId?: number;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order_completed',
    title: '订单已送达',
    body: '你的订单 #3（一食堂 - 川湘风味）已送达，请注意查收。',
    time: '10分钟前',
    read: false,
    orderId: 3,
  },
  {
    id: '2',
    type: 'order_delivering',
    title: '外卖正在配送',
    body: '你的订单 #2（校园水果站）正在配送中，请保持手机畅通。',
    time: '昨天 12:30',
    read: true,
    orderId: 2,
  },
  {
    id: '3',
    type: 'order_preparing',
    title: '商家正在备餐',
    body: '你的订单 #1（二食堂 - 面食档）商家已接单并开始备餐。',
    time: '昨天 11:55',
    read: true,
    orderId: 1,
  },
  {
    id: '4',
    type: 'system',
    title: '欢迎使用饭否',
    body: '发现校园美食，随时随地点餐配送到宿舍。',
    time: '2天前',
    read: true,
  },
];

const typeConfig: Record<
  Notification['type'],
  { Icon: React.ElementType; bg: string; color: string }
> = {
  order_placed: { Icon: Package, bg: 'bg-blue-50', color: 'text-blue-500' },
  order_preparing: { Icon: Clock, bg: 'bg-orange-50', color: 'text-orange-500' },
  order_delivering: { Icon: Truck, bg: 'bg-purple-50', color: 'text-purple-500' },
  order_completed: { Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  system: { Icon: Bell, bg: 'bg-gray-100', color: 'text-gray-500' },
};

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.orderId) {
      navigate(`/orders/${n.orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900 flex-1">消息通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            全部已读
          </button>
        )}
      </header>

      <div className="px-4 pt-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Bell size={44} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">暂无通知</h2>
            <p className="text-gray-500 text-sm">订单状态更新将在这里提醒你</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const { Icon, bg, color } = typeConfig[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                    n.read
                      ? 'bg-white border-gray-100 shadow-sm'
                      : 'bg-white border-emerald-100 shadow-sm shadow-emerald-50'
                  } hover:shadow-md`}
                >
                  <div className={`${bg} p-2.5 rounded-xl flex-shrink-0 mt-0.5`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{n.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
