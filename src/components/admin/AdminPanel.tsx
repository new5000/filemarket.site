import React, { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from './AdminGuard';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminCMSView } from './AdminCMSView';
import { AdminProductsView } from './AdminProductsView';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminUsersView } from './AdminUsersView';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminPaymentSettingsView } from './AdminPaymentSettingsView';
import { AdminCouponsView } from './AdminCouponsView';
import { AdminHeroBannersView } from './AdminHeroBannersView';
import { AdminAdsView } from './AdminAdsView';
import { AdminFAQManager } from './AdminFAQManager';
import { Product } from '../../types';
import { 
  fetchAllProducts, 
  fetchAdminOrders, 
  fetchAdminUsers, 
  subscribeProducts,
  subscribeOrders,
  subscribeUsers,
  AdminOrder 
} from '../../lib/adminServices';

interface AdminPanelProps {
  initialTab?: AdminTab;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenLogin?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialTab = 'dashboard',
  darkMode,
  setDarkMode,
  onOpenLogin
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      const [pData, oData, uData] = await Promise.all([
        fetchAllProducts(),
        fetchAdminOrders(),
        fetchAdminUsers()
      ]);
      setProducts(pData);
      setOrders(oData);
      setUsers(uData);
    } catch (err) {
      console.warn("Failed loading admin panel data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();

    // Subscribe to real-time updates for products, orders, and users
    const unsubProducts = subscribeProducts((pList) => {
      setProducts(pList);
      setLoading(false);
    });

    const unsubOrders = subscribeOrders((oList) => {
      setOrders(oList);
    });

    const unsubUsers = subscribeUsers((uList) => {
      setUsers(uList);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, [loadAdminData]);

  const handleOpenAddProduct = () => {
    setActiveTab('products');
    setIsAddProductModalOpen(true);
  };

  return (
    <AdminGuard onOpenLogin={onOpenLogin}>
      <AdminLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      >
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold">Connecting Real-Time Admin Firestore Engine...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboardView
                products={products}
                orders={orders}
                users={users}
                onNavigateTab={setActiveTab}
                onOpenAddProduct={handleOpenAddProduct}
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'cms' && (
              <AdminCMSView
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'banners' && (
              <AdminHeroBannersView
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'ads' && (
              <AdminAdsView
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'products' && (
              <AdminProductsView
                products={products}
                onRefresh={loadAdminData}
                isAddModalOpen={isAddProductModalOpen}
                setIsAddModalOpen={setIsAddProductModalOpen}
              />
            )}

            {activeTab === 'orders' && (
              <AdminOrdersView
                orders={orders}
                products={products}
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'coupons' && (
              <AdminCouponsView
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'payments' && (
              <AdminPaymentSettingsView
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'users' && (
              <AdminUsersView
                users={users}
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettingsView
                onRefresh={loadAdminData}
              />
            )}
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminPanel;

