import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Bell, User } from 'lucide-react';
import { Restaurant } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';
import { useNavigate } from 'react-router-dom';
import { restaurantsApi } from '../api/restaurants';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRestaurants = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await restaurantsApi.getRestaurants(search || undefined);
      setRestaurants(result.restaurants);
    } catch {
      setError('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchRestaurants]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/profile/address')}
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors -ml-2"
        >
          <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
            <MapPin size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">配送至</p>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              学生公寓A栋
              <span className="text-gray-400 text-[10px]">▼</span>
            </h1>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-emerald-600 font-semibold px-3 py-1.5 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
            >
              登录
            </button>
          )}
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="搜索商家、商品"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      {/* Restaurant List */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">附近商家</h2>

        {isLoading ? (
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchRestaurants(searchTerm)}
              className="text-emerald-600 font-semibold hover:underline"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {restaurants.length > 0 ? (
              restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                未找到相关商家
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
