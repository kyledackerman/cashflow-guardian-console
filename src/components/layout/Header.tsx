import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

export function Header() {
  const { pettyCashBalance } = useFinanceStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
            Finance Dashboard
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant="secondary" 
            className="bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Petty Cash: {formatCurrency(pettyCashBalance)}
          </Badge>
        </div>
      </div>
    </header>
  );
}