import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import { Restaurant } from '../data/mockData';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <Link to={`/restaurant/${restaurant.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md active:scale-[0.98]">
        <div className="relative h-40 overflow-hidden">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800 shadow-sm flex items-center gap-1">
            <Clock size={12} className="text-emerald-600" />
            {restaurant.deliveryTime}
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-lg text-gray-900 leading-tight">{restaurant.name}</h3>
            <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-gray-700">{restaurant.rating}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {restaurant.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>配送费: ¥{restaurant.deliveryFee.toFixed(2)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>起送: ¥{restaurant.minOrder.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
