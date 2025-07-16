import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useBackupManager } from '@/hooks/useBackupManager';
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
  const { pettyCashBalance, resetToDefaultData } = useFinanceStore();
  const { downloadBackup, restoreFromBackup, getLastBackupTime } = useBackupManager();
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreFromBackup(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const lastBackupTime = getLastBackupTime();
  const formatBackupTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Data Backup</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={downloadBackup}>
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Restore from Backup
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                if (confirm('This will reset all data to default. Are you sure?')) {
                  resetToDefaultData();
                  toast({ title: "Success", description: "Data reset to defaults" });
                }
              }}>
                <Database className="mr-2 h-4 w-4" />
                Reset to Default Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Last backup: {formatBackupTime(lastBackupTime)}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
}