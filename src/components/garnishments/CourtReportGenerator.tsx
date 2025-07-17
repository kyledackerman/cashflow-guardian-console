import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Tables } from '@/integrations/supabase/types';

type GarnishmentProfile = Tables<'garnishment_profiles'>;
type GarnishmentInstallment = Tables<'garnishment_installments'>;

interface CourtReportGeneratorProps {
  profile: GarnishmentProfile;
  installments: GarnishmentInstallment[];
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const CourtReportGenerator: React.FC<CourtReportGeneratorProps> = ({
  profile,
  installments
}) => {
  const { toast } = useToast();

  const generatePaymentHistoryReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(16);
    doc.text('OFFICIAL PAYMENT HISTORY REPORT', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${currentDate}`, 20, 30);
    doc.text(`Case Number: ${profile.case_number}`, 20, 40);
    doc.text(`Employee: ${profile.employee_name}`, 20, 50);
    doc.text(`Creditor: ${profile.creditor}`, 20, 60);
    doc.text(`Court District: ${profile.court_district}`, 20, 70);
    
    // Summary
    doc.text('PAYMENT SUMMARY:', 20, 90);
    doc.text(`Total Amount Owed: $${profile.total_amount_owed}`, 20, 100);
    doc.text(`Amount Paid to Date: $${profile.amount_paid_so_far}`, 20, 110);
    doc.text(`Balance Remaining: $${profile.balance_remaining}`, 20, 120);
    doc.text(`Status: ${profile.status?.toUpperCase()}`, 20, 130);
    
    // Payment history table
    const tableData = installments
      .sort((a, b) => new Date(a.payroll_date).getTime() - new Date(b.payroll_date).getTime())
      .map(installment => [
        new Date(installment.payroll_date).toLocaleDateString(),
        installment.installment_number.toString(),
        `$${installment.amount}`,
        installment.check_number || 'N/A',
        installment.recorded_by_name || 'Unknown'
      ]);

    doc.autoTable({
      startY: 140,
      head: [['Payment Date', 'Installment #', 'Amount', 'Check #', 'Recorded By']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.text('This document is certified as accurate and complete.', 20, pageHeight - 30);
    doc.text('_________________________', 20, pageHeight - 20);
    doc.text('Authorized Signature', 20, pageHeight - 10);
    
    doc.save(`Payment_History_${profile.case_number}_${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "Report Generated",
      description: "Payment history report has been downloaded."
    });
  };

  const generateBalanceCertification = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(16);
    doc.text('BALANCE CERTIFICATION LETTER', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 20, 40);
    
    // Body
    const letterBody = [
      '',
      'TO WHOM IT MAY CONCERN:',
      '',
      `This letter serves as official certification of the current balance status`,
      `for the garnishment case referenced below:`,
      '',
      `Case Number: ${profile.case_number}`,
      `Employee: ${profile.employee_name}`,
      `Creditor: ${profile.creditor}`,
      `Court District: ${profile.court_district}`,
      '',
      `BALANCE INFORMATION AS OF ${currentDate.toUpperCase()}:`,
      `• Original Amount Owed: $${profile.total_amount_owed}`,
      `• Total Amount Paid: $${profile.amount_paid_so_far}`,
      `• Current Balance Remaining: $${profile.balance_remaining}`,
      `• Current Status: ${profile.status?.toUpperCase()}`,
      '',
      `This certification is issued in accordance with our records and is`,
      `accurate as of the date shown above.`,
      '',
      '',
      'Sincerely,',
      '',
      '',
      '_________________________',
      'Authorized Representative',
      'Payroll Department'
    ];
    
    let yPosition = 60;
    letterBody.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    doc.save(`Balance_Certification_${profile.case_number}_${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "Certification Generated",
      description: "Balance certification letter has been downloaded."
    });
  };

  const generateAffidavit = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(16);
    doc.text('AFFIDAVIT OF PAYMENT RECORDS', 20, 20);
    
    doc.setFontSize(12);
    
    const affidavitText = [
      '',
      `STATE OF _____________`,
      `COUNTY OF ___________`,
      '',
      `I, _________________________, being duly sworn, depose and state:`,
      '',
      `1. I am the authorized representative of the employer in the`,
      `   garnishment matter referenced below.`,
      '',
      `2. I have personal knowledge of the payroll records and garnishment`,
      `   payments made in this case.`,
      '',
      `3. The following information is true and accurate:`,
      `   • Case Number: ${profile.case_number}`,
      `   • Employee Name: ${profile.employee_name}`,
      `   • Creditor: ${profile.creditor}`,
      `   • Court District: ${profile.court_district}`,
      '',
      `4. Payment Summary as of ${currentDate}:`,
      `   • Total Amount Owed: $${profile.total_amount_owed}`,
      `   • Amount Paid to Date: $${profile.amount_paid_so_far}`,
      `   • Balance Remaining: $${profile.balance_remaining}`,
      `   • Total Number of Payments Made: ${installments.length}`,
      '',
      `5. All payments have been made in accordance with the court order`,
      `   and applicable laws.`,
      '',
      `6. The attached payment records are true and complete copies of`,
      `   our business records maintained in the ordinary course of business.`,
      '',
      '',
      '________________________________',
      'Signature',
      '',
      '________________________________',
      'Print Name',
      '',
      '________________________________',
      'Title',
      '',
      '',
      `Sworn to before me this _____ day of _________, 20__.`,
      '',
      '',
      '________________________________',
      'Notary Public'
    ];
    
    let yPosition = 30;
    affidavitText.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    
    doc.save(`Affidavit_${profile.case_number}_${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "Affidavit Generated",
      description: "Affidavit template has been downloaded."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Court Evidence Reports
        </CardTitle>
        <CardDescription>
          Generate official court-ready documents and certifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={generatePaymentHistoryReport}
            variant="outline"
            className="flex items-center gap-2 h-auto p-4 flex-col"
          >
            <FileText className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Payment History</div>
              <div className="text-xs text-muted-foreground">
                Chronological payment record
              </div>
            </div>
          </Button>
          
          <Button
            onClick={generateBalanceCertification}
            variant="outline"
            className="flex items-center gap-2 h-auto p-4 flex-col"
          >
            <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              $
            </Badge>
            <div className="text-center">
              <div className="font-medium">Balance Certification</div>
              <div className="text-xs text-muted-foreground">
                Official balance letter
              </div>
            </div>
          </Button>
          
          <Button
            onClick={generateAffidavit}
            variant="outline"
            className="flex items-center gap-2 h-auto p-4 flex-col"
          >
            <Scale className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Affidavit Template</div>
              <div className="text-xs text-muted-foreground">
                Sworn statement form
              </div>
            </div>
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Note:</p>
          <p>All generated documents should be reviewed and signed by authorized personnel before submission to courts or agencies.</p>
        </div>
      </CardContent>
    </Card>
  );
};