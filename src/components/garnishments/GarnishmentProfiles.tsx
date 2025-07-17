import { useState, useMemo } from 'react';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { useGarnishmentInstallments } from '@/hooks/useGarnishmentInstallments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Download, FileText, Search, Filter, X, Eye, Edit } from 'lucide-react';
import { StatusManagementButtons } from './StatusManagementButtons';
import { InstallmentEditDialog } from './InstallmentEditDialog';
import { AuditTrail } from './AuditTrail';

export function GarnishmentProfiles() {
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useGarnishmentProfiles();
  const { installments, loading: installmentsLoading } = useGarnishmentInstallments();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');

  // Filtering and search logic
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = searchTerm === '' || 
        profile.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.creditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.law_firm.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || profile.status === statusFilter;

      const balance = Number(profile.balance_remaining || 0);
      const matchesBalance = balanceFilter === 'all' ||
        (balanceFilter === 'paid' && balance <= 0) ||
        (balanceFilter === 'outstanding' && balance > 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });
  }, [profiles, searchTerm, statusFilter, balanceFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBalanceFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || balanceFilter !== 'all';

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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Creditor</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Case #</TableHead>
              <TableHead>Law Firm</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Owed</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (profilesLoading || installmentsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee, creditor, case number, or law firm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={balanceFilter} onValueChange={setBalanceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Balance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Balances</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="paid">Paid Off</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profiles.length} profiles
            {hasActiveFilters && <span className="text-primary"> (filtered)</span>}
          </div>
          
          {filteredProfiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total Outstanding: {formatCurrency(
                filteredProfiles.reduce((sum, profile) => sum + Number(profile.balance_remaining || 0), 0)
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 space-y-2">
            {profiles.length === 0 ? (
              <>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg">No garnishment profiles created yet</p>
                <p className="text-sm">Create your first profile to get started</p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg">No profiles match your search</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-md border animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Creditor</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Law Firm</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Owed</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className="hover-scale">
                    <TableCell className="font-medium">{profile.employee_name}</TableCell>
                    <TableCell>{profile.creditor}</TableCell>
                    <TableCell className="text-sm max-w-[100px] truncate">{profile.court_district}</TableCell>
                    <TableCell className="text-sm">{profile.case_number}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{profile.law_firm}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={profile.status === 'completed' ? 'default' : profile.status === 'suspended' ? 'secondary' : 'destructive'}
                        className={profile.status === 'completed' ? 'bg-success text-success-foreground' : ''}
                      >
                        {profile.status || 'active'}
                      </Badge>
                    </TableCell>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProfile(profile.id)}
                          className="hover-scale"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <StatusManagementButtons 
                          profile={profile} 
                          onStatusChange={refetchProfiles}
                        />
                      </div>
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
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={selectedProfileData.profile.status === 'completed' ? 'default' : selectedProfileData.profile.status === 'suspended' ? 'secondary' : 'destructive'}
                        className={selectedProfileData.profile.status === 'completed' ? 'bg-success text-success-foreground' : ''}
                      >
                        {selectedProfileData.profile.status || 'active'}
                      </Badge>
                    </div>
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
                         <TableHead>Actions</TableHead>
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
                           <TableCell>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setEditingInstallment(installment)}
                             >
                               <Edit className="h-4 w-4 mr-1" />
                               Edit
                             </Button>
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

               {selectedProfileData && (
                 <div className="mt-6">
                   <AuditTrail 
                     recordId={selectedProfileData.profile.id} 
                     tableName="garnishment_profiles" 
                   />
                 </div>
               )}
             </div>
           )}
         </DialogContent>
       </Dialog>

       <InstallmentEditDialog
         installment={editingInstallment}
         open={!!editingInstallment}
         onOpenChange={(open) => !open && setEditingInstallment(null)}
         profileBalance={selectedProfileData?.profile.balance_remaining || 0}
         profileAmountPaid={selectedProfileData?.profile.amount_paid_so_far || 0}
       />
     </>
   );
 }