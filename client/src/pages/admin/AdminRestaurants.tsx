import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi, AdminRestaurant } from '../../api/admin';

export const AdminRestaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    adminApi.getRestaurants()
      .then(res => { if (res.data) setRestaurants(res.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (r: AdminRestaurant) => {
    setTogglingId(r.id);
    const newStatus = r.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.updateRestaurantStatus(r.id, newStatus);
      setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">餐厅管理</h1>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : restaurants.map(r => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex gap-4">
              {r.image && (
                <img src={r.image} alt={r.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900 truncate">{r.name}</h3>
                  <button
                    onClick={() => toggleStatus(r)}
                    disabled={togglingId === r.id}
                    className={`flex-shrink-0 ${r.status === 'active' ? 'text-emerald-600' : 'text-gray-400'} disabled:opacity-50`}
                  >
                    {r.status === 'active' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>⭐ {r.rating}</span>
                  <span>配送费 ¥{r.delivery_fee}</span>
                  <span>累计 {r.order_count} 单</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                r.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {r.status === 'active' ? '营业中' : '已关闭'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
