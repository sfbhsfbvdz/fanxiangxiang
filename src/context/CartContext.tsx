import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../data/mockData';

interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MenuItem, restaurantId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  restaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const addToCart = (item: MenuItem, restId: string) => {
    if (restaurantId && restaurantId !== restId) {
      if (!window.confirm('开始新的购物篮？从另一家餐厅添加商品将清空当前购物篮。')) {
        return;
      }
      setItems([]);
      setRestaurantId(restId);
    } else if (!restaurantId) {
      setRestaurantId(restId);
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, restaurantId: restId }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (items.length === 1) {
      setRestaurantId(null);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      return prev.map((i) => {
        if (i.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : i;
        }
        return i;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        restaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
