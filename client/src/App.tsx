import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Home } from './pages/Home';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Orders } from './pages/Orders';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AddressManage } from './pages/AddressManage';
import { OrderDetail } from './pages/OrderDetail';
import { BottomNav } from './components/BottomNav';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { PlaceholderPage } from './pages/PlaceholderPage';

const Layout = () => (
  <>
    <Outlet />
    <BottomNav />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Home />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/success" element={<CheckoutSuccess />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/address" element={<AddressManage />} />
            <Route path="/profile/:page" element={<PlaceholderPage />} />
            <Route path="/notifications" element={<PlaceholderPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
