import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type GarnishmentProfile = Tables<'garnishment_profiles'>;

interface ComplianceStatusProps {
  profile: GarnishmentProfile;
}

export const ComplianceStatus: React.FC<ComplianceStatusProps> = ({ profile }) => {
  const getComplianceStatus = () => {
    if (!profile.next_due_date) {
      return { status: 'no-date', label: 'No Due Date', variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' };
    }

    const today = new Date();
    const dueDate = new Date(profile.next_due_date);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (profile.status === 'completed') {
      return { status: 'completed', label: 'Completed', variant: 'default' as const, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }

    if (daysDiff < 0) {
      return { status: 'overdue', label: `Overdue (${Math.abs(daysDiff)} days)`, variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (daysDiff <= 3) {
      return { status: 'due-soon', label: `Due in ${daysDiff} days`, variant: 'outline' as const, icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else if (daysDiff <= 14) {
      return { status: 'active', label: 'Active', variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' };
    } else {
      return { status: 'current', label: 'Current', variant: 'secondary' as const, icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const { label, icon: Icon, color } = getComplianceStatus();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
};