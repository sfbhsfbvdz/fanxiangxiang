import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Restaurant, MenuCategory } from '../types';
import { restaurantsApi } from '../api/restaurants';
import { useCart } from '../context/CartContext';
import { cn } from '../utils/utils';
import { motion, AnimatePresence } from 'motion/react';

export const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity, totalPrice, restaurantId: cartRestaurantId } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const restaurantId = parseInt(id);
    if (isNaN(restaurantId)) {
      setError('无效的餐厅ID');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [restaurantData, menuData] = await Promise.all([
          restaurantsApi.getRestaurantById(restaurantId),
          restaurantsApi.getRestaurantMenu(restaurantId),
        ]);
        setRestaurant(restaurantData);
        setMenuCategories(menuData.categories);
        if (menuData.categories.length > 0) {
          setActiveCategory(menuData.categories[0].id);
        }
      } catch {
        setError('加载失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const getItemQty = (itemId: number) => {
    return items.find((i) => i.id === itemId)?.quantity || 0;
  };

  const isCartVisible =
    items.length > 0 && restaurant && cartRestaurantId === restaurant.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto">
        <div className="h-64 bg-gray-200 animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{error || '餐厅不存在'}</p>
        <button onClick={() => navigate(-1)} className="text-emerald-600 font-semibold">
          返回
        </button>
      </div>
    );
  }

  const activeItems =
    activeCategory !== null
      ? menuCategories.find((c) => c.id === activeCategory)?.items ?? []
      : menuCategories.flatMap((c) => c.items);

  return (
    <div className="pb-24 bg-white min-h-screen max-w-md mx-auto relative">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="px-5 pt-4 pb-6 -mt-8 relative bg-white rounded-t-3xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{restaurant.rating}</span>
            <span className="text-gray-400">(500+)</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-emerald-600" />
            <span>{restaurant.deliveryTime}</span>
          </div>
          <div className="text-emerald-600 font-medium">
            ¥{restaurant.deliveryFee.toFixed(2)} 配送费
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 pb-20">
        <h2 className="font-bold text-lg mb-4">菜单</h2>
        <div className="flex flex-col gap-6">
          {activeItems.map((item) => {
            const qty = getItemQty(item.id);
            return (
              <div key={item.id} className="flex gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-gray-900">¥{item.price.toFixed(2)}</span>
                    {item.status === 'sold_out' ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">已售罄</span>
                    ) : qty > 0 ? (
                      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-white rounded-full transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1 hover:bg-white rounded-full transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded-full transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {isCartVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-4 z-50 max-w-md mx-auto"
          >
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ShoppingBag size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-100 font-medium">总计</p>
                  <p className="font-bold text-lg">¥{totalPrice.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                去结算
                <ArrowLeft size={16} className="rotate-180" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
