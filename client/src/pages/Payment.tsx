import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'alipay' | 'wechat' | 'card';
  label: string;
  detail: string;
  isDefault: boolean;
}

const initialMethods: PaymentMethod[] = [
  { id: '1', type: 'alipay', label: '支付宝', detail: '已绑定', isDefault: true },
  { id: '2', type: 'wechat', label: '微信支付', detail: '已绑定', isDefault: false },
];

const TypeIcon = ({ type }: { type: PaymentMethod['type'] }) => {
  if (type === 'alipay') {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
        支
      </div>
    );
  }
  if (type === 'wechat') {
    return (
      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-sm">
        微
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
      卡
    </div>
  );
};

export const Payment = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [showToast, setShowToast] = useState('');

  const setDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
  };

  const remove = (id: string) => {
    const method = methods.find((m) => m.id === id);
    if (!method) return;
    if (method.isDefault) {
      toast('默认支付方式不可删除');
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2000);
  };

  const handleAdd = () => {
    toast('暂不支持添加新支付方式');
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
        <h1 className="font-bold text-lg text-gray-900">支付方式</h1>
      </header>

      <div className="px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {methods.map((method, i) => (
            <div
              key={method.id}
              className={`flex items-center gap-4 p-4 ${
                i !== methods.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <TypeIcon type={method.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{method.label}</p>
                  {method.isDefault && (
                    <span className="text-[10px] text-emerald-600 border border-emerald-300 px-1.5 py-0.5 rounded">
                      默认
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{method.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => setDefault(method.id)}
                    className="text-xs text-emerald-600 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    设为默认
                  </button>
                )}
                {method.isDefault && (
                  <Check size={18} className="text-emerald-500" />
                )}
                {!method.isDefault && (
                  <button
                    onClick={() => remove(method.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          添加支付方式
        </button>

        <p className="text-xs text-center text-gray-400 px-4">
          支付信息经过加密保护，安全可靠
        </p>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 whitespace-nowrap">
          {showToast}
        </div>
      )}
    </div>
  );
};
