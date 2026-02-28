import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { merchantApi, MerchantRestaurant } from '../../api/merchant';

export const MerchantSettings = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', delivery_fee: '', min_order: '', delivery_time: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    merchantApi.getRestaurant()
      .then(res => {
        if (res.data) {
          const r = res.data;
          setForm({
            name: r.name,
            description: r.description || '',
            delivery_fee: String(r.delivery_fee),
            min_order: String(r.min_order),
            delivery_time: r.delivery_time,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await merchantApi.updateRestaurant({
        name: form.name,
        description: form.description,
        delivery_fee: parseFloat(form.delivery_fee) || 0,
        min_order: parseFloat(form.min_order) || 0,
        delivery_time: form.delivery_time,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pt-16">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const fields: { label: string; key: keyof typeof form; type?: string; placeholder: string }[] = [
    { label: '餐厅名称', key: 'name', placeholder: '餐厅名称' },
    { label: '描述', key: 'description', placeholder: '餐厅简介' },
    { label: '配送费（元）', key: 'delivery_fee', type: 'number', placeholder: '0.00' },
    { label: '最低起送（元）', key: 'min_order', type: 'number', placeholder: '0.00' },
    { label: '配送时间', key: 'delivery_time', placeholder: '如：20-30 分钟' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/merchant')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">餐厅设置</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
          {fields.map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full mt-1.5 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
            saved ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700'
          } disabled:opacity-60`}
        >
          <Save size={18} />
          {saved ? '已保存！' : isSaving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
};
