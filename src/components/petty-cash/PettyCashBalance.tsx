import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export function PettyCashBalance() {
  const { pettyCashBalance, pettyCashTransactions } = useFinanceStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const approvedTransactions = pettyCashTransactions.filter(t => t.approved);
  const pendingTransactions = pettyCashTransactions.filter(t => !t.approved);
  
  const totalCredits = approvedTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalDebits = approvedTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(pettyCashBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalCredits)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(totalDebits)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-warning font-bold">{pendingTransactions.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-warning">
                {pendingTransactions.length} transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}