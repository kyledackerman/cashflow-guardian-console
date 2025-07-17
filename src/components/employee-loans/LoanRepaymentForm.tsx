import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEmployeeLoanRepayments } from '@/hooks/useEmployeeLoanRepayments';
import { useEmployeeLoanWithdrawals } from '@/hooks/useEmployeeLoanWithdrawals';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  payrollDate: z.date({
    required_error: 'Payroll date is required.',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function LoanRepaymentForm() {
  const { addRepayment, repayments } = useEmployeeLoanRepayments();
  const { withdrawals } = useEmployeeLoanWithdrawals();
  const { users } = useUsers();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: '',
      payrollDate: new Date(),
      amount: 0,
      notes: '',
    },
  });

  // Get employees with outstanding loans
  const usersWithLoans = users.filter(user => {
    const userWithdrawals = withdrawals.filter(w => w.employee_name === user.name);
    const userRepayments = repayments.filter(r => r.employee_name === user.name);
    
    const totalWithdrawn = userWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const totalRepaid = userRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
    const outstandingBalance = totalWithdrawn - totalRepaid;

    return outstandingBalance > 0;
  });

  const selectedEmployee = form.watch('employee');
  const getOutstandingBalance = (employeeName: string) => {
    const employeeWithdrawals = withdrawals.filter(w => w.employee_name === employeeName);
    const employeeRepayments = repayments.filter(r => r.employee_name === employeeName);
    
    const totalWithdrawn = employeeWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const totalRepaid = employeeRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
    
    return totalWithdrawn - totalRepaid;
  };

  const outstandingBalance = selectedEmployee ? getOutstandingBalance(selectedEmployee) : 0;

  const onSubmit = async (data: FormData) => {
    // Validate repayment doesn't exceed outstanding balance
    if (data.amount > outstandingBalance) {
      toast({
        title: 'Invalid Amount',
        description: `Repayment amount cannot exceed outstanding balance of $${outstandingBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    const { error } = await addRepayment({
      employee_name: data.employee,
      payroll_date: data.payrollDate.toISOString().split('T')[0],
      amount: data.amount,
      notes: data.notes || null,
    });

    if (!error) {
      toast({
        title: 'Repayment Recorded',
        description: `$${data.amount.toFixed(2)} repayment recorded for ${data.employee}.`,
      });
    }

    form.reset({
      employee: '',
      payrollDate: new Date(),
      amount: 0,
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usersWithLoans.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No users with outstanding loans
                      </div>
                    ) : (
                      usersWithLoans.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name} - {formatCurrency(getOutstandingBalance(user.name))} outstanding
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payrollDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Payroll Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Amount Repaid
                  {selectedEmployee && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Max: {formatCurrency(outstandingBalance)})
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={outstandingBalance}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedEmployee && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Outstanding Balance for {selectedEmployee}</div>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(outstandingBalance)}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about this repayment" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full shadow-button"
          disabled={!selectedEmployee || outstandingBalance <= 0}
        >
          Record Repayment
        </Button>
      </form>
    </Form>
  );
}