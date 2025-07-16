import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const { employees } = useFinanceStore();
  const { login } = useAuth();
  const { toast } = useToast();

  // Filter to show only managers
  const managers = employees.filter(emp => emp.active && emp.role === 'manager');

  const handleLogin = () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select a manager to login",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedEmployee = managers.find(emp => emp.id === selectedEmployeeId);
      if (selectedEmployee) {
        login(selectedEmployee);
        toast({
          title: "Success",
          description: `Welcome back, ${selectedEmployee.name}!`
        });
        onOpenChange?.(false);
      } else {
        toast({
          title: "Error",
          description: "Selected manager not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
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
          {managers.length === 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                No managers found. You may need to add a manager first from the Employees page.
              </p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Debug: Found {managers.length} manager(s): {managers.map(m => m.name).join(', ') || 'None'}
          </div>
          
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