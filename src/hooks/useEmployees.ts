import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Employee = Tables<'employees'>;
type EmployeeInsert = TablesInsert<'employees'>;
type EmployeeUpdate = TablesUpdate<'employees'>;

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch employees: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employee: EmployeeInsert) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Employee added successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add employee: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateEmployee = async (id: string, updates: EmployeeUpdate) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prev => prev.map(emp => emp.id === id ? data : emp));
      toast({
        title: "Success",
        description: "Employee updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update employee: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete employee: " + error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchEmployees();

    // Set up real-time subscription
    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees
  };
};