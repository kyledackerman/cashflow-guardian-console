
export interface GarnishmentDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
  uploadDate: Date;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
  role?: 'employee' | 'manager' | 'admin';
  permissions?: string[];
}
