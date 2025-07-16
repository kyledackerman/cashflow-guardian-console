import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, File, Download } from 'lucide-react';
import { GarnishmentDocument } from '@/types/ui';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  documents: GarnishmentDocument[];
  onDocumentsChange: (documents: GarnishmentDocument[]) => void;
  maxFileSize?: number; // in MB
}

export function DocumentUpload({ 
  documents, 
  onDocumentsChange, 
  maxFileSize = 5 
}: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload PDF or image files.`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than ${maxFileSize}MB. Please choose a smaller file.`,
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const newDocument: GarnishmentDocument = {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          base64Data,
          uploadDate: new Date(),
        };

        onDocumentsChange([...documents, newDocument]);
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`
        });
      };
      reader.readAsDataURL(file);
    });
  }, [documents, onDocumentsChange, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  }, [handleFileUpload]);

  const removeDocument = useCallback((documentId: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== documentId));
    toast({
      title: "Document removed",
      description: "The document has been removed successfully."
    });
  }, [documents, onDocumentsChange]);

  const downloadDocument = useCallback((document: GarnishmentDocument) => {
    const link = window.document.createElement('a');
    link.href = document.base64Data;
    link.download = document.fileName;
    link.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to select
          </p>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>Choose Files</span>
            </Button>
          </Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">
            PDF, JPG, PNG, GIF up to {maxFileSize}MB each
          </p>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Uploaded Documents</Label>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)} • {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doc.fileType.split('/')[1].toUpperCase()}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
