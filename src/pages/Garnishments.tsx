import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GarnishmentProfiles } from '@/components/garnishments/GarnishmentProfiles';
import { GarnishmentProfileForm } from '@/components/garnishments/GarnishmentProfileForm';
import { GarnishmentInstallmentForm } from '@/components/garnishments/GarnishmentInstallmentForm';
import { BulkPaymentForm } from '@/components/garnishments/BulkPaymentForm';
import { CollectionAgencyForm } from '@/components/garnishments/CollectionAgencyForm';
import { CollectionAgenciesList } from '@/components/garnishments/CollectionAgenciesList';

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
              <CardTitle className="flex items-center gap-2">
                Collection Agencies & Law Firms
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Profile incomplete - will complete later
                </div>
              </CardTitle>
              <CardDescription>
                Manage contact information for creditors, law firms, and collection agencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CollectionAgenciesList />
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Add New Organization</h3>
                <CollectionAgencyForm />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}