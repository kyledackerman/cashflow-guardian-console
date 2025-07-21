import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, Globe, MapPin, Edit, Trash2 } from 'lucide-react';
import { useCollectionAgencies } from '@/hooks/useCollectionAgencies';
import { Skeleton } from '@/components/ui/skeleton';

export function CollectionAgenciesList() {
  const { agencies, loading, deleteAgency } = useCollectionAgencies();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAgency(id);
    } finally {
      setDeletingId(null);
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

  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-center mb-2">No agencies or law firms added yet</h3>
          <p className="text-muted-foreground text-center">
            Use the form below to add your first collection agency or law firm.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Existing Organizations ({agencies.length})</h3>
      </div>
      
      <div className="grid gap-4">
        {agencies.map((agency) => (
          <Card key={agency.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {agency.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={agency.type === 'law_firm' ? 'default' : 'secondary'}>
                      {agency.type === 'law_firm' ? 'Law Firm' : 'Collection Agency'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(agency.id)}
                    disabled={deletingId === agency.id}
                  >
                    {deletingId === agency.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {agency.contact_person && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Contact:</span>
                    <span>{agency.contact_person}</span>
                  </div>
                )}
                
                {agency.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.phone}</span>
                  </div>
                )}
                
                {agency.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.email}</span>
                  </div>
                )}
                
                {agency.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {agency.website}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Address */}
              {(agency.address_line1 || agency.city || agency.state) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {agency.address_line1 && <div>{agency.address_line1}</div>}
                    {agency.address_line2 && <div>{agency.address_line2}</div>}
                    {(agency.city || agency.state || agency.zip_code) && (
                      <div>
                        {agency.city && agency.city}
                        {agency.state && `, ${agency.state}`}
                        {agency.zip_code && ` ${agency.zip_code}`}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {agency.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span>
                  <p className="text-muted-foreground mt-1">{agency.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}