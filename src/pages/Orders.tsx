import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'o1',
    restaurant: '一食堂 - 川湘风味',
    date: '今天, 12:30',
    status: '已送达',
    total: 24.50,
    items: ['宫保鸡丁盖饭 x1', '番茄鸡蛋汤 x1'],
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80',
  },
  {
    id: 'o2',
    restaurant: '校园水果站',
    date: '昨天, 19:15',
    status: '已送达',
    total: 27.00,
    items: ['鲜切西瓜盒 x1', '鲜榨橙汁 x1'],
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80',
  },
];

export const Orders = () => {
  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">历史订单</h1>
      
      <div className="space-y-4">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-4 mb-4">
              <img src={order.image} alt={order.restaurant} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{order.restaurant}</h3>
                  <span className="text-xs text-gray-500">{order.date}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                  <CheckCircle2 size={12} />
                  {order.status}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-50 pt-3 mb-3">
              <p className="text-sm text-gray-600 line-clamp-1">{order.items.join(', ')}</p>
              <p className="text-xs text-gray-400 mt-1">{order.items.length} 件商品 • ¥{order.total.toFixed(2)}</p>
            </div>

            <button className="w-full py-2 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              再来一单
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
