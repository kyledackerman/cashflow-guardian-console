import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  date: z.date({
    required_error: 'Date is required.',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['credit', 'debit']),
  employee: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  approved: z.boolean().default(false),
}).refine((data) => {
  // Purpose is required for debit transactions
  if (data.type === 'debit' && (!data.purpose || data.purpose.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Purpose is required for debit transactions",
  path: ["purpose"],
});

type FormData = z.infer<typeof formSchema>;

export function PettyCashForm() {
  const { addPettyCashTransaction, employees } = useFinanceStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      type: 'debit',
      employee: 'none',
      purpose: '',
      notes: '',
      approved: false,
    },
  });

  const watchedType = form.watch('type');

  const onSubmit = (data: FormData) => {
    addPettyCashTransaction({
      date: data.date,
      amount: data.amount,
      type: data.type,
      employee: data.employee === 'none' ? undefined : data.employee,
      purpose: data.purpose || undefined,
      notes: data.notes || undefined,
      approved: data.approved,
    });

    toast({
      title: 'Transaction Added',
      description: `${data.type === 'credit' ? 'Credit' : 'Debit'} of $${data.amount.toFixed(2)} has been recorded.`,
    });

    form.reset({
      date: new Date(),
      amount: 0,
      type: 'debit',
      employee: 'none',
      purpose: '',
      notes: '',
      approved: false,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal h-10',
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
                <FormLabel>Amount</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedType === 'debit' && (
            <FormField
              control={form.control}
              name="employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
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
          )}
        </div>

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose {watchedType === 'debit' ? '(Required)' : '(Optional)'}</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of transaction" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this transaction" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="approved"
          render={({ field }) => (
            <FormItem className={cn(
              "flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all duration-200",
              "border-primary/30 bg-card"
            )}>
              <div className="space-y-0.5">
                <FormLabel className="text-base">Approved</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this transaction as approved (affects balance calculation)
                </div>
              </div>
              <FormControl>
                <div className="relative">
                  <SwitchPrimitives.Root
                    className={cn(
                      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                      field.value 
                        ? "bg-green-600 data-[state=checked]:bg-green-600" 
                        : "bg-red-600 data-[state=unchecked]:bg-red-600"
                    )}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  >
                    <SwitchPrimitives.Thumb
                      className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                    />
                  </SwitchPrimitives.Root>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full shadow-button">
          Add Transaction
        </Button>
      </form>
    </Form>
  );
}