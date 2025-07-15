import { useState } from 'react';
import { PettyCashForm } from '@/components/petty-cash/PettyCashForm';
import { PettyCashTable } from '@/components/petty-cash/PettyCashTable';
import { PettyCashBalance } from '@/components/petty-cash/PettyCashBalance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PettyCash() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Petty Cash Register</h1>
      </div>

      <PettyCashBalance />

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="add">Add Transaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Ledger</CardTitle>
              <CardDescription>
                All petty cash transactions with filtering and approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PettyCashTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Transaction</CardTitle>
              <CardDescription>
                Record a new petty cash credit or debit transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PettyCashForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}