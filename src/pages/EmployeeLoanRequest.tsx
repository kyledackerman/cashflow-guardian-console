import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEmployeeLoanRequests } from '@/hooks/useEmployeeLoanRequests';
import { useEmployeeLoanWithdrawals } from '@/hooks/useEmployeeLoanWithdrawals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const formSchema = z.object({
  employee: z.string().min(1, 'Employee name is required'),
  requestedAmount: z.number().min(1, 'Amount must be greater than $0'),
  purpose: z.string().min(1, 'Purpose is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function EmployeeLoanRequest() {
  const { addRequest } = useEmployeeLoanRequests();
  const { getEmployeeOutstandingLoans } = useEmployeeLoanWithdrawals();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: '',
      requestedAmount: 0,
      purpose: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const totalOutstanding = getEmployeeOutstandingLoans(data.employee);
    const willExceedLimit = (totalOutstanding + data.requestedAmount) > 1000;

    const { error } = await addRequest({
      employee_name: data.employee,
      requested_amount: data.requestedAmount,
      purpose: data.purpose,
      request_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: willExceedLimit ? 'REQUIRES INTEREST - Exceeds $1,000 limit' : null,
    });

    if (!error) {
      toast({
        title: "Loan Request Submitted",
        description: `Your request for $${data.requestedAmount.toFixed(2)} has been submitted for approval.`,
      });

      form.reset();
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">Request Submitted Successfully!</CardTitle>
            <CardDescription className="text-center">
              Your loan request has been submitted and is pending approval from management.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setIsSubmitted(false)}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Employee Loan Request</CardTitle>
          <CardDescription>
            Submit a request for an interest-free employee loan. Loans are subject to approval and company policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Important:</strong> Loans up to $1,000 per employee are interest-free. 
              Amounts exceeding $1,000 will require interest charges and special approval.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your name exactly as it appears in company records
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="5000"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount you wish to borrow (maximum $5,000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Loan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please explain why you need this loan..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear explanation for your loan request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Submit Loan Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}