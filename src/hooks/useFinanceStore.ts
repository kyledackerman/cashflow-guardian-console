import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PettyCashTransaction,
  EmployeeLoanWithdrawal,
  EmployeeLoanRepayment,
  GarnishmentProfile,
  GarnishmentInstallment,
  Employee
} from '@/types/finance';

interface FinanceStore {
  // Petty Cash
  pettyCashTransactions: PettyCashTransaction[];
  pettyCashBalance: number;
  
  // Employee Loans
  employeeLoanWithdrawals: EmployeeLoanWithdrawal[];
  employeeLoanRepayments: EmployeeLoanRepayment[];
  
  // Garnishments
  garnishmentProfiles: GarnishmentProfile[];
  garnishmentInstallments: GarnishmentInstallment[];
  
  // Employees
  employees: Employee[];
  
  // Actions
  addPettyCashTransaction: (transaction: Omit<PettyCashTransaction, 'id' | 'createdAt'>) => void;
  updatePettyCashTransaction: (id: string, updates: Partial<PettyCashTransaction>) => void;
  deletePettyCashTransaction: (id: string) => void;
  
  addEmployeeLoanWithdrawal: (withdrawal: Omit<EmployeeLoanWithdrawal, 'id' | 'createdAt'>) => void;
  addEmployeeLoanRepayment: (repayment: Omit<EmployeeLoanRepayment, 'id' | 'createdAt'>) => void;
  
  addGarnishmentProfile: (profile: Omit<GarnishmentProfile, 'id' | 'createdAt' | 'updatedAt' | 'amountPaidSoFar' | 'balanceRemaining'>) => void;
  updateGarnishmentProfile: (id: string, updates: Partial<GarnishmentProfile>) => void;
  addGarnishmentInstallment: (installment: Omit<GarnishmentInstallment, 'id' | 'createdAt'>) => void;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      pettyCashTransactions: [],
      pettyCashBalance: 0,
      employeeLoanWithdrawals: [],
      employeeLoanRepayments: [],
      garnishmentProfiles: [],
      garnishmentInstallments: [],
  employees: [
    { id: '1', name: 'John Doe', active: true, role: 'manager', permissions: ['VIEW_FINANCES', 'EDIT_TRANSACTIONS', 'DELETE_RECORDS', 'MANAGE_EMPLOYEES', 'APPROVE_TRANSACTIONS'] },
    { id: '2', name: 'Jane Smith', active: true, role: 'employee', permissions: ['VIEW_FINANCES'] },
    { id: '3', name: 'Mike Johnson', active: true, role: 'employee', permissions: ['VIEW_FINANCES'] },
    { id: '4', name: 'Sarah Wilson', active: true, role: 'manager', permissions: ['VIEW_FINANCES', 'EDIT_TRANSACTIONS', 'DELETE_RECORDS', 'MANAGE_EMPLOYEES', 'APPROVE_TRANSACTIONS'] },
  ],

      // Petty Cash Actions
      addPettyCashTransaction: (transaction) => {
        const newTransaction: PettyCashTransaction = {
          ...transaction,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => {
          const newTransactions = [...state.pettyCashTransactions, newTransaction];
          const newBalance = calculatePettyCashBalance(newTransactions);
          
          return {
            pettyCashTransactions: newTransactions,
            pettyCashBalance: newBalance,
          };
        });
      },

      updatePettyCashTransaction: (id, updates) => {
        set((state) => {
          const updatedTransactions = state.pettyCashTransactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction
          );
          const newBalance = calculatePettyCashBalance(updatedTransactions);
          
          return {
            pettyCashTransactions: updatedTransactions,
            pettyCashBalance: newBalance,
          };
        });
      },

      deletePettyCashTransaction: (id) => {
        set((state) => {
          const filteredTransactions = state.pettyCashTransactions.filter((t) => t.id !== id);
          const newBalance = calculatePettyCashBalance(filteredTransactions);
          
          return {
            pettyCashTransactions: filteredTransactions,
            pettyCashBalance: newBalance,
          };
        });
      },

      // Employee Loan Actions
      addEmployeeLoanWithdrawal: (withdrawal) => {
        const newWithdrawal: EmployeeLoanWithdrawal = {
          ...withdrawal,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => ({
          employeeLoanWithdrawals: [...state.employeeLoanWithdrawals, newWithdrawal],
        }));
      },

      addEmployeeLoanRepayment: (repayment) => {
        const newRepayment: EmployeeLoanRepayment = {
          ...repayment,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => ({
          employeeLoanRepayments: [...state.employeeLoanRepayments, newRepayment],
        }));
      },

      // Garnishment Actions
      addGarnishmentProfile: (profile) => {
        const newProfile: GarnishmentProfile = {
          ...profile,
          id: crypto.randomUUID(),
          amountPaidSoFar: 0,
          balanceRemaining: profile.totalAmountOwed,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          garnishmentProfiles: [...state.garnishmentProfiles, newProfile],
        }));
      },

      updateGarnishmentProfile: (id, updates) => {
        set((state) => ({
          garnishmentProfiles: state.garnishmentProfiles.map((profile) =>
            profile.id === id 
              ? { ...profile, ...updates, updatedAt: new Date() }
              : profile
          ),
        }));
      },

      addGarnishmentInstallment: (installment) => {
        const newInstallment: GarnishmentInstallment = {
          ...installment,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => {
          const updatedInstallments = [...state.garnishmentInstallments, newInstallment];
          
          // Update the profile's paid amount and balance
          const profile = state.garnishmentProfiles.find(p => p.id === installment.profileId);
          if (profile) {
            const totalPaid = updatedInstallments
              .filter(i => i.profileId === installment.profileId)
              .reduce((sum, i) => sum + i.amount, 0);
            
            const updatedProfiles = state.garnishmentProfiles.map(p =>
              p.id === installment.profileId
                ? {
                    ...p,
                    amountPaidSoFar: totalPaid,
                    balanceRemaining: p.totalAmountOwed - totalPaid,
                    updatedAt: new Date(),
                  }
                : p
            );

            return {
              garnishmentInstallments: updatedInstallments,
              garnishmentProfiles: updatedProfiles,
            };
          }

          return { garnishmentInstallments: updatedInstallments };
        });
      },

      // Employee Actions
      addEmployee: (employee) => {
        const newEmployee: Employee = {
          ...employee,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          employees: [...state.employees, newEmployee],
        }));
      },

      updateEmployee: (id, updates) => {
        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === id ? { ...employee, ...updates } : employee
          ),
        }));
      },
    }),
    {
      name: 'finance-store',
    }
  )
);

// Helper function to calculate petty cash balance
function calculatePettyCashBalance(transactions: PettyCashTransaction[]): number {
  return transactions
    .filter(t => t.approved)
    .reduce((balance, transaction) => {
      return transaction.type === 'credit' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);
}