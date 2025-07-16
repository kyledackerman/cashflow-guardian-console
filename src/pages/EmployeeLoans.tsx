import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmployeeLoanSummary } from '@/components/employee-loans/EmployeeLoanSummary';
import { LoanWithdrawalForm } from '@/components/employee-loans/LoanWithdrawalForm';
import { LoanRepaymentForm } from '@/components/employee-loans/LoanRepaymentForm';
import { ExternalLink, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeLoans() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Employee Loan Tracker</h1>
        <Button 
          onClick={() => navigate('/loan-request')}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Employee Request Form
        </Button>
      </div>

      <Alert className="border-primary bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Employee Loan Requests:</strong> Share the link{' '}
          <code className="px-1 py-0.5 bg-muted rounded text-xs">/loan-request</code>{' '}
          with employees to submit loan requests. Requests over $500 require manager approval, and over $1,000 include interest.
        </AlertDescription>
      </Alert>

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