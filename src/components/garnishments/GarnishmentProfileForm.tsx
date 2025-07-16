import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { toast } from '@/hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';
import { GarnishmentDocument } from '@/types/finance';

const formSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  creditor: z.string().min(1, 'Creditor is required'),
  courtDistrict: z.string().min(1, 'Court district is required'),
  caseNumber: z.string().min(1, 'Case number is required'),
  lawFirm: z.string().min(1, 'Law firm/collection company is required'),
  totalAmountOwed: z.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function GarnishmentProfileForm() {
  const { employees, addGarnishmentProfile } = useFinanceStore();
  const [documents, setDocuments] = useState<GarnishmentDocument[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: '',
      creditor: '',
      courtDistrict: '',
      caseNumber: '',
      lawFirm: '',
      totalAmountOwed: 0,
      notes: '',
    },
  });

  const onSubmit = (data: FormData) => {
    addGarnishmentProfile({
      employee: data.employee,
      creditor: data.creditor,
      courtDistrict: data.courtDistrict,
      caseNumber: data.caseNumber,
      lawFirm: data.lawFirm,
      totalAmountOwed: data.totalAmountOwed,
      notes: data.notes,
      attachments: documents,
    });
    
    toast({
      title: "Garnishment Profile Created",
      description: `Profile for ${data.employee} has been created successfully.`,
    });

    form.reset();
    setDocuments([]);
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
                <FormLabel>Original Creditor</FormLabel>
                <FormControl>
                  <Input placeholder="Enter original creditor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtDistrict"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Court District</FormLabel>
                <FormControl>
                  <Input placeholder="Enter court district information" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter legal case number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lawFirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Law Firm / Collection Company</FormLabel>
                <FormControl>
                  <Input placeholder="Enter law firm or collection company name" {...field} />
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes or comments"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DocumentUpload
          documents={documents}
          onDocumentsChange={setDocuments}
        />

        <Button type="submit" className="w-full">
          Create Garnishment Profile
        </Button>
      </form>
    </Form>
  );
}