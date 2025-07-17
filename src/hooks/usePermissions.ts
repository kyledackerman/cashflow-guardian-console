
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

// Role hierarchy: employee < manager < admin
// Each role includes all permissions of lower roles

export const usePermissions = (userRole: UserRole) => {
  // Role hierarchy check: employee < manager < admin  
  const hasRole = (requiredRole: UserRole): boolean => {
    if (requiredRole === 'employee') {
      return ['employee', 'manager', 'admin'].includes(userRole);
    }
    if (requiredRole === 'manager') {
      return ['manager', 'admin'].includes(userRole);
    }
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    return false;
  };

  // Simplified role-based permissions
  const canEditTransactions = () => hasRole('manager');
  const canDeleteRecords = () => hasRole('manager');
  const canManageUsers = () => hasRole('admin');
  const canApproveTransactions = () => hasRole('manager');
  const canViewFinances = () => hasRole('employee'); // All roles can view
  const canApproveLargeLoans = () => hasRole('admin');
  
  // Role-based approval limits
  const canApproveAmount = (amount: number): boolean => {
    if (amount > 500) return canApproveLargeLoans(); // Only admin for large amounts
    return canApproveTransactions(); // Manager+ for smaller amounts
  };

  return {
    hasRole,
    canEditTransactions,
    canDeleteRecords,
    canManageUsers,
    canApproveTransactions,
    canViewFinances,
    canApproveLargeLoans,
    canApproveAmount,
  };
};
