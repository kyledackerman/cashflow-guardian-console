
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, User, FileText } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type GarnishmentDocument = Database['public']['Tables']['garnishment_documents']['Row'];

interface DocumentPreviewModalProps {
  document: GarnishmentDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (document: GarnishmentDocument) => void;
  documentUrl?: string | null;
}

const documentCategories = [
  { value: 'court_order', label: 'Court Order' },
  { value: 'service_documentation', label: 'Service Documentation' },
  { value: 'payment_confirmation', label: 'Payment Confirmation' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
];

export function DocumentPreviewModal({ 
  document, 
  open, 
  onOpenChange, 
  onDownload,
  documentUrl 
}: DocumentPreviewModalProps) {
  if (!document) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreview = document.file_type.includes('image') || document.file_type.includes('pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.file_name}
          </DialogTitle>
          <DialogDescription>
            Document preview and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {documentCategories.find(c => c.value === document.category)?.label || 'Other'}
                </Badge>
                <Badge variant="outline">
                  {document.file_type.split('/')[1]?.toUpperCase() || document.file_type}
                </Badge>
                <Badge variant="outline">
                  {formatFileSize(document.file_size)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Uploaded {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Uploaded by system
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => onDownload(document)} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="space-y-2">
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                {document.description}
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Preview</h4>
            <div className="border rounded-lg p-4 bg-background">
              {canPreview && documentUrl ? (
                <div className="w-full">
                  {document.file_type.includes('image') ? (
                    <img 
                      src={documentUrl} 
                      alt={document.file_name}
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  ) : document.file_type.includes('pdf') ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-96 rounded-lg"
                      title={document.file_name}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-2" />
                  <p>Preview not available for this file type</p>
                  <p className="text-sm">Download the file to view its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
