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
      return { status: 'no-date', label: 'No Due Date', variant: 'secondary' as const, icon: Clock };
    }

    const today = new Date();
    const dueDate = new Date(profile.next_due_date);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (profile.status === 'completed') {
      return { status: 'completed', label: 'Completed', variant: 'default' as const, icon: CheckCircle };
    }

    if (daysDiff < 0) {
      return { status: 'overdue', label: `Overdue (${Math.abs(daysDiff)} days)`, variant: 'destructive' as const, icon: XCircle };
    } else if (daysDiff <= 14) {
      // Active - on schedule for next 2 weeks (green)
      return { status: 'active', label: 'Active', variant: 'default' as const, icon: CheckCircle };
    } else {
      return { status: 'current', label: 'Current', variant: 'secondary' as const, icon: Clock };
    }
  };

  const { label, variant, icon: Icon } = getComplianceStatus();

  return (
    <Badge 
      variant={variant} 
      className={`flex items-center gap-1 ${
        variant === 'default' && label === 'Active' ? 'bg-success text-success-foreground' : 
        variant === 'default' && label === 'Completed' ? 'bg-success text-success-foreground' : ''
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};