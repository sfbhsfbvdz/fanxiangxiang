import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as { orderId?: number })?.orderId;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/orders');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-4 text-white text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white text-emerald-600 p-6 rounded-full mb-6"
      >
        <CheckCircle2 size={64} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold mb-2"
      >
        下单成功!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-emerald-100 mb-6"
      >
        美食正在向你飞奔而来。
      </motion.p>
      {orderId && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-emerald-200 text-sm mb-4"
        >
          订单号: #{orderId}
        </motion.p>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex gap-3"
      >
        <button
          onClick={() => navigate('/orders')}
          className="bg-white/20 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors"
        >
          查看订单
        </button>
        <button
          onClick={() => navigate('/home')}
          className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
        >
          继续点餐
        </button>
      </motion.div>
    </div>
  );
};
