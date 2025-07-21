
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Upload, File, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGarnishmentDocuments } from '@/hooks/useGarnishmentDocuments';
import { Database } from '@/integrations/supabase/types';
import { DocumentList } from './DocumentList';
import { DocumentPreviewModal } from './DocumentPreviewModal';

type GarnishmentDocument = Database['public']['Tables']['garnishment_documents']['Row'];

interface DocumentUploadProps {
  profileId?: string;
  installmentId?: string;
  maxFileSize?: number;
}

export function DocumentUpload({ 
  profileId, 
  installmentId, 
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [previewDocument, setPreviewDocument] = useState<GarnishmentDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const documentCategories = [
    { value: 'court_order', label: 'Court Order' },
    { value: 'service_documentation', label: 'Service Documentation' },
    { value: 'payment_confirmation', label: 'Payment Confirmation' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'other', label: 'Other' }
  ];
  
  const {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
  } = useGarnishmentDocuments();

  // Fetch documents when component mounts or IDs change
  useEffect(() => {
    if (profileId || installmentId) {
      fetchDocuments(profileId, installmentId);
    }
  }, [profileId, installmentId, fetchDocuments]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the maximum size of ${formatFileSize(maxFileSize)}`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of validFiles) {
        await uploadDocument(file, profileId, installmentId, selectedCategory as any);
      }
      
      // Refresh documents after upload
      if (profileId || installmentId) {
        await fetchDocuments(profileId, installmentId);
      }
      setSelectedCategory('other');
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  }, [profileId, installmentId, maxFileSize, uploadDocument, fetchDocuments, selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = ''; // Reset input
  }, [handleFileUpload]);

  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument(documentId);
  };

  const handleDownloadDocument = async (document: GarnishmentDocument) => {
    await downloadDocument(document);
  };

  const handlePreviewDocument = async (document: GarnishmentDocument) => {
    const url = await getDocumentUrl(document.storage_path);
    setPreviewUrl(url);
    setPreviewDocument(document);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Document Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
          >
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images, Word documents up to {formatFileSize(maxFileSize)}
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <DocumentList
          documents={documents}
          onDownload={handleDownloadDocument}
          onDelete={handleDeleteDocument}
          onPreview={handlePreviewDocument}
        />
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
        documentUrl={previewUrl}
      />
    </>
  );
}
