import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME: Record<string, string> = {
  merchant: '/merchant',
  rider: '/rider',
  admin: '/admin',
  customer: '/home',
};

/** 根路由：未登录→登录页，已登录→角色首页 */
export const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // 等待 auth 状态恢复，避免闪跳

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={ROLE_HOME[user.role ?? 'customer'] ?? '/'} replace />;
};

/** 顾客路由守卫：未登录→登录页，非顾客→角色首页 */
export const CustomerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  // merchant/rider/admin 误入顾客页 → 送回自己的工作台
  if (user.role && user.role !== 'customer') {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  }

  return <>{children}</>;
};

/** 角色路由守卫：未登录→登录页，角色不符→登录页 */
export const RoleGuard = ({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
