import { useState } from 'react';
import { useEmployeeLoanWithdrawals } from '@/hooks/useEmployeeLoanWithdrawals';
import { useEmployeeLoanRepayments } from '@/hooks/useEmployeeLoanRepayments';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export function EmployeeLoanSummary() {
  const { users } = useUsers();
  const { withdrawals } = useEmployeeLoanWithdrawals();
  const { repayments } = useEmployeeLoanRepayments();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getEmployeeLoanData = () => {
    return employees.map(employee => {
      const employeeWithdrawals = withdrawals.filter(w => w.employee_name === employee.name);
      const employeeRepayments = repayments.filter(r => r.employee_name === employee.name);
      
      const totalWithdrawn = employeeWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const totalRepaid = employeeRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const outstandingBalance = totalWithdrawn - totalRepaid;

      return {
        employee: employee.name,
        totalWithdrawn,
        totalRepaid,
        outstandingBalance,
        withdrawals: employeeWithdrawals,
        repayments: employeeRepayments,
      };
    }).filter(data => data.totalWithdrawn > 0 || data.totalRepaid > 0);
  };

  const employeeLoanData = getEmployeeLoanData();
  const selectedEmployeeData = employeeLoanData.find(data => data.employee === selectedEmployee);

  const getAllTransactions = (employeeName: string) => {
    const employeeWithdrawals = withdrawals
      .filter(w => w.employee_name === employeeName)
      .map(w => ({ ...w, type: 'withdrawal' as const }));
    
    const employeeRepayments = repayments
      .filter(r => r.employee_name === employeeName)
      .map(r => ({ ...r, type: 'repayment' as const, date: r.payroll_date }));

    return [...employeeWithdrawals, ...employeeRepayments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  return (
    <>
      <div className="space-y-4">
        {employeeLoanData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No employee loans recorded yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Withdrawn</TableHead>
                  <TableHead>Total Repaid</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeLoanData.map((data) => (
                  <TableRow key={data.employee}>
                    <TableCell className="font-medium">{data.employee}</TableCell>
                    <TableCell className="text-destructive">
                      {formatCurrency(data.totalWithdrawn)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrency(data.totalRepaid)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={data.outstandingBalance > 0 ? 'destructive' : 'default'}
                        className={data.outstandingBalance > 0 ? '' : 'bg-success text-success-foreground'}
                      >
                        {formatCurrency(data.outstandingBalance)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(data.employee)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan History - {selectedEmployee}</DialogTitle>
            <DialogDescription>
              Complete transaction history for this employee
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployeeData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Withdrawn</div>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(selectedEmployeeData.totalWithdrawn)}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Repaid</div>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(selectedEmployeeData.totalRepaid)}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                  <div className={`text-2xl font-bold ${
                    selectedEmployeeData.outstandingBalance > 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    {formatCurrency(selectedEmployeeData.outstandingBalance)}
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAllTransactions(selectedEmployee).map((transaction, index) => (
                      <TableRow key={`${transaction.type}-${transaction.id}`}>
                        <TableCell>
                          {format(new Date(transaction.date), 'MM/dd/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'withdrawal' ? 'destructive' : 'default'}>
                            {transaction.type === 'withdrawal' ? 'Withdrawal' : 'Repayment'}
                          </Badge>
                        </TableCell>
                        <TableCell className={
                          transaction.type === 'withdrawal' ? 'text-destructive' : 'text-success'
                        }>
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                        <TableCell>
                          {transaction.type === 'withdrawal' && 'due_date' in transaction
                            ? format(new Date(transaction.due_date), 'MM/dd/yyyy')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}