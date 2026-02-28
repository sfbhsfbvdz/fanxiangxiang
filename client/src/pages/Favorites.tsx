import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Clock, Trash2 } from 'lucide-react';
import { Restaurant } from '../types';
import { restaurantsApi } from '../api/restaurants';

export const Favorites = () => {
  const navigate = useNavigate();

  // Seed favorites with first 2 restaurants from API to show UI
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restaurantsApi
      .getRestaurants()
      .then((res) => {
        // Pre-load the first 2 as example favorites
        setFavorites(res.restaurants.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const remove = (id: number) => {
    setFavorites((prev) => prev.filter((r) => r.id !== id));
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
        <h1 className="font-bold text-lg text-gray-900 flex-1">我的收藏</h1>
        {favorites.length > 0 && (
          <span className="text-sm text-gray-400">{favorites.length} 家</span>
        )}
      </header>

      <div className="px-4 pt-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-pink-50 p-6 rounded-full mb-4">
              <Heart size={44} className="text-pink-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">还没有收藏</h2>
            <p className="text-gray-500 text-sm mb-8">
              浏览餐厅时点击心形图标即可收藏
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              去逛逛
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
              >
                <div
                  className="relative h-36 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(restaurant.id);
                    }}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    <Heart size={16} className="fill-pink-500" />
                  </button>
                </div>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {restaurant.deliveryTime}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>配送费 ¥{restaurant.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors text-sm font-medium"
            >
              发现更多餐厅
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
