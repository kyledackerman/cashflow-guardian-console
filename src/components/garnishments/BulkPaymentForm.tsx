import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import { useBulkPaymentBatches } from '@/hooks/useBulkPaymentBatches';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';

interface BulkPaymentEntry {
  employeeName: string;
  amount: number;
  checkNumber?: string;
  notes?: string;
  profileId?: string;
  valid: boolean;
  error?: string;
}

export const BulkPaymentForm = () => {
  const [payrollDate, setPayrollDate] = useState('');
  const [notes, setNotes] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [payments, setPayments] = useState<BulkPaymentEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [validated, setValidated] = useState(false);

  const { toast } = useToast();
  const { profiles } = useGarnishmentProfiles();
  const { addInstallment } = useGarnishmentInstallments();
  const { createBatch } = useBulkPaymentBatches();
  const { users } = useUsers();

  const downloadTemplate = () => {
    const csvContent = 'Employee Name,Amount,Check Number,Notes\nJohn Doe,100.00,1234,Payment notes\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_payment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    if (!headers.includes('Employee Name') || !headers.includes('Amount')) {
      toast({
        title: "Error",
        description: "CSV must contain 'Employee Name' and 'Amount' columns",
        variant: "destructive"
      });
      return;
    }

    const paymentEntries: BulkPaymentEntry[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const employeeName = values[headers.indexOf('Employee Name')];
      const amountStr = values[headers.indexOf('Amount')];
      const checkNumber = values[headers.indexOf('Check Number')] || '';
      const notes = values[headers.indexOf('Notes')] || '';

      if (!employeeName || !amountStr) continue;

      const amount = parseFloat(amountStr);
      const entry: BulkPaymentEntry = {
        employeeName,
        amount,
        checkNumber,
        notes,
        valid: false
      };

      paymentEntries.push(entry);
    }

    setPayments(paymentEntries);
    setValidated(false);
  };

  const validatePayments = () => {
    const activeProfiles = profiles.filter(p => p.status === 'active');
    
    const validatedPayments = payments.map(payment => {
      const profile = activeProfiles.find(p => 
        p.employee_name.toLowerCase() === payment.employeeName.toLowerCase()
      );

      if (!profile) {
        return {
          ...payment,
          valid: false,
          error: 'No active garnishment profile found'
        };
      }

      if (payment.amount <= 0) {
        return {
          ...payment,
          valid: false,
          error: 'Amount must be greater than 0'
        };
      }

      if (payment.amount > (profile.balance_remaining || 0)) {
        return {
          ...payment,
          valid: false,
          error: `Amount exceeds remaining balance of $${profile.balance_remaining}`
        };
      }

      return {
        ...payment,
        profileId: profile.id,
        valid: true
      };
    });

    setPayments(validatedPayments);
    setValidated(true);

    const validCount = validatedPayments.filter(p => p.valid).length;
    const invalidCount = validatedPayments.length - validCount;

    toast({
      title: "Validation Complete",
      description: `${validCount} valid payments, ${invalidCount} invalid payments`
    });
  };

  const processBulkPayments = async () => {
    if (!payrollDate) {
      toast({
        title: "Error",
        description: "Please select a payroll date",
        variant: "destructive"
      });
      return;
    }

    const validPayments = payments.filter(p => p.valid);
    if (validPayments.length === 0) {
      toast({
        title: "Error",
        description: "No valid payments to process",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Create batch record
      const { data: { user } } = await supabase.auth.getUser();
      const currentEmployee = employees.find(e => e.id === user?.id);
      const batchData = {
        created_by_name: currentEmployee?.name || 'Unknown User',
        batch_date: payrollDate,
        total_amount: validPayments.reduce((sum, p) => sum + p.amount, 0),
        total_payments: validPayments.length,
        notes: notes || null
      };

      const { data: batch, error: batchError } = await createBatch(batchData);
      if (batchError || !batch) {
        throw new Error('Failed to create batch record');
      }

      // Process each payment
      let successCount = 0;
      for (const payment of validPayments) {
        const profile = profiles.find(p => p.id === payment.profileId);
        if (!profile) continue;

        const installmentData = {
          profile_id: payment.profileId!,
          employee_id: profile.employee_id,
          employee_name: payment.employeeName,
          payroll_date: payrollDate,
          amount: payment.amount,
          installment_number: (profile.amount_paid_so_far / payment.amount) + 1,
          check_number: payment.checkNumber || null,
          notes: payment.notes || null,
          batch_id: batch.id
        };

        const { error } = await addInstallment(installmentData);
        if (!error) {
          successCount++;
        }
      }

      toast({
        title: "Success",
        description: `Processed ${successCount} of ${validPayments.length} payments successfully`
      });

      // Reset form
      setPayments([]);
      setValidated(false);
      setCsvFile(null);
      setPayrollDate('');
      setNotes('');

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk payments",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = payments.filter(p => p.valid).reduce((sum, p) => sum + p.amount, 0);
  const validCount = payments.filter(p => p.valid).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bulk Payment Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payrollDate">Payroll Date</Label>
              <Input
                id="payrollDate"
                type="date"
                value={payrollDate}
                onChange={(e) => setPayrollDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Batch Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes for this batch"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            {payments.length > 0 && !validated && (
              <Button onClick={validatePayments}>
                Validate Payments
              </Button>
            )}
            {validated && validCount > 0 && (
              <Button onClick={processBulkPayments} disabled={processing}>
                {processing ? 'Processing...' : `Process ${validCount} Payments`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Preview</CardTitle>
            {validated && (
              <Alert>
                <AlertDescription>
                  {validCount} valid payments totaling ${totalAmount.toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Check #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{payment.employeeName}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.checkNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={payment.valid ? "default" : "destructive"}>
                        {payment.valid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.error || payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};