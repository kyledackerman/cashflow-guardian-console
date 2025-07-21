import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GarnishmentProfiles } from '@/components/garnishments/GarnishmentProfiles';
import { GarnishmentProfileForm } from '@/components/garnishments/GarnishmentProfileForm';
import { GarnishmentInstallmentForm } from '@/components/garnishments/GarnishmentInstallmentForm';
import { BulkPaymentForm } from '@/components/garnishments/BulkPaymentForm';
import { CollectionAgencyForm } from '@/components/garnishments/CollectionAgencyForm';

export default function Garnishments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Wage Garnishment Tracker</h1>
      </div>

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profiles">Active Garnishments</TabsTrigger>
          <TabsTrigger value="create">Create Profile</TabsTrigger>
          <TabsTrigger value="installment">Add Installment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Payments</TabsTrigger>
          <TabsTrigger value="agencies">Law Firms & Agencies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Garnishments</CardTitle>
              <CardDescription>
                Current garnishment profiles and their payment schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GarnishmentProfiles />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Garnishment Profile</CardTitle>
              <CardDescription>
                Set up a new garnishment profile for an employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GarnishmentProfileForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="installment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Installment Payment</CardTitle>
              <CardDescription>
                Record a garnishment payment from payroll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GarnishmentInstallmentForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkPaymentForm />
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Agencies & Law Firms</CardTitle>
              <CardDescription>
                Manage contact information for creditors, law firms, and collection agencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionAgencyForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}