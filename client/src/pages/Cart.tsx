import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingBag, MapPin, Plus, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { ordersApi } from '../api/orders';
import { usersApi } from '../api/users';
import { Restaurant, Address } from '../types';
import { ApiError } from '../api/client';

export const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, restaurantId, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsApi.getRestaurantById(restaurantId).then(setRestaurant).catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    usersApi.getAddresses().then((addrs) => {
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      else if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
    }).catch(() => {});
  }, [isAuthenticated]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">购物车是空的</h2>
        <p className="text-gray-500 text-center mb-8">看起来你还没有添加任何商品。</p>
        <button
          onClick={() => navigate('/home')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          去逛逛
        </button>
      </div>
    );
  }

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const packagingFee = 1.0;
  const total = totalPrice + deliveryFee + packagingFee + tip;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedAddressId) {
      setError('请先添加收货地址');
      return;
    }
    if (!restaurantId) return;

    setError('');
    setIsSubmitting(true);
    try {
      const order = await ordersApi.createOrder({
        restaurantId,
        items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        deliveryAddressId: selectedAddressId,
        notes: notes || undefined,
        tip: tip > 0 ? tip : undefined,
      });
      clearCart();
      navigate('/success', { state: { orderId: order.id } });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('下单失败，请稍后重试');
      }
    } finally {
      setIsSubmitting(false);
    }
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
        <button
          onClick={clearCart}
          className="text-sm text-red-500 font-medium hover:bg-red-50 px-2 py-1 rounded"
        >
          清空
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Restaurant Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-1">
            {restaurant?.name ?? '加载中...'}
          </h2>
          <p className="text-sm text-emerald-600 font-medium">
            {restaurant?.deliveryTime ?? ''} 送达
          </p>
        </div>

        {/* Delivery Address */}
        <div
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer"
          onClick={() => navigate('/profile/address')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              {!isAuthenticated ? (
                <p className="text-sm text-gray-500">
                  <span className="text-emerald-600 font-semibold">登录</span> 后选择收货地址
                </p>
              ) : selectedAddress ? (
                <>
                  <p className="font-semibold text-gray-900 text-sm">
                    {selectedAddress.name} · {selectedAddress.phone}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedAddress.address}
                    {selectedAddress.detail ? `，${selectedAddress.detail}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  <span className="text-emerald-600 font-semibold">添加</span> 收货地址
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>

          {/* Address selector */}
          {isAuthenticated && addresses.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAddressId(addr.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedAddressId === addr.id
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{addr.name}</span> · {addr.address}
                  {addr.isDefault && (
                    <span className="ml-2 text-emerald-600 text-[10px] border border-emerald-300 px-1 rounded">
                      默认
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {isAuthenticated && addresses.length === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/profile/address'); }}
              className="mt-3 pt-3 border-t border-gray-50 w-full flex items-center justify-center gap-1 text-sm text-emerald-600 font-medium"
            >
              <Plus size={14} /> 添加新地址
            </button>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="p-4 border-b border-gray-50 last:border-0 flex gap-4">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
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

        {/* Notes */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">备注</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="如：少辣，不要香菜，多放酱..."
            rows={2}
            maxLength={500}
            className="w-full text-sm text-gray-700 outline-none placeholder-gray-400 resize-none border border-gray-200 rounded-lg p-2 focus:border-emerald-400 transition-colors"
          />
          {notes.length > 0 && (
            <p className="text-right text-xs text-gray-400 mt-1">{notes.length}/500</p>
          )}
        </div>

        {/* Tip */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">打赏骑手</label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 5].map((amount) => (
              <button
                key={amount}
                onClick={() => { setTip(amount); setCustomTip(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tip === amount && customTip === ''
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                }`}
              >
                {amount === 0 ? '不打赏' : `¥${amount}`}
              </button>
            ))}
            <div className={`flex items-center border rounded-full px-3 py-1 text-sm transition-colors ${
              customTip !== '' ? 'border-emerald-600' : 'border-gray-200'
            }`}>
              <span className="text-gray-500 mr-1">¥</span>
              <input
                type="number"
                min="0"
                max="999"
                step="1"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  const v = parseFloat(e.target.value);
                  setTip(isNaN(v) ? 0 : Math.max(0, Math.min(999, v)));
                }}
                placeholder="自定义"
                className="w-16 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>
          {tip > 0 && (
            <p className="text-xs text-emerald-600 mt-2">已选择打赏 ¥{tip.toFixed(2)}，感谢您对骑手的支持！</p>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>商品小计</span>
            <span>¥{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>配送费</span>
            <span>¥{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>打包费</span>
            <span>¥{packagingFee.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>骑手打赏</span>
              <span className="text-emerald-600">¥{tip.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
            <span>合计</span>
            <span>¥{total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
        <button
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '提交中...' : isAuthenticated ? `去支付 ¥${total.toFixed(2)}` : '登录后下单'}
        </button>
      </div>
    </div>
  );
};
