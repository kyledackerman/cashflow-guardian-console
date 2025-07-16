import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Receipt, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const { 
    pettyCashBalance, 
    pettyCashTransactions,
    employeeLoanWithdrawals,
    employeeLoanRepayments,
    garnishmentProfiles 
  } = useFinanceStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate total outstanding loans
  const totalLoansOutstanding = employeeLoanWithdrawals.reduce((total, withdrawal) => {
    const repayments = employeeLoanRepayments
      .filter(r => r.employee === withdrawal.employee)
      .reduce((sum, r) => sum + r.amount, 0);
    return total + (withdrawal.amount - repayments);
  }, 0);

  // Calculate total garnishments remaining
  const totalGarnishmentsRemaining = garnishmentProfiles.reduce((total, profile) => {
    return total + profile.balanceRemaining;
  }, 0);

  // Get pending transactions count
  const pendingTransactions = pettyCashTransactions.filter(t => !t.approved).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CashFlow Guard+</h1>
          <p className="text-muted-foreground">Internal Finance Console Dashboard</p>
        </div>
        <Button 
          onClick={() => navigate('/loan-request')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <FileText className="h-4 w-4 mr-2" />
          Employee Loan Request
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petty Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(pettyCashBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingTransactions} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Loans</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totalLoansOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garnishments</CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalGarnishmentsRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {garnishmentProfiles.length} active profiles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managed</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(pettyCashBalance + totalLoansOutstanding + totalGarnishmentsRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all systems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Petty Cash Register</CardTitle>
            <CardDescription>
              Manage company-wide petty cash transactions and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Current balance: {formatCurrency(pettyCashBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Employee Loans</CardTitle>
            <CardDescription>
              Track loan withdrawals and repayments by employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Outstanding: {formatCurrency(totalLoansOutstanding)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Wage Garnishments</CardTitle>
            <CardDescription>
              Schedule and track garnishment payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {garnishmentProfiles.length} active garnishments
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
