import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MOCK_RESTAURANTS } from '../data/mockData';

export const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, restaurantId, clearCart } = useCart();
  const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">购物车是空的</h2>
        <p className="text-gray-500 text-center mb-8">看起来你还没有添加任何商品。</p>
        <button
          onClick={() => navigate('/')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          去逛逛
        </button>
      </div>
    );
  }

  const handleCheckout = () => {
    clearCart();
    navigate('/success');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 max-w-md mx-auto">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">购物车</h1>
        </div>
        <button onClick={clearCart} className="text-sm text-red-500 font-medium hover:bg-red-50 px-2 py-1 rounded">
          清空
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Restaurant Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-1">{restaurant?.name}</h2>
          <p className="text-sm text-emerald-600 font-medium">{restaurant?.deliveryTime} 送达</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="p-4 border-b border-gray-50 last:border-0 flex gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                  <p className="font-semibold text-gray-900">¥{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>商品小计</span>
            <span>¥{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>配送费</span>
            <span>¥{restaurant?.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>打包费</span>
            <span>¥1.00</span>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
            <span>合计</span>
            <span>¥{(totalPrice + (restaurant?.deliveryFee || 0) + 1.00).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
        <button 
          onClick={handleCheckout}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
        >
          去支付
        </button>
      </div>
    </div>
  );
};
