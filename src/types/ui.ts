
export interface GarnishmentDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadDate: Date;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  active: boolean;
  role: 'user' | 'manager' | 'admin';
}

// Backwards compatibility - will be removed in Phase 3
export interface Employee {
  id: string;
  name: string;
  active: boolean;
  role: 'user' | 'manager' | 'admin' | 'employee';
}
