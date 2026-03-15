import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Package, RefreshCw, Camera, X } from 'lucide-react';
import { riderApi, RiderOrder } from '../../api/rider';

interface PhotoModal {
  orderId: number;
}

export const RiderDelivery = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [photoModal, setPhotoModal] = useState<PhotoModal | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    riderApi.getMyOrders()
      .then(res => {
        if (res.data) setOrders(res.data.filter(o => o.status === 'delivering'));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePicked = async (id: number) => {
    setActionId(id);
    try {
      await riderApi.pickedOrder(id);
      // Status stays the same, just show feedback
    } finally {
      setActionId(null);
    }
  };

  const openPhotoModal = (id: number) => {
    setPhotoModal({ orderId: id });
    setPhotoPreview(null);
    setPhotoData(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoData(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDelivered = async (id: number, photo?: string) => {
    setActionId(id);
    try {
      await riderApi.deliveredOrder(id, photo || undefined);
      setPhotoModal(null);
      load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Photo Modal */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">上传配送凭证</h3>
              <button onClick={() => setPhotoModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">请拍摄或上传送达照片作为配送凭证（可选）。</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative mb-4">
                <img src={photoPreview} alt="预览" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoData(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors mb-4"
              >
                <Camera size={28} />
                <span className="text-sm">拍照 / 选择图片</span>
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleDelivered(photoModal.orderId)}
                disabled={actionId === photoModal.orderId}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                跳过，直接完成
              </button>
              <button
                onClick={() => handleDelivered(photoModal.orderId, photoData ?? undefined)}
                disabled={actionId === photoModal.orderId || !photoPreview}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {actionId === photoModal.orderId ? '提交中...' : '上传并完成'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rider')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">当前配送</h1>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-blue-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">暂无配送中的订单</p>
            <button
              onClick={() => navigate('/rider/available')}
              className="mt-4 text-blue-600 font-semibold text-sm hover:underline"
            >
              去抢单
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{order.restaurant_name}</p>
                  <p className="text-xs text-gray-500">订单 #{order.id}</p>
                </div>
                <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">
                  配送中
                </span>
              </div>

              <div className="flex items-start gap-1.5 mb-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                配送费 ¥{order.delivery_fee.toFixed(2)} · 订单金额 ¥{order.total_price.toFixed(2)}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePicked(order.id)}
                  disabled={actionId === order.id}
                  className="py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Package size={15} />
                  已取餐
                </button>
                <button
                  onClick={() => openPhotoModal(order.id)}
                  disabled={actionId === order.id}
                  className="py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  已送达
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
