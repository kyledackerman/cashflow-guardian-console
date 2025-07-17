
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

// Backwards compatibility - will be removed in Phase 3
export const ROLE_PERMISSIONS = {
  employee: ['VIEW_FINANCES'],
  user: ['VIEW_FINANCES'],
  manager: ['VIEW_FINANCES', 'EDIT_TRANSACTIONS', 'DELETE_RECORDS', 'APPROVE_TRANSACTIONS'],
  admin: ['VIEW_FINANCES', 'EDIT_TRANSACTIONS', 'DELETE_RECORDS', 'APPROVE_TRANSACTIONS', 'APPROVE_LARGE_LOANS'],
} as const satisfies Record<string, string[]>;

export const usePermissions = (userRole: UserRole) => {
  const hasRole = (requiredRole: UserRole): boolean => {
    if (requiredRole === 'user') {
      return ['user', 'manager', 'admin'].includes(userRole);
    }
    if (requiredRole === 'manager') {
      return ['manager', 'admin'].includes(userRole);
    }
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    return false;
  };

  const canEditTransactions = () => hasRole('manager');
  const canDeleteRecords = () => hasRole('manager');
  const canManageUsers = () => hasRole('admin');
  const canApproveTransactions = () => hasRole('manager');
  const canViewFinances = () => hasRole('user');
  const canApproveLargeLoans = () => hasRole('admin');
  
  const canApproveAmount = (amount: number): boolean => {
    if (amount > 500) return canApproveLargeLoans();
    return canApproveTransactions();
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
