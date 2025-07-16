import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import { useEmployees } from '@/hooks/useEmployees';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  profileId: z.string().min(1, 'Garnishment profile is required'),
  payrollDate: z.date({
    required_error: 'Payroll date is required.',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  checkNumber: z.string().min(1, 'Check number is required'),
  recordedBy: z.string().min(1, 'Recorded by is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function GarnishmentInstallmentForm() {
  const { profiles } = useGarnishmentProfiles();
  const { installments, addInstallment } = useGarnishmentInstallments();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  // Only managers and admins can access this form
  const managersAndAdmins = employees.filter(emp => 
    emp.role === 'manager' || emp.role === 'admin'
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: '',
      payrollDate: new Date(),
      amount: 0,
      checkNumber: undefined,
      recordedBy: '',
      notes: '',
    },
  });

  // Get active profiles (with remaining balance)
  const activeProfiles = profiles.filter(profile => Number(profile.balance_remaining || 0) > 0);

  const selectedProfileId = form.watch('profileId');
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // Get next installment number for selected profile
  const getNextInstallmentNumber = (profileId: string) => {
    const profileInstallments = installments.filter(i => i.profile_id === profileId);
    return profileInstallments.length + 1;
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedProfile) return;

    const remainingBalance = Number(selectedProfile.balance_remaining || 0);
    
    // Validate amount doesn't exceed remaining balance
    if (data.amount > remainingBalance) {
      toast({
        title: 'Invalid Amount',
        description: `Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    const installmentNumber = getNextInstallmentNumber(data.profileId);

    const { error } = await addInstallment({
      profile_id: data.profileId,
      employee_name: selectedProfile.employee_name,
      payroll_date: data.payrollDate.toISOString().split('T')[0],
      installment_number: installmentNumber,
      amount: data.amount,
      check_number: data.checkNumber,
      recorded_by_name: data.recordedBy,
      notes: data.notes || null,
    });

    if (!error) {
      toast({
        title: 'Installment Added',
        description: `Payment #${installmentNumber} of $${data.amount.toFixed(2)} recorded for ${selectedProfile.employee_name}.`,
      });
    }

    form.reset({
      profileId: '',
      payrollDate: new Date(),
      amount: 0,
      checkNumber: undefined,
      recordedBy: '',
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
            name="profileId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Garnishment Profile</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select garnishment profile" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeProfiles.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No active garnishments found
                      </div>
                    ) : (
                      activeProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.employee_name} - {profile.creditor} ({formatCurrency(Number(profile.balance_remaining || 0))} remaining)
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
                  Installment Amount
                  {selectedProfile && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Max: {formatCurrency(Number(selectedProfile.balance_remaining || 0))})
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedProfile ? Number(selectedProfile.balance_remaining || 0) : undefined}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recordedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recorded By</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager/admin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {managersAndAdmins.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No managers or admins found
                      </div>
                    ) : (
                      managersAndAdmins.map((employee) => (
                        <SelectItem key={employee.id} value={employee.name}>
                          {employee.name} ({employee.role})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="checkNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter check or reference number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        {selectedProfile && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Employee</div>
              <div className="font-medium">{selectedProfile.employee_name}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Next Installment #</div>
              <div className="font-medium">#{getNextInstallmentNumber(selectedProfile.id)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Balance Remaining</div>
              <div className="font-bold text-destructive">
                {formatCurrency(Number(selectedProfile.balance_remaining || 0))}
              </div>
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
                <Textarea placeholder="Additional notes about this payment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full shadow-button"
          disabled={!selectedProfile}
        >
          Add Installment Payment
        </Button>
      </form>
    </Form>
  );
}