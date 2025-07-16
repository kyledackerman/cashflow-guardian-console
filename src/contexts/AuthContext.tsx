import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Employee } from '@/types/finance';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { ROLE_PERMISSIONS } from '@/hooks/usePermissions';

interface AuthContextType {
  currentUser: Employee | null;
  login: (employee: Employee) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const { employees } = useFinanceStore();
  const isMountedRef = useRef(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId && employees.length > 0 && isMountedRef.current) {
      const user = employees.find(emp => emp.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [employees]);

  const login = useCallback((employee: Employee) => {
    if (!isMountedRef.current) return;
    
    // Ensure employee has proper permissions based on role
    const rolePermissions = employee.role && ROLE_PERMISSIONS[employee.role as keyof typeof ROLE_PERMISSIONS] 
      ? [...ROLE_PERMISSIONS[employee.role as keyof typeof ROLE_PERMISSIONS]] 
      : [];
    
    const employeeWithPermissions: Employee = {
      ...employee,
      permissions: employee.permissions || rolePermissions
    };
    setCurrentUser(employeeWithPermissions);
    localStorage.setItem('currentUserId', employee.id);
  }, []);

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  };

  const isAuthenticated = currentUser !== null;

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};