import { useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export function GarnishmentProfiles() {
  const { garnishmentProfiles, garnishmentInstallments } = useFinanceStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProfileWithInstallments = (profileId: string) => {
    const profile = garnishmentProfiles.find(p => p.id === profileId);
    const installments = garnishmentInstallments
      .filter(i => i.profileId === profileId)
      .sort((a, b) => new Date(b.payrollDate).getTime() - new Date(a.payrollDate).getTime());
    
    const nextDueDate = installments.length > 0 
      ? new Date(Math.max(...installments.map(i => new Date(i.payrollDate).getTime())))
      : null;

    return { profile, installments, nextDueDate };
  };

  const selectedProfileData = selectedProfile ? getProfileWithInstallments(selectedProfile) : null;

  const getNextDueDate = (profileId: string) => {
    const installments = garnishmentInstallments
      .filter(i => i.profileId === profileId)
      .sort((a, b) => new Date(b.payrollDate).getTime() - new Date(a.payrollDate).getTime());
    
    if (installments.length === 0) return 'No payments yet';
    
    const lastPayment = installments[0];
    const nextPayment = new Date(lastPayment.payrollDate);
    nextPayment.setDate(nextPayment.getDate() + 14); // Assume bi-weekly payroll
    
    return format(nextPayment, 'MM/dd/yyyy');
  };

  return (
    <>
      <div className="space-y-4">
        {garnishmentProfiles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No garnishment profiles created yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Creditor/Case</TableHead>
                  <TableHead>Total Owed</TableHead>
                  <TableHead>Paid So Far</TableHead>
                  <TableHead>Balance Remaining</TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {garnishmentProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.employee}</TableCell>
                    <TableCell>{profile.creditor}</TableCell>
                    <TableCell>{formatCurrency(profile.totalAmountOwed)}</TableCell>
                    <TableCell className="text-primary">
                      {formatCurrency(profile.amountPaidSoFar)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={profile.balanceRemaining > 0 ? 'destructive' : 'default'}
                        className={profile.balanceRemaining > 0 ? '' : 'bg-success text-success-foreground'}
                      >
                        {formatCurrency(profile.balanceRemaining)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getNextDueDate(profile.id)}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate text-sm">
                        {profile.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProfile(profile.id)}
                      >
                        View Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Garnishment Schedule - {selectedProfileData?.profile?.employee}
            </DialogTitle>
            <DialogDescription>
              Payment schedule and history for {selectedProfileData?.profile?.creditor}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfileData?.profile && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Owed</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(selectedProfileData.profile.totalAmountOwed)}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Paid So Far</div>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(selectedProfileData.profile.amountPaidSoFar)}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Balance Remaining</div>
                  <div className={`text-xl font-bold ${
                    selectedProfileData.profile.balanceRemaining > 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    {formatCurrency(selectedProfileData.profile.balanceRemaining)}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Payments</div>
                  <div className="text-xl font-bold">
                    {selectedProfileData.installments.length}
                  </div>
                </div>
              </div>

              {/* Installment History */}
              {selectedProfileData.installments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installment #</TableHead>
                        <TableHead>Payroll Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Check Number</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProfileData.installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell>#{installment.installmentNumber}</TableCell>
                          <TableCell>
                            {format(new Date(installment.payrollDate), 'MM/dd/yyyy')}
                          </TableCell>
                          <TableCell className="text-primary">
                            {formatCurrency(installment.amount)}
                          </TableCell>
                          <TableCell>{installment.checkNumber || '-'}</TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate text-sm">
                              {installment.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(installment.createdAt), 'MM/dd/yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No payments recorded yet for this garnishment
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}