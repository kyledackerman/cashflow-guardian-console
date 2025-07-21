import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from '@/hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';

const formSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  creditor: z.string().min(1, 'Creditor is required'),
  courtDistrict: z.string().min(1, 'Court district is required'),
  caseNumber: z.string().min(1, 'Case number is required'),
  lawFirm: z.string().min(1, 'Law firm/collection company is required'),
  totalAmountOwed: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function GarnishmentProfileForm() {
  const { employees, loading: employeesLoading } = useEmployees();
  const { addProfile, loading: profilesLoading } = useGarnishmentProfiles();
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: '',
      creditor: '',
      courtDistrict: '',
      caseNumber: '',
      lawFirm: '',
      totalAmountOwed: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const employee = employees.find(e => e.id === data.employee);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const profile = await addProfile({
        employee_id: data.employee,
        employee_name: employee.name,
        creditor: data.creditor,
        court_district: data.courtDistrict,
        case_number: data.caseNumber,
        law_firm: data.lawFirm,
        total_amount_owed: parseFloat(data.totalAmountOwed),
        notes: data.notes || null,
      });

      if (profile.data) {
        setCreatedProfileId(profile.data.id);
        toast({
          title: "Success",
          description: "Garnishment profile created successfully. You can now upload documents.",
        });
        
        form.reset();
      }
    } catch (error: any) {
      console.error('Error creating garnishment profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create garnishment profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (employeesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
        </div>
      </div>
    );
  }

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
                      <SelectItem key={employee.id} value={employee.id}>
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

        {/* Document Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents</label>
          {createdProfileId ? (
            <DocumentUpload profileId={createdProfileId} />
          ) : (
            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
              Create the profile first to upload documents
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Creating Profile...
            </>
          ) : (
            'Create Garnishment Profile'
          )}
        </Button>
      </form>
    </Form>
  );
}