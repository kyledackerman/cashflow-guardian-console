import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';

interface AuditTrailProps {
  recordId: string;
  tableName: string;
}

export const AuditTrail = ({ recordId, tableName }: AuditTrailProps) => {
  const { auditLogs, loading } = useAuditLogs(recordId, tableName);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No audit records found.</p>
        </CardContent>
      </Card>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatChanges = (oldValues: any, newValues: any, action: string) => {
    if (action === 'INSERT') {
      return 'Record created';
    }
    if (action === 'DELETE') {
      return 'Record deleted';
    }
    
    if (!oldValues || !newValues) return 'Record updated';
    
    const changes: string[] = [];
    Object.keys(newValues).forEach(key => {
      if (oldValues[key] !== newValues[key] && key !== 'updated_at') {
        changes.push(`${key}: ${oldValues[key]} → ${newValues[key]}`);
      }
    });
    
    return changes.length > 0 ? changes.join(', ') : 'Record updated';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className={getActionColor(log.action)}>
                  {log.action}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              <div className="text-sm">
                {formatChanges(log.old_values, log.new_values, log.action)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};