import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from './usePermissions';

export const useUserPermissions = () => {
  const { userProfile } = useSupabaseAuth();
  
  // If no user profile, return restrictive permissions
  if (!userProfile) {
    return {
      hasRole: () => false,
      canEditTransactions: () => false,
      canDeleteRecords: () => false,
      canManageUsers: () => false,
      canApproveTransactions: () => false,
      canViewFinances: () => false,
      canApproveLargeLoans: () => false,
      canApproveAmount: () => false,
      userRole: null,
    };
  }

  const permissions = usePermissions(userProfile.role);

  return {
    ...permissions,
    userRole: userProfile.role,
  };
};