import { useState } from 'react';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Download, FileText } from 'lucide-react';

export function GarnishmentProfiles() {
  const { profiles } = useGarnishmentProfiles();
  const { installments } = useGarnishmentInstallments();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProfileWithInstallments = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const profileInstallments = installments
      .filter(i => i.profile_id === profileId)
      .sort((a, b) => new Date(b.payroll_date).getTime() - new Date(a.payroll_date).getTime());
    
    const nextDueDate = profileInstallments.length > 0 
      ? new Date(Math.max(...profileInstallments.map(i => new Date(i.payroll_date).getTime())))
      : null;

    return { profile, installments: profileInstallments, nextDueDate };
  };

  const selectedProfileData = selectedProfile ? getProfileWithInstallments(selectedProfile) : null;

  const getNextDueDate = (profileId: string) => {
    const profileInstallments = installments
      .filter(i => i.profile_id === profileId)
      .sort((a, b) => new Date(b.payroll_date).getTime() - new Date(a.payroll_date).getTime());
    
    if (profileInstallments.length === 0) return 'No payments yet';
    
    const lastPayment = profileInstallments[0];
    const nextPayment = new Date(lastPayment.payroll_date);
    nextPayment.setDate(nextPayment.getDate() + 14); // Assume bi-weekly payroll
    
    return format(nextPayment, 'MM/dd/yyyy');
  };

  return (
    <>
      <div className="space-y-4">
        {profiles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No garnishment profiles created yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Creditor</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Law Firm</TableHead>
                  <TableHead>Total Owed</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.employee_name}</TableCell>
                    <TableCell>{profile.creditor}</TableCell>
                    <TableCell className="text-sm max-w-[100px] truncate">{profile.court_district}</TableCell>
                    <TableCell className="text-sm">{profile.case_number}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{profile.law_firm}</TableCell>
                    <TableCell>{formatCurrency(Number(profile.total_amount_owed))}</TableCell>
                    <TableCell className="text-primary">
                      {formatCurrency(Number(profile.amount_paid_so_far))}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={Number(profile.balance_remaining || 0) > 0 ? 'destructive' : 'default'}
                        className={Number(profile.balance_remaining || 0) > 0 ? '' : 'bg-success text-success-foreground'}
                      >
                        {formatCurrency(Number(profile.balance_remaining || 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        0
                      </Badge>
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
              Garnishment Schedule - {selectedProfileData?.profile?.employee_name}
            </DialogTitle>
            <DialogDescription>
              {selectedProfileData?.profile?.creditor} • Case: {selectedProfileData?.profile?.case_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfileData?.profile && (
            <div className="space-y-6">
              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employee:</span>
                      <span className="font-medium">{selectedProfileData.profile.employee_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creditor:</span>
                      <span className="font-medium">{selectedProfileData.profile.creditor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Court District:</span>
                      <span className="font-medium">{selectedProfileData.profile.court_district}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Case Number:</span>
                      <span className="font-medium">{selectedProfileData.profile.case_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Law Firm:</span>
                      <span className="font-medium">{selectedProfileData.profile.law_firm}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Owed:</span>
                      <span className="font-bold">{formatCurrency(Number(selectedProfileData.profile.total_amount_owed))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-bold text-primary">{formatCurrency(Number(selectedProfileData.profile.amount_paid_so_far))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className={`font-bold ${Number(selectedProfileData.profile.balance_remaining || 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                        {formatCurrency(Number(selectedProfileData.profile.balance_remaining || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Payments:</span>
                      <span className="font-medium">{selectedProfileData.installments.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents - Note: Document handling needs to be implemented for Supabase Storage */}

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
                          <TableCell>#{installment.installment_number}</TableCell>
                          <TableCell>
                            {format(new Date(installment.payroll_date), 'MM/dd/yyyy')}
                          </TableCell>
                          <TableCell className="text-primary">
                            {formatCurrency(Number(installment.amount))}
                          </TableCell>
                          <TableCell>{installment.check_number || '-'}</TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate text-sm">
                              {installment.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(installment.created_at), 'MM/dd/yyyy')}
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