import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import type { Tables } from '@/integrations/supabase/types';

type GarnishmentInstallment = Tables<'garnishment_installments'>;

interface InstallmentEditDialogProps {
  installment: GarnishmentInstallment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileBalance: number;
  profileAmountPaid: number;
}

export const InstallmentEditDialog = ({ 
  installment, 
  open, 
  onOpenChange,
  profileBalance,
  profileAmountPaid
}: InstallmentEditDialogProps) => {
  const [amount, setAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateInstallment } = useGarnishmentInstallments();
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && installment) {
      setAmount(installment.amount.toString());
      setCheckNumber(installment.check_number || '');
      setNotes(installment.notes || '');
    } else {
      setAmount('');
      setCheckNumber('');
      setNotes('');
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    if (!installment) return;

    const newAmount = parseFloat(amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Calculate new balance after this edit
    const amountDifference = newAmount - installment.amount;
    const newBalance = profileBalance - amountDifference;

    if (newBalance < 0) {
      toast({
        title: "Error",
        description: "This amount would exceed the total owed amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateInstallment(installment.id, {
        amount: newAmount,
        check_number: checkNumber || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      });

      if (!error) {
        handleOpenChange(false);
        toast({
          title: "Success",
          description: "Installment updated successfully"
        });
      }
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Installment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <Label htmlFor="checkNumber">Check Number (Optional)</Label>
            <Input
              id="checkNumber"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder="Enter check number"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};