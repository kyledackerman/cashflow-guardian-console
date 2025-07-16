import { Permission } from '@/types/finance';

export const PERMISSIONS = {
  VIEW_FINANCES: 'VIEW_FINANCES' as const,
  EDIT_TRANSACTIONS: 'EDIT_TRANSACTIONS' as const,
  DELETE_RECORDS: 'DELETE_RECORDS' as const,
  MANAGE_EMPLOYEES: 'MANAGE_EMPLOYEES' as const,
  APPROVE_TRANSACTIONS: 'APPROVE_TRANSACTIONS' as const,
} as const;

export const ROLE_PERMISSIONS = {
  employee: [PERMISSIONS.VIEW_FINANCES],
  manager: [
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.EDIT_TRANSACTIONS,
    PERMISSIONS.DELETE_RECORDS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.APPROVE_TRANSACTIONS,
  ],
} as const;

export const usePermissions = (userPermissions: Permission[]) => {
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  const canEditTransactions = () => hasPermission(PERMISSIONS.EDIT_TRANSACTIONS);
  const canDeleteRecords = () => hasPermission(PERMISSIONS.DELETE_RECORDS);
  const canManageEmployees = () => hasPermission(PERMISSIONS.MANAGE_EMPLOYEES);
  const canApproveTransactions = () => hasPermission(PERMISSIONS.APPROVE_TRANSACTIONS);
  const canViewFinances = () => hasPermission(PERMISSIONS.VIEW_FINANCES);

  return {
    hasPermission,
    canEditTransactions,
    canDeleteRecords,
    canManageEmployees,
    canApproveTransactions,
    canViewFinances,
  };
};