import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type GarnishmentProfile = Tables<'garnishment_profiles'>;

interface StatusManagementButtonsProps {
  profile: GarnishmentProfile;
  onStatusChange?: () => void;
}

export const StatusManagementButtons = ({ profile, onStatusChange }: StatusManagementButtonsProps) => {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
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

      toast({
        title: "Success",
        description: `Garnishment ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully`
      });

      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update garnishment status",
        variant: "destructive"
      });
    }
  };

  if (profile.status === 'completed') {
    return null;
  }

  return (
    <div className="flex gap-2">
      {profile.status === 'active' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('suspended')}
          className="text-orange-600 hover:text-orange-700"
        >
          <Pause className="h-4 w-4 mr-1" />
          Suspend
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('active')}
          className="text-green-600 hover:text-green-700"
        >
          <Play className="h-4 w-4 mr-1" />
          Reactivate
        </Button>
      )}
    </div>
  );
};