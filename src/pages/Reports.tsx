import React, { useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Download, TrendingUp, Users, DollarSign, Calendar, FileText, Scale } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import { usePettyCashTransactions } from '@/hooks/usePettyCashTransactions';
import { useEmployeeLoanWithdrawals } from '@/hooks/useEmployeeLoanWithdrawals';
import { useEmployeeLoanRepayments } from '@/hooks/useEmployeeLoanRepayments';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function Reports() {
  const [exportPeriod, setExportPeriod] = useState('current-month');
  const { toast } = useToast();
  
  const { profiles } = useGarnishmentProfiles();
  const { installments } = useGarnishmentInstallments();
  const { transactions } = usePettyCashTransactions();
  const { withdrawals } = useEmployeeLoanWithdrawals();
  const { repayments } = useEmployeeLoanRepayments();

  // Calculate summary metrics
  const activeGarnishments = profiles.filter(p => p.status === 'active').length;
  const totalGarnishmentAmount = profiles.reduce((sum, p) => sum + Number(p.total_amount_owed || 0), 0);
  const totalPaid = profiles.reduce((sum, p) => sum + Number(p.amount_paid_so_far || 0), 0);
  const remainingBalance = profiles.reduce((sum, p) => sum + Number(p.balance_remaining || 0), 0);
  
  const totalLoansOutstanding = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0) - 
                               repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const now = new Date();
    return transactionDate.getMonth() === now.getMonth() && 
           transactionDate.getFullYear() === now.getFullYear();
  });
  
  const monthlyPettyCashTotal = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Generate payment schedule projections
  const generatePaymentProjections = () => {
    const projections = [];
    const activeProfiles = profiles.filter(p => p.status === 'active' && Number(p.balance_remaining || 0) > 0);
    
    for (let i = 0; i < 12; i++) {
      const projectionDate = addMonths(new Date(), i);
      const monthKey = format(projectionDate, 'yyyy-MM');
      
      // Estimate monthly payments based on recent payment patterns
      const recentInstallments = installments.filter(inst => {
        const instDate = new Date(inst.payroll_date);
        const threeMonthsAgo = addMonths(new Date(), -3);
        return instDate >= threeMonthsAgo;
      });
      
      const avgMonthlyPayment = recentInstallments.length > 0 
        ? recentInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0) / 3
        : 0;
      
      projections.push({
        month: format(projectionDate, 'MMM yyyy'),
        estimatedPayments: avgMonthlyPayment,
        activeProfiles: activeProfiles.length,
        projectedBalance: Math.max(0, remainingBalance - (avgMonthlyPayment * (i + 1)))
      });
    }
    
    return projections;
  };

  const paymentProjections = generatePaymentProjections();

  // Export functionality
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available for the selected period.",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filename} has been downloaded.`
    });
  };

  const exportGarnishmentReport = () => {
    const reportData = profiles.map(profile => ({
      'User Name': profile.employee_name,
      'Creditor': profile.creditor,
      'Case Number': profile.case_number,
      'Total Amount': Number(profile.total_amount_owed || 0),
      'Amount Paid': Number(profile.amount_paid_so_far || 0),
      'Balance Remaining': Number(profile.balance_remaining || 0),
      'Status': profile.status,
      'Court District': profile.court_district,
      'Law Firm': profile.law_firm || '',
      'Created Date': format(new Date(profile.created_at), 'yyyy-MM-dd')
    }));
    
    exportToCSV(reportData, 'garnishment_report');
  };

  const exportPaymentHistory = () => {
    const reportData = installments.map(installment => ({
      'User Name': installment.employee_name,
      'Payroll Date': format(new Date(installment.payroll_date), 'yyyy-MM-dd'),
      'Amount': Number(installment.amount),
      'Installment Number': installment.installment_number,
      'Check Number': installment.check_number || '',
      'Recorded By': installment.recorded_by_name || '',
      'Notes': installment.notes || ''
    }));
    
    exportToCSV(reportData, 'payment_history');
  };

  const exportLoanReport = () => {
    const reportData = withdrawals.map(withdrawal => ({
      'User Name': withdrawal.employee_name,
      'Date': format(new Date(withdrawal.date), 'yyyy-MM-dd'),
      'Amount': Number(withdrawal.amount),
      'Status': withdrawal.status,
      'Due Date': withdrawal.due_date ? format(new Date(withdrawal.due_date), 'yyyy-MM-dd') : '',
      'Notes': withdrawal.notes || ''
    }));
    
    exportToCSV(reportData, 'loan_report');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Financial Summary</h1>
          <p className="text-muted-foreground">
            Comprehensive financial reports and payment tracking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={exportPeriod} onValueChange={setExportPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Export period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Garnishments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGarnishments}</div>
            <p className="text-xs text-muted-foreground">
              {profiles.length} total profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Garnishment Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGarnishmentAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPaid)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across all active garnishments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLoansOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Employee loan balances
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projections">Payment Projections</TabsTrigger>
          <TabsTrigger value="exports">Export Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Payment Projections</CardTitle>
              <CardDescription>
                Estimated garnishment payments based on recent payment patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Estimated Payments</TableHead>
                      <TableHead>Active Profiles</TableHead>
                      <TableHead>Projected Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentProjections.map((projection, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{projection.month}</TableCell>
                        <TableCell>{formatCurrency(projection.estimatedPayments)}</TableCell>
                        <TableCell>{projection.activeProfiles}</TableCell>
                        <TableCell>{formatCurrency(projection.projectedBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Garnishment Report
                </CardTitle>
                <CardDescription>
                  Complete garnishment profiles with balances and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportGarnishmentReport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Garnishments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  All garnishment installment payments with details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportPaymentHistory} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Payments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Loan Report
                </CardTitle>
                <CardDescription>
                  Employee loan withdrawals and current balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportLoanReport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Loans
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Petty Cash Report
                </CardTitle>
                <CardDescription>
                  Monthly petty cash transactions and balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    const reportData = currentMonthTransactions.map(transaction => ({
                      'Date': format(new Date(transaction.date), 'yyyy-MM-dd'),
                      'Type': transaction.type,
                      'Amount': Number(transaction.amount),
                      'User': transaction.employee_name || 'N/A',
                      'Purpose': transaction.purpose || '',
                      'Approved': transaction.approved ? 'Yes' : 'No',
                      'Notes': transaction.notes || ''
                    }));
                    exportToCSV(reportData, 'petty_cash_report');
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Petty Cash
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Summary Report
                </CardTitle>
                <CardDescription>
                  High-level financial summary across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    const summaryData = [{
                      'Report Date': format(new Date(), 'yyyy-MM-dd'),
                      'Active Garnishments': activeGarnishments,
                      'Total Garnishment Amount': totalGarnishmentAmount,
                      'Amount Paid So Far': totalPaid,
                      'Outstanding Balance': remainingBalance,
                      'Outstanding Loans': totalLoansOutstanding,
                      'Monthly Petty Cash': monthlyPettyCashTotal
                    }];
                    exportToCSV(summaryData, 'financial_summary');
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Summary
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Court Evidence Reports
                </CardTitle>
                <CardDescription>
                  Generate PDF court documents for legal proceedings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• Payment History Reports</p>
                  <p>• Balance Certification Letters</p>
                  <p>• Affidavit Templates</p>
                </div>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Court Reports Available",
                      description: "Navigate to Garnishments page and view any profile details to access court report generator."
                    });
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View in Garnishments
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}