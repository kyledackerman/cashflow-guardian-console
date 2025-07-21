
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

  const addCompanyHeader = (doc: jsPDF) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOM MAIDS CO.', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payroll Department', 20, 28);
    doc.text('Phone: (XXX) XXX-XXXX | Email: payroll@custom-maids.co', 20, 34);
    
    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
  };

  const addFooter = (doc: jsPDF, pageHeight: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This document contains confidential payroll information and is for official use only.', 20, pageHeight - 20);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, pageHeight - 14);
    doc.text('Page 1 of 1', 170, pageHeight - 14);
  };

  const generatePaymentHistoryReport = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    
    addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GARNISHMENT PAYMENT HISTORY REPORT', 20, 55);
    
    // Case information section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CASE INFORMATION', 20, 70);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const caseInfo = [
      `Case Number: ${profile.case_number}`,
      `Employee: ${profile.employee_name}`,
      `Creditor: ${profile.creditor}`,
      `Court District: ${profile.court_district}`,
      profile.law_firm ? `Law Firm: ${profile.law_firm}` : null
    ].filter(Boolean);
    
    caseInfo.forEach((info, index) => {
      doc.text(info, 20, 78 + (index * 6));
    });
    
    // Financial summary section
    const summaryY = 78 + (caseInfo.length * 6) + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL SUMMARY', 20, summaryY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Amount Owed: $${Number(profile.total_amount_owed).toFixed(2)}`, 20, summaryY + 8);
    doc.text(`Amount Paid to Date: $${Number(profile.amount_paid_so_far).toFixed(2)}`, 20, summaryY + 14);
    doc.text(`Balance Remaining: $${Number(profile.balance_remaining).toFixed(2)}`, 20, summaryY + 20);
    doc.text(`Status: ${profile.status?.toUpperCase()}`, 20, summaryY + 26);
    
    // Payment history table
    const tableStartY = summaryY + 40;
    const sortedInstallments = installments
      .sort((a, b) => new Date(a.payroll_date).getTime() - new Date(b.payroll_date).getTime());
    
    const tableData = sortedInstallments.map(installment => [
      new Date(installment.payroll_date).toLocaleDateString(),
      installment.installment_number.toString(),
      `$${Number(installment.amount).toFixed(2)}`,
      installment.check_number || 'N/A',
      installment.recorded_by_name || 'System'
    ]);

    doc.autoTable({
      startY: tableStartY,
      head: [['Payment Date', 'Installment #', 'Amount', 'Check Number', 'Recorded By']],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });
    
    // Certification section
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.text('I hereby certify that the above payment history is true and accurate', 20, finalY + 8);
    doc.text('based on our payroll records maintained in the ordinary course of business.', 20, finalY + 14);
    
    doc.text('_________________________________', 20, finalY + 35);
    doc.text('Authorized Signature', 20, finalY + 42);
    doc.text('Payroll Administrator', 20, finalY + 48);
    
    doc.text('Date: _______________', 120, finalY + 42);
    
    addFooter(doc, pageHeight);
    
    doc.save(`Payment_History_${profile.case_number}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Payment History Generated",
      description: "Professional payment history report has been downloaded."
    });
  };

  const generateBalanceCertification = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const currentDate = new Date().toLocaleDateString();
    
    addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BALANCE CERTIFICATION LETTER', 20, 55);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, 20, 70);
    
    // Letter content
    const letterContent = [
      '',
      'TO WHOM IT MAY CONCERN:',
      '',
      'This letter serves as official certification of the garnishment balance status',
      'for the case referenced below, maintained in our payroll records.',
      '',
      'CASE DETAILS:',
      `• Case Number: ${profile.case_number}`,
      `• Employee Name: ${profile.employee_name}`,
      `• Creditor: ${profile.creditor}`,
      `• Court District: ${profile.court_district}`,
      profile.law_firm ? `• Law Firm: ${profile.law_firm}` : null,
      '',
      `BALANCE CERTIFICATION AS OF ${currentDate.toUpperCase()}:`,
      `• Original Amount Owed: $${Number(profile.total_amount_owed).toFixed(2)}`,
      `• Total Amount Paid: $${Number(profile.amount_paid_so_far).toFixed(2)}`,
      `• Current Balance Remaining: $${Number(profile.balance_remaining).toFixed(2)}`,
      `• Account Status: ${profile.status?.toUpperCase()}`,
      '',
      'This certification is issued based on our payroll records maintained',
      'in the ordinary course of business and is accurate as of the date shown.',
      '',
      'If you require any additional information regarding this garnishment,',
      'please contact our Payroll Department at the number listed above.',
      ''
    ].filter(Boolean);
    
    let yPosition = 85;
    letterContent.forEach(line => {
      if (line.startsWith('•')) {
        doc.text(line, 25, yPosition);
      } else if (line === 'CASE DETAILS:' || line.includes('BALANCE CERTIFICATION')) {
        doc.setFont('helvetica', 'bold');
        doc.text(line, 20, yPosition);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text(line, 20, yPosition);
      }
      yPosition += 6;
    });
    
    // Signature block
    yPosition += 10;
    doc.text('Sincerely,', 20, yPosition);
    yPosition += 25;
    doc.text('_________________________________', 20, yPosition);
    yPosition += 7;
    doc.text('Authorized Representative', 20, yPosition);
    yPosition += 6;
    doc.text('Payroll Department', 20, yPosition);
    yPosition += 6;
    doc.text('Custom Maids Co.', 20, yPosition);
    
    addFooter(doc, pageHeight);
    
    doc.save(`Balance_Certification_${profile.case_number}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Balance Certification Generated",
      description: "Professional balance certification letter has been downloaded."
    });
  };

  const generateAffidavit = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const currentDate = new Date().toLocaleDateString();
    
    addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AFFIDAVIT OF GARNISHMENT PAYMENT RECORDS', 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const affidavitContent = [
      '',
      'STATE OF ________________',
      'COUNTY OF ______________',
      '',
      'I, ________________________________, being duly sworn under oath,',
      'depose and state as follows:',
      '',
      '1. I am the duly authorized representative of Custom Maids Co.,',
      '   the employer in the garnishment matter described below.',
      '',
      '2. I have personal knowledge of the payroll records and',
      '   garnishment payments made in this case.',
      '',
      '3. The garnishment case information is as follows:',
      `   • Case Number: ${profile.case_number}`,
      `   • Employee Name: ${profile.employee_name}`,
      `   • Creditor: ${profile.creditor}`,
      `   • Court District: ${profile.court_district}`,
      profile.law_firm ? `   • Law Firm: ${profile.law_firm}` : null,
      '',
      `4. Payment Summary as of ${currentDate}:`,
      `   • Total Amount Owed: $${Number(profile.total_amount_owed).toFixed(2)}`,
      `   • Amount Paid to Date: $${Number(profile.amount_paid_so_far).toFixed(2)}`,
      `   • Balance Remaining: $${Number(profile.balance_remaining).toFixed(2)}`,
      `   • Total Number of Payments: ${installments.length}`,
      '',
      '5. All payments have been made in accordance with applicable',
      '   court orders and wage garnishment laws.',
      '',
      '6. The payment records referenced herein are true and complete',
      '   copies of our business records maintained in the ordinary',
      '   course of business.',
      '',
      '7. This affidavit is made for the purpose of providing accurate',
      '   garnishment payment information to the court or other',
      '   authorized parties.',
      ''
    ].filter(Boolean);
    
    let yPosition = 70;
    affidavitContent.forEach(line => {
      if (line.startsWith('   •')) {
        doc.text(line, 25, yPosition);
      } else {
        doc.text(line, 20, yPosition);
      }
      yPosition += 5.5;
    });
    
    // Signature section
    yPosition += 10;
    doc.text('____________________________________', 20, yPosition);
    yPosition += 7;
    doc.text('Signature', 20, yPosition);
    yPosition += 10;
    doc.text('____________________________________', 20, yPosition);
    yPosition += 7;
    doc.text('Print Name', 20, yPosition);
    yPosition += 10;
    doc.text('____________________________________', 20, yPosition);
    yPosition += 7;
    doc.text('Title', 20, yPosition);
    yPosition += 15;
    
    // Notarization section
    doc.setFont('helvetica', 'bold');
    doc.text('NOTARIZATION', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    
    doc.text(`Sworn to and subscribed before me this _____ day of`, 20, yPosition);
    yPosition += 6;
    doc.text(`_____________, 20____.`, 20, yPosition);
    yPosition += 15;
    
    doc.text('____________________________________', 20, yPosition);
    yPosition += 7;
    doc.text('Notary Public', 20, yPosition);
    yPosition += 7;
    doc.text('My commission expires: ______________', 20, yPosition);
    
    addFooter(doc, pageHeight);
    
    doc.save(`Affidavit_${profile.case_number}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Affidavit Generated",
      description: "Professional affidavit template has been downloaded."
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
          Generate professional court-ready documents and certifications
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
                Official chronological record
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
                Formal balance verification
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
                Sworn legal statement
              </div>
            </div>
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium mb-1">Professional Standards:</p>
          <p>All documents include proper headers, legal formatting, and signature blocks. Review and customize before official submission.</p>
        </div>
      </CardContent>
    </Card>
  );
};
