export type ScanStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Company {
  id: string;
  name: string;
  taxId: string;
  accountType: string;
  credits: number;
  userCount: number;
}

export interface FrontendPermissionSet {
  uploadCode: boolean;
  downloadReport: boolean;
  viewHistory: boolean;
}

export interface FrontendUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  permissions: FrontendPermissionSet;
}

export interface ScanIssues {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ScanTask {
  id: string;
  companyId: string;
  uploadedByUserId: string;
  name: string;
  fileName: string;
  description: string;
  status: ScanStatus;
  uploadDate: string;
  expectedCompleteDate: string;
  completedDate: string | null;
  creditsCost: number;
  issues: ScanIssues | null;
}

export interface CreditTransaction {
  id: string;
  companyId: string;
  userId: string;
  type: 'usage' | 'purchase' | 'adjustment';
  amount: number;
  date: string;
  description: string;
}

export interface DbMeta {
  key: string;
  value: string;
}

export interface LoginResult {
  user: FrontendUser;
  company: Company;
}
