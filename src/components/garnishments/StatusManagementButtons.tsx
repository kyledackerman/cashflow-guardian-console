import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';

type GarnishmentProfile = Tables<'garnishment_profiles'>;

interface StatusManagementButtonsProps {
  profile: GarnishmentProfile;
  onStatusChange?: () => void;
}

export const StatusManagementButtons = ({ profile, onStatusChange }: StatusManagementButtonsProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

  const handleStatusChange = async (newStatus: string, reason: string) => {
    try {
      // Validate status transitions
      if (profile.status === 'completed') {
        toast({
          title: "Error",
          description: "Cannot change status of completed garnishments",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('garnishment_profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Log the manual status change for audit trail
      await supabase.rpc('log_admin_action', {
        action_type: 'MANUAL_STATUS_CHANGE',
        table_name: 'garnishment_profiles',
        record_id: profile.id,
        old_data: { status: profile.status },
        new_data: { status: newStatus, reason: reason }
      });

      toast({
        title: "Success",
        description: `Garnishment ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully`
      });

      setIsDialogOpen(false);
      setReason('');
      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update garnishment status",
        variant: "destructive"
      });
    }
  };

  const openStatusDialog = (newStatus: string) => {
    setPendingStatus(newStatus);
    setIsDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the status change",
        variant: "destructive"
      });
      return;
    }
    handleStatusChange(pendingStatus, reason);
  };

  if (profile.status === 'completed') {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        {profile.status === 'active' ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openStatusDialog('suspended')}
                className="text-orange-600 hover:text-orange-700"
              >
                <Pause className="h-4 w-4 mr-1" />
                Suspend
              </Button>
            </DialogTrigger>
          </Dialog>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openStatusDialog('active')}
                className="text-green-600 hover:text-green-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Reactivate
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'suspended' ? 'Suspend' : 'Reactivate'} Garnishment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Status Change (Required for Audit Trail)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for this status change..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStatusChange}>
                Confirm {pendingStatus === 'suspended' ? 'Suspension' : 'Reactivation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};