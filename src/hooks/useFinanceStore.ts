import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PettyCashTransaction,
  EmployeeLoanWithdrawal,
  EmployeeLoanRepayment,
  GarnishmentProfile,
  GarnishmentInstallment,
  Employee,
  EmployeeLoanRequest
} from '@/types/finance';
import { ROLE_PERMISSIONS } from '@/hooks/usePermissions';

interface FinanceStore {
  // Petty Cash
  pettyCashTransactions: PettyCashTransaction[];
  pettyCashBalance: number;
  
  // Employee Loans
  employeeLoanWithdrawals: EmployeeLoanWithdrawal[];
  employeeLoanRepayments: EmployeeLoanRepayment[];
  employeeLoanRequests: EmployeeLoanRequest[];
  
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
  updateEmployeeLoanWithdrawal: (id: string, updates: Partial<EmployeeLoanWithdrawal>) => void;
  addEmployeeLoanRepayment: (repayment: Omit<EmployeeLoanRepayment, 'id' | 'createdAt'>) => void;
  addEmployeeLoanRequest: (request: Omit<EmployeeLoanRequest, 'id' | 'createdAt'>) => void;
  updateEmployeeLoanRequest: (id: string, updates: Partial<EmployeeLoanRequest>) => void;
  getEmployeeTotalOutstandingLoans: (employeeName: string) => number;
  
  addGarnishmentProfile: (profile: Omit<GarnishmentProfile, 'id' | 'createdAt' | 'updatedAt' | 'amountPaidSoFar' | 'balanceRemaining'>) => void;
  updateGarnishmentProfile: (id: string, updates: Partial<GarnishmentProfile>) => void;
  addGarnishmentInstallment: (installment: Omit<GarnishmentInstallment, 'id' | 'createdAt'>) => void;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  resetToDefaultData: () => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      pettyCashTransactions: [],
      pettyCashBalance: 0,
      employeeLoanWithdrawals: [],
      employeeLoanRepayments: [],
      employeeLoanRequests: [],
      garnishmentProfiles: [],
      garnishmentInstallments: [],
      employees: [],

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
        const state = get();
        const totalOutstanding = state.employeeLoanWithdrawals
          .filter(w => w.employee === withdrawal.employee && (w.status === 'approved_manager' || w.status === 'approved_admin'))
          .reduce((sum, w) => sum + w.amount, 0);
        
        const newWithdrawal: EmployeeLoanWithdrawal = {
          ...withdrawal,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          status: 'pending',
          totalOutstandingAtTime: totalOutstanding,
          requiresInterest: (totalOutstanding + withdrawal.amount) > 1000,
        };

        set((state) => ({
          employeeLoanWithdrawals: [...state.employeeLoanWithdrawals, newWithdrawal],
        }));
      },

      updateEmployeeLoanWithdrawal: (id, updates) => {
        set((state) => ({
          employeeLoanWithdrawals: state.employeeLoanWithdrawals.map((withdrawal) =>
            withdrawal.id === id ? { ...withdrawal, ...updates } : withdrawal
          ),
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

      addEmployeeLoanRequest: (request) => {
        const newRequest: EmployeeLoanRequest = {
          ...request,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          status: 'pending',
        };

        set((state) => ({
          employeeLoanRequests: [...state.employeeLoanRequests, newRequest],
        }));
      },

      updateEmployeeLoanRequest: (id, updates) => {
        set((state) => ({
          employeeLoanRequests: state.employeeLoanRequests.map((request) =>
            request.id === id ? { ...request, ...updates } : request
          ),
        }));
      },

      getEmployeeTotalOutstandingLoans: (employeeName) => {
        const state = get();
        return state.employeeLoanWithdrawals
          .filter(w => w.employee === employeeName && (w.status === 'approved_manager' || w.status === 'approved_admin'))
          .reduce((sum, w) => sum + w.amount, 0);
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
      
      resetToDefaultData: () => {
        const state = get();
        const hasData = state.pettyCashTransactions.length > 0 || 
                       state.employeeLoanWithdrawals.length > 0 || 
                       state.employeeLoanRepayments.length > 0 || 
                       state.garnishmentProfiles.length > 0 || 
                       state.employees.length > 0;

        if (hasData) {
          const dataInfo = [
            state.pettyCashTransactions.length > 0 && `${state.pettyCashTransactions.length} petty cash transactions`,
            state.employeeLoanWithdrawals.length > 0 && `${state.employeeLoanWithdrawals.length} loan withdrawals`,
            state.employeeLoanRepayments.length > 0 && `${state.employeeLoanRepayments.length} loan repayments`,
            state.garnishmentProfiles.length > 0 && `${state.garnishmentProfiles.length} garnishment profiles`,
            state.employees.length > 0 && `${state.employees.length} employees`
          ].filter(Boolean).join(', ');

          const confirmed = window.confirm(
            `⚠️ WARNING: This will permanently delete ALL your data!\n\n` +
            `Data to be lost:\n${dataInfo}\n\n` +
            `This action cannot be undone. Are you absolutely sure you want to reset to default data?`
          );

          if (!confirmed) {
            return;
          }

          const doubleConfirm = window.confirm(
            `🚨 FINAL WARNING 🚨\n\n` +
            `You are about to delete ALL your finance data. This is irreversible.\n\n` +
            `Type "RESET" in the prompt to confirm.`
          );

          if (!doubleConfirm) {
            return;
          }

          const userInput = window.prompt('Type "RESET" to confirm data deletion:');
          if (userInput !== 'RESET') {
            alert('Reset cancelled. Your data is safe.');
            return;
          }
        }

        set({
          pettyCashTransactions: [],
          pettyCashBalance: 0,
          employeeLoanWithdrawals: [],
          employeeLoanRepayments: [],
          garnishmentProfiles: [],
          garnishmentInstallments: [],
          employees: [
            {
              id: 'john-doe',
              name: 'John Doe',
              active: true,
              role: 'manager',
              permissions: [...ROLE_PERMISSIONS.manager]
            },
            {
              id: 'sarah-wilson',
              name: 'Sarah Wilson',
              active: true,
              role: 'manager',
              permissions: [...ROLE_PERMISSIONS.manager]
            }
          ]
        });
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