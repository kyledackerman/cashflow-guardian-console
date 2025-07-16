import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId && employees.length > 0) {
      const user = employees.find(emp => emp.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [employees]);

  const login = (employee: Employee) => {
    // Ensure employee has proper permissions based on role
    const employeeWithPermissions: Employee = {
      ...employee,
      permissions: employee.permissions || [...ROLE_PERMISSIONS[employee.role]] || []
    };
    setCurrentUser(employeeWithPermissions);
    localStorage.setItem('currentUserId', employee.id);
  };

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