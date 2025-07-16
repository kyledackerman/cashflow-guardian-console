
export interface GarnishmentDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadDate: Date;
  description?: string;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
  role?: 'employee' | 'manager' | 'admin';
  permissions?: string[];
}
