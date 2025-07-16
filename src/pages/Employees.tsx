import { useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Search, Users, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/finance';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ROLE_PERMISSIONS } from '@/hooks/usePermissions';

export default function Employees() {
  const { employees, addEmployee, updateEmployee, employeeLoanWithdrawals, employeeLoanRepayments, garnishmentProfiles } = useFinanceStore();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Check if there are any managers in the system (active or inactive)
  const hasAnyManagers = employees.some(emp => emp.role === 'manager');
  const hasActiveManagers = employees.some(emp => emp.active && emp.role === 'manager');
  const inactiveManagerCount = employees.filter(emp => !emp.active && emp.role === 'manager').length;
  const canAddEmployees = user !== null; // Allow authenticated users to manage employees
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true, role: 'employee' as 'employee' | 'manager' | 'admin' });

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeStats = (employeeId: string) => {
    const withdrawals = employeeLoanWithdrawals.filter(w => w.employee === employeeId);
    const repayments = employeeLoanRepayments.filter(r => r.employee === employeeId);
    const garnishments = garnishmentProfiles.filter(g => g.employee === employeeId);
    
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
    const activeGarnishments = garnishments.filter(g => g.balanceRemaining > 0).length;
    
    return {
      loanBalance: totalWithdrawn - totalRepaid,
      activeGarnishments,
      totalGarnishmentBalance: garnishments.reduce((sum, g) => sum + g.balanceRemaining, 0)
    };
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Employee name is required", variant: "destructive" });
      return;
    }

    const employeeData = {
      ...formData,
      permissions: [...ROLE_PERMISSIONS[formData.role]],
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
      toast({ title: "Success", description: "Employee updated successfully" });
      setEditingEmployee(null);
    } else {
      addEmployee(employeeData);
      toast({ title: "Success", description: "Employee added successfully" });
    }

    setFormData({ name: '', active: true, role: 'employee' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({ name: employee.name, active: employee.active, role: employee.role || 'employee' });
    setIsAddDialogOpen(true);
  };

  const handleToggleStatus = (employee: Employee) => {
    updateEmployee(employee.id, { active: !employee.active });
    toast({ 
      title: "Success", 
      description: `Employee ${employee.active ? 'deactivated' : 'activated'} successfully` 
    });
  };

  const resetForm = () => {
    setFormData({ name: '', active: true, role: 'employee' });
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Manage employee records and view financial summaries</p>
          {!hasAnyManagers && (
            <Badge variant="outline" className="mt-2">
              Bootstrap Mode: Add your first manager to get started
            </Badge>
          )}
          {hasAnyManagers && !hasActiveManagers && (
            <Badge variant="secondary" className="mt-2">
              No active managers ({inactiveManagerCount} inactive manager{inactiveManagerCount !== 1 ? 's' : ''})
            </Badge>
          )}
        </div>
        {canAddEmployees && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Employee Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(active) => setFormData({ ...formData, active })}
                />
                <Label htmlFor="active">Active Employee</Label>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'employee' | 'manager' | 'admin') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Overview
          </CardTitle>
          <CardDescription>
            Total Employees: {employees.length} | Active: {employees.filter(e => e.active).length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Loan Balance</TableHead>
                  <TableHead>Active Garnishments</TableHead>
                  <TableHead>Garnishment Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const stats = getEmployeeStats(employee.id);
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === 'employee' ? "outline" : "default"}>
                        {employee.role === 'admin' ? 'Admin' : employee.role === 'manager' ? 'Manager' : 'Employee'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.active ? "default" : "secondary"}>
                        {employee.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stats.loanBalance > 0 ? (
                        <span className="text-destructive font-medium">
                          ${stats.loanBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0.00</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stats.activeGarnishments > 0 ? (
                        <Badge variant="outline">{stats.activeGarnishments}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stats.totalGarnishmentBalance > 0 ? (
                        <span className="text-destructive font-medium">
                          ${stats.totalGarnishmentBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0.00</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canAddEmployees && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(employee)}
                            >
                              {employee.active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No employees found matching your search.' : 'No employees found. Add your first employee to get started.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}