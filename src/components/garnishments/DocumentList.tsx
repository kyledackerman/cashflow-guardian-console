
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Trash2, 
  File, 
  Calendar, 
  User,
  Filter,
  Eye,
  FileText,
  Image,
  FileX
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type GarnishmentDocument = Database['public']['Tables']['garnishment_documents']['Row'];

interface DocumentListProps {
  documents: GarnishmentDocument[];
  onDownload: (document: GarnishmentDocument) => void;
  onDelete: (documentId: string) => void;
  onPreview?: (document: GarnishmentDocument) => void;
}

const documentCategories = [
  { value: 'court_order', label: 'Court Order' },
  { value: 'service_documentation', label: 'Service Documentation' },
  { value: 'payment_confirmation', label: 'Payment Confirmation' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
];

export function DocumentList({ documents, onDownload, onDelete, onPreview }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      
      const matchesType = typeFilter === 'all' || doc.file_type.includes(typeFilter);

      return matchesSearch && matchesCategory && matchesType;
    });

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'date':
        default:
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      }
    });

    return filtered;
  }, [documents, searchTerm, categoryFilter, typeFilter, sortBy]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const getFileTypeOptions = () => {
    const types = [...new Set(documents.map(doc => doc.file_type))];
    return types.map(type => ({
      value: type,
      label: type.split('/')[1]?.toUpperCase() || type
    }));
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-center mb-2">No documents uploaded</h3>
          <p className="text-muted-foreground text-center">
            Upload documents to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Document Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {documentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getFileTypeOptions().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Upload Date</SelectItem>
                <SelectItem value="name">File Name</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredAndSortedDocuments.length} of {documents.length} documents
            </span>
            {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid gap-4">
        {filteredAndSortedDocuments.map((document) => {
          const FileIcon = getFileIcon(document.file_type);
          return (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileIcon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-base">
                        {document.file_name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {documentCategories.find(c => c.value === document.category)?.label || 'Other'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {document.file_type.split('/')[1]?.toUpperCase() || document.file_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(document.file_size)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Uploaded by system
                        </div>
                      </div>

                      {document.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(document)}
                        className="h-8 w-8 p-0"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(document)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(document.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedDocuments.length === 0 && documents.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-center mb-2">No documents match your search</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
