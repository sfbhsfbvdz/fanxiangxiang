import React, { useState } from 'react';
import { Search, MapPin, Bell } from 'lucide-react';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { RestaurantCard } from '../components/RestaurantCard';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRestaurants = MOCK_RESTAURANTS.filter(r => 
    r.name.includes(searchTerm) || 
    r.tags.some(t => t.includes(searchTerm)) ||
    r.menu.some(m => m.name.includes(searchTerm))
  );

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
        <button 
          onClick={() => navigate('/notifications')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
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
        <div className="flex flex-col gap-5">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              未找到相关商家
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
