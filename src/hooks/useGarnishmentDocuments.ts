import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type GarnishmentDocument = Database['public']['Tables']['garnishment_documents']['Row'];
type GarnishmentDocumentInsert = Database['public']['Tables']['garnishment_documents']['Insert'];

export const useGarnishmentDocuments = () => {
  const [documents, setDocuments] = useState<GarnishmentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async (profileId?: string, installmentId?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('garnishment_documents').select('*');
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      if (installmentId) {
        query = query.eq('installment_id', installmentId);
      }
      
      const { data, error } = await query.order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    profileId?: string,
    installmentId?: string,
    category?: string,
    description?: string
  ): Promise<GarnishmentDocument | null> => {
    try {
      setUploading(true);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload documents",
          variant: "destructive"
        });
        return null;
      }
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('garnishment-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in database with proper uploaded_by field
      const documentData: GarnishmentDocumentInsert = {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadData.path,
        profile_id: profileId || null,
        installment_id: installmentId || null,
        category: (category as any) || 'other',
        description: description || null,
        uploaded_by: user.id
      };

      const { data: dbData, error: dbError } = await supabase
        .from('garnishment_documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('garnishment-documents')
          .remove([filePath]);
        throw dbError;
      }

      // Log document upload for audit trail
      await supabase.rpc('log_admin_action', {
        action_type: 'DOCUMENT_UPLOAD',
        table_name: 'garnishment_documents',
        record_id: dbData.id,
        new_data: {
          file_name: file.name,
          category: category || 'other',
          profile_id: profileId,
          installment_id: installmentId,
          description
        }
      });

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      return dbData;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document: " + error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      // Get document details first
      const { data: document, error: fetchError } = await supabase
        .from('garnishment_documents')
        .select('storage_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('garnishment-documents')
        .remove([document.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('garnishment_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      // Log document deletion for audit trail
      await supabase.rpc('log_admin_action', {
        action_type: 'DOCUMENT_DELETE',
        table_name: 'garnishment_documents',
        record_id: documentId,
        old_data: { storage_path: document.storage_path }
      });

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getDocumentUrl = async (storagePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('garnishment-documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const downloadDocument = async (document: GarnishmentDocument) => {
    try {
      const url = await getDocumentUrl(document.storage_path);
      if (!url) throw new Error('Failed to get document URL');

      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('garnishment_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garnishment_documents'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as GarnishmentDocument, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => prev.map(doc => 
              doc.id === payload.new.id ? payload.new as GarnishmentDocument : doc
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    documents,
    loading,
    uploading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
  };
};