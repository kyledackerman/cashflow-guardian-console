import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const { employees } = useFinanceStore();
  const { login } = useAuth();

  // Filter to show only managers
  const managers = employees.filter(emp => emp.active && emp.role === 'manager');

  const handleLogin = () => {
    const selectedEmployee = managers.find(emp => emp.id === selectedEmployeeId);
    if (selectedEmployee) {
      login(selectedEmployee);
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manager Login
          </DialogTitle>
          <DialogDescription>
            Login as a manager to access editing and management features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  <div className="flex items-center gap-2">
                    <span>{manager.name}</span>
                    <span className="text-xs text-muted-foreground">
                      (Manager)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleLogin} 
            disabled={!selectedEmployeeId}
            className="w-full"
          >
            Login as Manager
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};