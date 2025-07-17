import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useEmployeeLoanWithdrawals } from '@/hooks/useEmployeeLoanWithdrawals';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Users() {
  const { users, addUser, updateUser } = useUsers();
  const { withdrawals } = useEmployeeLoanWithdrawals();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveUser = async (user: any) => {
    if (editingUser) {
      await updateUser(editingUser.id, user);
      setEditingUser(null);
    } else {
      await addUser(user);
      setShowAddForm(false);
    }
  };

  // Calculate outstanding loans for each user
  const usersWithLoans = users.map(user => {
    const userWithdrawals = withdrawals.filter(w => w.employee_id === user.id);
    const totalWithdrawn = userWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    
    return {
      ...user,
      outstandingLoan: totalWithdrawn
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setShowAddForm(true)}>
          Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Outstanding Loan</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithLoans.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>${user.outstandingLoan.toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => setEditingUser(user)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            user={editingUser} 
            onSave={handleSaveUser} 
            onCancel={() => setEditingUser(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user record
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            onSave={handleSaveUser} 
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({ user, onSave, onCancel }: { user?: any; onSave: (user: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || 'user',
    active: user?.active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}