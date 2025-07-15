import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { PettyCashTransaction } from '@/types/finance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PettyCashTable() {
  const { pettyCashTransactions, updatePettyCashTransaction, deletePettyCashTransaction } = useFinanceStore();
  const [filters, setFilters] = useState({
    type: 'all',
    employee: 'all',
    approved: 'all',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    return pettyCashTransactions.filter((transaction) => {
      if (filters.type !== 'all' && transaction.type !== filters.type) return false;
      if (filters.employee !== 'all' && transaction.employee !== filters.employee) return false;
      if (filters.approved === 'approved' && !transaction.approved) return false;
      if (filters.approved === 'pending' && transaction.approved) return false;
      if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
      if (filters.dateTo && transaction.date > filters.dateTo) return false;
      return true;
    });
  }, [pettyCashTransactions, filters]);

  const uniqueEmployees = Array.from(
    new Set(pettyCashTransactions.map(t => t.employee).filter(Boolean))
  );

  const toggleApproval = (transaction: PettyCashTransaction) => {
    updatePettyCashTransaction(transaction.id, { approved: !transaction.approved });
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      employee: 'all',
      approved: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.employee}
          onValueChange={(value) => setFilters(prev => ({ ...prev, employee: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {uniqueEmployees.map((employee) => (
              <SelectItem key={employee} value={employee!}>
                {employee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.approved}
          onValueChange={(value) => setFilters(prev => ({ ...prev, approved: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!filters.dateFrom && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(filters.dateFrom, 'MM/dd') : 'From Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!filters.dateTo && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(filters.dateTo, 'MM/dd') : 'To Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'MM/dd/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.type === 'credit' ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.employee || '-'}</TableCell>
                    <TableCell>{transaction.purpose || '-'}</TableCell>
                    <TableCell>
                      {transaction.approved ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-warning text-warning-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApproval(transaction)}
                        >
                          {transaction.approved ? 'Unapprove' : 'Approve'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePettyCashTransaction(transaction.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}