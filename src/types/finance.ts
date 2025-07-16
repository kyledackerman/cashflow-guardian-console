export interface PettyCashTransaction {
  id: string;
  date: Date;
  amount: number;
  type: 'credit' | 'debit';
  employee?: string;
  purpose?: string; // Keep for backward compatibility
  notes?: string;
  approved: boolean;
  createdAt: Date;
}

export interface EmployeeLoanWithdrawal {
  id: string;
  employee: string;
  date: Date;
  amount: number;
  notes?: string;
  approvedBy: string;
  dueDate: Date;
  createdAt: Date;
}

export interface EmployeeLoanRepayment {
  id: string;
  employee: string;
  payrollDate: Date;
  amount: number;
  notes?: string;
  createdAt: Date;
}

export interface GarnishmentProfile {
  id: string;
  employee: string;
  creditor: string;
  totalAmountOwed: number;
  amountPaidSoFar: number;
  balanceRemaining: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GarnishmentInstallment {
  id: string;
  profileId: string;
  employee: string;
  payrollDate: Date;
  installmentNumber: number;
  amount: number;
  checkNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
  role: 'employee' | 'manager';
  permissions: Permission[];
}

export type Permission = 
  | 'VIEW_FINANCES' 
  | 'EDIT_TRANSACTIONS' 
  | 'DELETE_RECORDS' 
  | 'MANAGE_EMPLOYEES' 
  | 'APPROVE_TRANSACTIONS';