import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  creditor: z.string().min(1, 'Creditor/Case is required'),
  totalAmountOwed: z.number().min(0.01, 'Total amount owed must be greater than 0'),
});

type FormData = z.infer<typeof formSchema>;

export function GarnishmentProfileForm() {
  const { addGarnishmentProfile, employees } = useFinanceStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: '',
      creditor: '',
      totalAmountOwed: 0,
    },
  });

  const onSubmit = (data: FormData) => {
    addGarnishmentProfile({
      employee: data.employee,
      creditor: data.creditor,
      totalAmountOwed: data.totalAmountOwed,
    });

    toast({
      title: 'Garnishment Profile Created',
      description: `Profile created for ${data.employee} - ${data.creditor}.`,
    });

    form.reset({
      employee: '',
      creditor: '',
      totalAmountOwed: 0,
    });
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
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.name}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="creditor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creditor / Case</FormLabel>
                <FormControl>
                  <Input placeholder="Creditor name or case number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalAmountOwed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount Owed</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
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

        <Button type="submit" className="w-full shadow-button">
          Create Garnishment Profile
        </Button>
      </form>
    </Form>
  );
}