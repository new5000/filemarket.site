import React from 'react';
import { AdminProtectedRoute } from './AdminProtectedRoute';

interface AdminGuardProps {
  children: React.ReactNode;
  onOpenLogin?: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onOpenLogin }) => {
  return <AdminProtectedRoute onOpenLogin={onOpenLogin}>{children}</AdminProtectedRoute>;
};

export default AdminGuard;
