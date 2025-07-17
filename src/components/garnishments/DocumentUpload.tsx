import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Upload, File, Download, Loader2, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGarnishmentDocuments } from '@/hooks/useGarnishmentDocuments';
import { Database } from '@/integrations/supabase/types';

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
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => 
    filterCategory === 'all' || doc.category === filterCategory
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Document Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Document Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
          <div>
            <label className="text-sm font-medium mb-2 block">Filter Documents</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {filterCategory === 'all' 
                ? `Uploaded Documents (${documents.length})` 
                : `${documentCategories.find(c => c.value === filterCategory)?.label} Documents (${filteredDocuments.length})`
              }
            </h4>
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {document.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {documentCategories.find(c => c.value === document.category)?.label || 'Other'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {document.file_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(document.file_size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(document.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(document)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No documents uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}