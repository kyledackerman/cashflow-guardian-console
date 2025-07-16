import { usePettyCashTransactions } from '@/hooks/usePettyCashTransactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { DollarSign, Download, Upload, Database, User, LogOut, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { balance: pettyCashBalance } = usePettyCashTransactions();
  const { user, signOut } = useSupabaseAuth();

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
          
          {/* Backup functionality removed - now using Supabase as primary data store */}
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.email}</span>
                <Badge variant="default">
                  Authenticated
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          
        </div>
      </div>
    </header>
  );
}