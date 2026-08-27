import React from 'react';
import { Product } from '../../types';
import { AdminOrder } from '../../lib/adminServices';
import AdminDashboardOverview from './AdminDashboardOverview';

interface AdminDashboardViewProps {
  products: Product[];
  orders: AdminOrder[];
  users: any[];
  onNavigateTab: (tab: 'products' | 'orders' | 'users' | 'settings') => void;
  onOpenAddProduct: () => void;
  onRefresh: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  orders,
  users,
  onNavigateTab,
  onOpenAddProduct,
  onRefresh
}) => {
  return (
    <AdminDashboardOverview
      products={products}
      orders={orders}
      users={users}
      onNavigateTab={onNavigateTab}
      onOpenAddProduct={onOpenAddProduct}
      onRefresh={onRefresh}
    />
  );
};

export default AdminDashboardView;
