import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, Globe, MapPin, Edit, Trash2, Scale, FileText, DollarSign } from 'lucide-react';
import { useGarnishmentProfiles } from '@/hooks/useGarnishmentProfiles';
import { Skeleton } from '@/components/ui/skeleton';

export function CollectionAgenciesList() {
  const { profiles, loading, deleteProfile } = useGarnishmentProfiles();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create summary data from garnishment profiles
  const summaryData = profiles.reduce((acc, profile) => {
    // Add creditors
    if (profile.creditor && !acc.creditors.some(c => c.name === profile.creditor)) {
      acc.creditors.push({
        name: profile.creditor,
        type: 'Creditor',
        cases: profiles.filter(p => p.creditor === profile.creditor).length,
        totalOwed: profiles.filter(p => p.creditor === profile.creditor).reduce((sum, p) => sum + Number(p.total_amount_owed || 0), 0)
      });
    }
    
    // Add law firms
    if (profile.law_firm && !acc.lawFirms.some(lf => lf.name === profile.law_firm)) {
      acc.lawFirms.push({
        name: profile.law_firm,
        type: 'Law Firm',
        cases: profiles.filter(p => p.law_firm === profile.law_firm).length,
        totalOwed: profiles.filter(p => p.law_firm === profile.law_firm).reduce((sum, p) => sum + Number(p.total_amount_owed || 0), 0)
      });
    }
    
    // Add court districts
    if (profile.court_district && !acc.courts.some(c => c.name === profile.court_district)) {
      acc.courts.push({
        name: profile.court_district,
        type: 'Court District',
        cases: profiles.filter(p => p.court_district === profile.court_district).length,
        totalOwed: profiles.filter(p => p.court_district === profile.court_district).reduce((sum, p) => sum + Number(p.total_amount_owed || 0), 0)
      });
    }
    
    return acc;
  }, { creditors: [] as any[], lawFirms: [] as any[], courts: [] as any[] });

  const allEntities = [...summaryData.creditors, ...summaryData.lawFirms, ...summaryData.courts];

  const handleEntityClick = (entity: any) => {
    // Filter profiles that match this entity
    const relatedProfiles = profiles.filter(profile => {
      switch (entity.type) {
        case 'Creditor': return profile.creditor === entity.name;
        case 'Law Firm': return profile.law_firm === entity.name;
        case 'Court District': return profile.court_district === entity.name;
        default: return false;
      }
    });
    
    console.log(`Clicked ${entity.type}: ${entity.name}`, relatedProfiles);
    // TODO: Navigate to detailed view or show modal with related profiles
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProfile(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Creditor': return DollarSign;
      case 'Law Firm': return Scale;
      case 'Court District': return Building2;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allEntities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-center mb-2">No garnishment data available</h3>
          <p className="text-muted-foreground text-center">
            Add garnishment profiles to see creditors, law firms, and court districts here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {allEntities.map((entity, index) => {
          const IconComponent = getIcon(entity.type);
          return (
            <Card key={`${entity.type}-${entity.name}-${index}`} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEntityClick(entity)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {entity.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={entity.type === 'Law Firm' ? 'default' : entity.type === 'Creditor' ? 'secondary' : 'outline'}>
                        {entity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Active Cases:</span>
                    <span>{entity.cases}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total Owed:</span>
                    <span className="font-semibold">{formatCurrency(entity.totalOwed)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}