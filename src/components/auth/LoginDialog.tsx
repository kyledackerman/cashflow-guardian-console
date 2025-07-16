import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const { employees } = useFinanceStore();
  const { login } = useAuth();

  const handleLogin = () => {
    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (selectedEmployee) {
      login(selectedEmployee);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Employee
          </DialogTitle>
          <DialogDescription>
            Choose your employee profile to continue using the finance system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.filter(emp => emp.active).map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-2">
                    <span>{employee.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({employee.role})
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
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};