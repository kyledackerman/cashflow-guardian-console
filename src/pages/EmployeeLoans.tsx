import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeLoanSummary } from '@/components/employee-loans/EmployeeLoanSummary';
import { LoanWithdrawalForm } from '@/components/employee-loans/LoanWithdrawalForm';
import { LoanRepaymentForm } from '@/components/employee-loans/LoanRepaymentForm';

export default function EmployeeLoans() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Employee Loan Tracker</h1>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Loan Summary</TabsTrigger>
          <TabsTrigger value="withdrawal">New Withdrawal</TabsTrigger>
          <TabsTrigger value="repayment">Add Repayment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Loan Summary</CardTitle>
              <CardDescription>
                Outstanding balances and loan history by employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeLoanSummary />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdrawal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Loan Withdrawal</CardTitle>
              <CardDescription>
                Record a new loan withdrawal for an employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanWithdrawalForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="repayment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Repayment</CardTitle>
              <CardDescription>
                Record a loan repayment from payroll deduction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanRepaymentForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}