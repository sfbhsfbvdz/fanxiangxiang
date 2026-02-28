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
import { Settings } from './pages/Settings';
import { Payment } from './pages/Payment';
import { Favorites } from './pages/Favorites';
import { Notifications } from './pages/Notifications';
// Merchant pages
import { MerchantHome } from './pages/merchant/MerchantHome';
import { MerchantOrders } from './pages/merchant/MerchantOrders';
import { MerchantMenu } from './pages/merchant/MerchantMenu';
import { MerchantSettings } from './pages/merchant/MerchantSettings';
// Rider pages
import { RiderHome } from './pages/rider/RiderHome';
import { RiderAvailable } from './pages/rider/RiderAvailable';
import { RiderDelivery } from './pages/rider/RiderDelivery';
import { RiderHistory } from './pages/rider/RiderHistory';
// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminRestaurants } from './pages/admin/AdminRestaurants';
import { AdminUsers } from './pages/admin/AdminUsers';
// Guards
import { RootRedirect, CustomerGuard, RoleGuard } from './components/RoleGuard';

const CustomerLayout = () => (
  <CustomerGuard>
    <Outlet />
    <BottomNav />
  </CustomerGuard>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* 根路由：按角色分发 */}
            <Route index element={<RootRedirect />} />

            {/* 顾客端（需登录且 role=customer） */}
            <Route element={<CustomerLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/browse" element={<Home />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/restaurant/:id" element={<CustomerGuard><RestaurantDetail /></CustomerGuard>} />
            <Route path="/cart" element={<CustomerGuard><Cart /></CustomerGuard>} />
            <Route path="/success" element={<CustomerGuard><CheckoutSuccess /></CustomerGuard>} />
            <Route path="/orders/:id" element={<CustomerGuard><OrderDetail /></CustomerGuard>} />
            <Route path="/profile/address" element={<CustomerGuard><AddressManage /></CustomerGuard>} />
            <Route path="/profile/settings" element={<CustomerGuard><Settings /></CustomerGuard>} />
            <Route path="/profile/payment" element={<CustomerGuard><Payment /></CustomerGuard>} />
            <Route path="/profile/favorites" element={<CustomerGuard><Favorites /></CustomerGuard>} />
            <Route path="/profile/:page" element={<CustomerGuard><PlaceholderPage /></CustomerGuard>} />
            <Route path="/notifications" element={<CustomerGuard><Notifications /></CustomerGuard>} />

            {/* 商家端 */}
            <Route path="/merchant" element={<RoleGuard role="merchant"><MerchantHome /></RoleGuard>} />
            <Route path="/merchant/orders" element={<RoleGuard role="merchant"><MerchantOrders /></RoleGuard>} />
            <Route path="/merchant/menu" element={<RoleGuard role="merchant"><MerchantMenu /></RoleGuard>} />
            <Route path="/merchant/settings" element={<RoleGuard role="merchant"><MerchantSettings /></RoleGuard>} />

            {/* 骑手端 */}
            <Route path="/rider" element={<RoleGuard role="rider"><RiderHome /></RoleGuard>} />
            <Route path="/rider/available" element={<RoleGuard role="rider"><RiderAvailable /></RoleGuard>} />
            <Route path="/rider/delivery" element={<RoleGuard role="rider"><RiderDelivery /></RoleGuard>} />
            <Route path="/rider/history" element={<RoleGuard role="rider"><RiderHistory /></RoleGuard>} />

            {/* 管理后台 */}
            <Route path="/admin" element={<RoleGuard role="admin"><AdminDashboard /></RoleGuard>} />
            <Route path="/admin/orders" element={<RoleGuard role="admin"><AdminOrders /></RoleGuard>} />
            <Route path="/admin/restaurants" element={<RoleGuard role="admin"><AdminRestaurants /></RoleGuard>} />
            <Route path="/admin/users" element={<RoleGuard role="admin"><AdminUsers /></RoleGuard>} />

            {/* 登录 / 注册（已登录自动跳走） */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
