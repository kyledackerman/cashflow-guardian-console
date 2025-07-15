import { useEffect, useCallback } from 'react';
import { useFinanceStore } from './useFinanceStore';
import { useToast } from './use-toast';

interface BackupData {
  timestamp: string;
  version: string;
  data: any;
  metadata: {
    pettyCashCount: number;
    employeeLoansCount: number;
    garnishmentsCount: number;
    employeesCount: number;
  };
}

export function useBackupManager() {
  const financeStore = useFinanceStore();
  const { toast } = useToast();

  // Create backup data structure
  const createBackup = useCallback((): BackupData => {
    const {
      pettyCashTransactions,
      pettyCashBalance,
      employeeLoanWithdrawals,
      employeeLoanRepayments,
      garnishmentProfiles,
      garnishmentInstallments,
      employees,
    } = financeStore;
    
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        pettyCashTransactions,
        pettyCashBalance,
        employeeLoanWithdrawals,
        employeeLoanRepayments,
        garnishmentProfiles,
        garnishmentInstallments,
        employees,
      },
      metadata: {
        pettyCashCount: pettyCashTransactions.length,
        employeeLoansCount: employeeLoanWithdrawals.length + employeeLoanRepayments.length,
        garnishmentsCount: garnishmentProfiles.length,
        employeesCount: employees.length,
      },
    };
  }, [financeStore]);

  // Download backup as JSON file
  const downloadBackup = useCallback(() => {
    try {
      const backup = createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Downloaded",
        description: "Finance data backup has been saved to your downloads.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup file.",
        variant: "destructive",
      });
    }
  }, [createBackup, toast]);

  // Restore from backup file
  const restoreFromBackup = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData: BackupData = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!backupData.data || !backupData.timestamp) {
          throw new Error('Invalid backup file format');
        }

        // Restore data by directly updating localStorage and reloading
        const currentState = JSON.parse(localStorage.getItem('finance-store') || '{}');
        const newState = {
          ...currentState,
          state: {
            ...currentState.state,
            ...backupData.data,
          },
        };
        
        localStorage.setItem('finance-store', JSON.stringify(newState));
        
        // Reload the page to force the store to re-initialize with new data
        window.location.reload();
        
        toast({
          title: "Backup Restored",
          description: `Data restored from backup created on ${new Date(backupData.timestamp).toLocaleDateString()}`,
        });
      } catch (error) {
        toast({
          title: "Restore Failed",
          description: "Failed to restore from backup file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [financeStore, toast]);

  // Create automatic nightly backup
  const createNightlyBackup = useCallback(() => {
    try {
      const backup = createBackup();
      const backupKey = `finance-backup-${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Clean up old backups (keep only last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('finance-backup-')) {
          const dateStr = key.replace('finance-backup-', '');
          const backupDate = new Date(dateStr);
          if (backupDate < sevenDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      });
      
      localStorage.setItem('last-backup-time', new Date().toISOString());
    } catch (error) {
      console.error('Failed to create nightly backup:', error);
    }
  }, [createBackup]);

  // Get last backup time
  const getLastBackupTime = useCallback(() => {
    const lastBackup = localStorage.getItem('last-backup-time');
    return lastBackup ? new Date(lastBackup) : null;
  }, []);

  // Check if backup is needed (daily at 2 AM)
  const checkAndCreateBackup = useCallback(() => {
    const now = new Date();
    const lastBackup = getLastBackupTime();
    
    // Check if it's after 2 AM and no backup today
    if (now.getHours() >= 2) {
      const today = now.toDateString();
      const lastBackupDate = lastBackup?.toDateString();
      
      if (lastBackupDate !== today) {
        createNightlyBackup();
      }
    }
  }, [createNightlyBackup, getLastBackupTime]);

  // Set up automatic backup checking
  useEffect(() => {
    // Check immediately on load
    checkAndCreateBackup();
    
    // Check every hour
    const interval = setInterval(checkAndCreateBackup, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAndCreateBackup]);

  return {
    downloadBackup,
    restoreFromBackup,
    getLastBackupTime,
    createNightlyBackup,
  };
}
