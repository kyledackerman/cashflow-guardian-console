import { useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
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
                {garnishmentProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.employee}</TableCell>
                    <TableCell>{profile.creditor}</TableCell>
                    <TableCell className="text-sm max-w-[100px] truncate">{profile.courtDistrict}</TableCell>
                    <TableCell className="text-sm">{profile.caseNumber}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{profile.lawFirm}</TableCell>
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
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {profile.attachments?.length || 0}
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
              Garnishment Schedule - {selectedProfileData?.profile?.employee}
            </DialogTitle>
            <DialogDescription>
              {selectedProfileData?.profile?.creditor} • Case: {selectedProfileData?.profile?.caseNumber}
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
                      <span className="font-medium">{selectedProfileData.profile.employee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creditor:</span>
                      <span className="font-medium">{selectedProfileData.profile.creditor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Court District:</span>
                      <span className="font-medium">{selectedProfileData.profile.courtDistrict}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Case Number:</span>
                      <span className="font-medium">{selectedProfileData.profile.caseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Law Firm:</span>
                      <span className="font-medium">{selectedProfileData.profile.lawFirm}</span>
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
                      <span className="font-bold">{formatCurrency(selectedProfileData.profile.totalAmountOwed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-bold text-primary">{formatCurrency(selectedProfileData.profile.amountPaidSoFar)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className={`font-bold ${selectedProfileData.profile.balanceRemaining > 0 ? 'text-destructive' : 'text-success'}`}>
                        {formatCurrency(selectedProfileData.profile.balanceRemaining)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Payments:</span>
                      <span className="font-medium">{selectedProfileData.installments.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              {selectedProfileData.profile.attachments && selectedProfileData.profile.attachments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Profile Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProfileData.profile.attachments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{doc.fileName}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const link = window.document.createElement('a');
                              link.href = doc.base64Data;
                              link.download = doc.fileName;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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