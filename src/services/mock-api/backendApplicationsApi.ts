import { getStoredBackendSession, type BackendSessionUser } from '../state/backendSession';
import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import type { FrontendPermissionSet, FrontendUser } from '../types/model';

export type BackendApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface BackendApplication {
  id: string;
  company: string;
  taxId: string;
  applicant: string;
  email: string;
  phone: string;
  requestedUsers: number;
  companyUsers?: BackendApplicationUser[];
  requestedCredits: number;
  submittedDate: string;
  submittedBy: string;
  status: BackendApplicationStatus;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  type?: 'company_onboarding' | 'user_addition' | 'credit_topup';
  companyId?: string;
}

export interface BackendApplicationUser {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  password?: string;
  permissions?: FrontendPermissionSet;
}

export interface BackendApplicationPayload {
  company: string;
  taxId: string;
  companyUsers: BackendApplicationUser[];
  requestedCredits: number;
  notes?: string;
}

const STORAGE_KEY = 'backend_applications_v1';

const seedApplications: BackendApplication[] = [
  {
    id: 'APP-001',
    company: '聯發科技股份有限公司',
    taxId: '24536821',
    applicant: '李經理',
    email: 'lee@mediatek.com',
    phone: '0912-345-678',
    requestedUsers: 8,
    companyUsers: [
      { name: '李經理', email: 'lee@mediatek.com', phone: '0912-345-678', role: 'admin' },
      { name: '王工程師', email: 'wang.dev@mediatek.com', phone: '0912-111-222', role: 'member' },
    ],
    requestedCredits: 10000,
    submittedDate: '2024-02-11 09:30',
    submittedBy: '業務 - 張小美',
    status: 'pending',
    notes: '新客戶申請，已完成初步審查',
    type: 'company_onboarding',
  },
  {
    id: 'APP-002',
    company: '華碩電腦股份有限公司',
    taxId: '11347852',
    applicant: '陳主任',
    email: 'chen@asus.com',
    phone: '0923-456-789',
    requestedUsers: 15,
    companyUsers: [
      { name: '陳主任', email: 'chen@asus.com', phone: '0923-456-789', role: 'admin' },
      { name: '林測試', email: 'qa@asus.com', phone: '0923-100-200', role: 'member' },
    ],
    requestedCredits: 20000,
    submittedDate: '2024-02-11 14:20',
    submittedBy: '業務 - 李大明',
    status: 'pending',
    notes: '企業大客戶，需要較多授權數',
    type: 'company_onboarding',
  },
  {
    id: 'APP-003',
    company: '宏達國際電子股份有限公司',
    taxId: '16003518',
    applicant: '林副理',
    email: 'lin@htc.com',
    phone: '0934-567-890',
    requestedUsers: 5,
    companyUsers: [{ name: '林副理', email: 'lin@htc.com', phone: '0934-567-890', role: 'admin' }],
    requestedCredits: 5000,
    submittedDate: '2024-02-10 16:45',
    submittedBy: '業務 - 張小美',
    status: 'approved',
    approvedBy: 'PDM - 王小華',
    approvedDate: '2024-02-11 10:00',
    notes: '已審核通過並建立帳號',
    type: 'company_onboarding',
  },
  {
    id: 'APP-004',
    company: '測試公司',
    taxId: '11111111',
    applicant: '測試人員',
    email: 'test@test.com',
    phone: '0900-000-000',
    requestedUsers: 100,
    companyUsers: [{ name: '測試人員', email: 'test@test.com', phone: '0900-000-000', role: 'admin' }],
    requestedCredits: 100000,
    submittedDate: '2024-02-09 11:20',
    submittedBy: '業務 - 李大明',
    status: 'rejected',
    rejectedBy: 'PDM - 王小華',
    rejectedDate: '2024-02-09 15:30',
    rejectionReason: '資料不完整，需要補充公司證明文件',
    notes: '',
    type: 'company_onboarding',
  },
  {
    id: 'APP-101',
    companyId: 'comp-tsmc',
    company: '台積電股份有限公司',
    taxId: '12345678',
    applicant: '周測試',
    email: 'qa.new@tsmc.com',
    phone: '0918-000-101',
    requestedUsers: 1,
    companyUsers: [
      {
        name: '周測試',
        email: 'qa.new@tsmc.com',
        phone: '0918-000-101',
        role: 'member',
        password: '123',
        permissions: { uploadCode: false, downloadReport: true, viewHistory: true },
      },
    ],
    requestedCredits: 0,
    submittedDate: '2024-02-12 09:10',
    submittedBy: '業務 - 張小美',
    status: 'pending',
    notes: '台積電追加一位測試人員',
    type: 'user_addition',
  },
  {
    id: 'APP-102',
    companyId: 'comp-mediatek',
    company: '聯發科技股份有限公司',
    taxId: '24536821',
    applicant: '郭資料',
    email: 'profile.new@mediatek.com',
    phone: '0920-222-102',
    requestedUsers: 1,
    companyUsers: [
      {
        name: '郭資料',
        email: 'profile.new@mediatek.com',
        phone: '0920-222-102',
        role: 'member',
        password: '123',
        permissions: { uploadCode: false, downloadReport: false, viewHistory: true },
      },
    ],
    requestedCredits: 0,
    submittedDate: '2024-02-12 14:35',
    submittedBy: '業務 - 李大明',
    status: 'rejected',
    rejectedBy: 'PDM - 王小華',
    rejectedDate: '2024-02-12 15:40',
    rejectionReason: 'Email 格式與公司規範不符，請修正後重送',
    notes: '聯發科補充資料帳號',
    type: 'user_addition',
  },
  {
    id: 'APP-103',
    companyId: 'comp-htc',
    company: '宏達國際電子股份有限公司',
    taxId: '16003518',
    applicant: '蔡上傳',
    email: 'upload.new@htc.com',
    phone: '0922-444-103',
    requestedUsers: 1,
    companyUsers: [
      {
        name: '蔡上傳',
        email: 'upload.new@htc.com',
        phone: '0922-444-103',
        role: 'member',
        password: '123',
        permissions: { uploadCode: true, downloadReport: false, viewHistory: false },
      },
    ],
    requestedCredits: 0,
    submittedDate: '2024-02-12 16:05',
    submittedBy: '業務 - 張小美',
    status: 'draft',
    notes: 'HTC 追加上傳專員（草稿）',
    type: 'user_addition',
  },
];

const sleep = (ms = 280) => new Promise(resolve => setTimeout(resolve, ms));

const formatNow = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const readApps = (): BackendApplication[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BackendApplication[];
  } catch {
    return [];
  }
};

const writeApps = (apps: BackendApplication[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
};

const ensureSeeded = (): void => {
  const apps = readApps();
  if (apps.length === 0) {
    writeApps(seedApplications);
    return;
  }

  // Keep demo data additive so existing localStorage users can also see new seeds.
  const idSet = new Set(apps.map(app => app.id));
  const missing = seedApplications.filter(app => !idSet.has(app.id));
  if (missing.length > 0) {
    writeApps([...missing, ...apps]);
  }
};

const assertReviewer = (session: BackendSessionUser | null): void => {
  if (!session || (session.role !== 'pm' && session.role !== 'adm')) {
    throw new Error('僅 PM 或管理員可執行此操作');
  }
};

const assertCanCreate = (session: BackendSessionUser | null): void => {
  if (!session || (session.role !== 'sales' && session.role !== 'adm')) {
    throw new Error('僅業務或管理員可建立申請');
  }
};

const getNextApplicationId = (apps: BackendApplication[]): string => {
  const max = apps.reduce((acc, app) => {
    const n = Number(app.id.replace('APP-', ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `APP-${String(max + 1).padStart(3, '0')}`;
};

const sanitizeCompanyUsers = (users: BackendApplicationUser[]): BackendApplicationUser[] => {
  return users
    .map(user => ({
      name: user.name.trim(),
      email: user.email.trim(),
      phone: user.phone.trim(),
      role: user.role,
      permissions: user.permissions
        ? {
            uploadCode: Boolean(user.permissions.uploadCode),
            downloadReport: user.permissions.downloadReport ?? true,
            viewHistory: user.permissions.viewHistory ?? true,
          }
        : undefined,
    }))
    .filter(user => user.name && user.email);
};

const upsertApplication = async (payload: BackendApplicationPayload, status: 'draft' | 'pending', applicationId?: string) => {
  ensureSeeded();
  await sleep();

  const session = getStoredBackendSession();
  assertCanCreate(session);

  const companyUsers = sanitizeCompanyUsers(payload.companyUsers);
  if (companyUsers.length === 0) throw new Error('請至少新增 1 位公司用戶');
  if (payload.requestedCredits <= 0) throw new Error('申請點數需大於 0');

  const primaryUser = companyUsers[0];
  const apps = readApps();
  const now = formatNow();
  const submittedBy = `${session.role === 'adm' ? 'ADM' : '業務'} - ${session.name}`;
  const current = applicationId ? apps.find(app => app.id === applicationId) : null;

  if (applicationId && !current) throw new Error('找不到申請單');
  if (current && current.status !== 'draft' && current.status !== 'rejected') {
    throw new Error('僅草稿或已拒絕申請可重新編輯');
  }

  const item: BackendApplication = {
    id: current?.id ?? getNextApplicationId(apps),
    company: payload.company.trim(),
    taxId: payload.taxId.trim(),
    applicant: primaryUser.name,
    email: primaryUser.email,
    phone: primaryUser.phone,
    requestedUsers: companyUsers.length,
    companyUsers,
    requestedCredits: payload.requestedCredits,
    submittedDate: now,
    submittedBy,
    status,
    notes: payload.notes?.trim() || '',
    approvedBy: undefined,
    approvedDate: undefined,
    rejectedBy: undefined,
    rejectedDate: undefined,
    rejectionReason: undefined,
    type: 'company_onboarding',
  };

  if (current) {
    writeApps(apps.map(app => (app.id === item.id ? item : app)));
  } else {
    writeApps([item, ...apps]);
  }
  return item;
};

export const listBackendApplications = async (): Promise<BackendApplication[]> => {
  ensureSeeded();
  await sleep();
  const apps = readApps();
  return apps.sort((a, b) => (a.id < b.id ? 1 : -1));
};

export const getBackendApplicationById = async (applicationId: string): Promise<BackendApplication | null> => {
  ensureSeeded();
  await sleep(80);
  const apps = readApps();
  return apps.find(app => app.id === applicationId) ?? null;
};

export const saveBackendApplicationDraft = async (
  payload: BackendApplicationPayload,
  applicationId?: string
): Promise<BackendApplication> => upsertApplication(payload, 'draft', applicationId);

export const submitBackendApplication = async (
  payload: BackendApplicationPayload,
  applicationId?: string
): Promise<BackendApplication> => upsertApplication(payload, 'pending', applicationId);

export const listUserAdditionRequestsByCompany = async (companyId: string): Promise<BackendApplication[]> => {
  ensureSeeded();
  await sleep(120);
  const apps = readApps().filter(
    app => app.type === 'user_addition' && app.companyId === companyId
  );
  return apps.sort((a, b) => (a.id < b.id ? 1 : -1));
};

const upsertUserAdditionRequest = async (
  payload: {
    companyId: string;
    company: string;
    taxId: string;
    user: BackendApplicationUser;
    notes?: string;
  },
  status: 'draft' | 'pending',
  applicationId?: string
): Promise<BackendApplication> => {
  ensureSeeded();
  await sleep();

  const session = getStoredBackendSession();
  assertCanCreate(session);

  const apps = readApps();
  const current = applicationId ? apps.find(app => app.id === applicationId) : null;
  if (applicationId && !current) throw new Error('找不到申請單');
  if (current && current.type !== 'user_addition') throw new Error('申請類型不符');
  if (current && current.status === 'pending') throw new Error('審核中的內容不可編輯');
  if (current && current.status !== 'draft' && current.status !== 'rejected') {
    throw new Error('僅草稿或審核失敗可重新編輯');
  }

  const user = sanitizeCompanyUsers([payload.user])[0];
  if (!user) throw new Error('請填寫完整人員資料');
  const nextPassword = payload.user.password?.trim() || '123';
  const nextPermissions =
    payload.user.permissions ||
    ({
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    } satisfies FrontendPermissionSet);
  const now = formatNow();
  const submittedBy = `${session.role === 'adm' ? 'ADM' : '業務'} - ${session.name}`;

  const item: BackendApplication = {
    id: current?.id ?? getNextApplicationId(apps),
    companyId: payload.companyId,
    company: payload.company.trim(),
    taxId: payload.taxId.trim(),
    applicant: user.name,
    email: user.email,
    phone: user.phone,
    requestedUsers: 1,
    companyUsers: [
      {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: nextPassword,
        permissions: nextPermissions,
      },
    ],
    requestedCredits: 0,
    submittedDate: now,
    submittedBy,
    status,
    notes: payload.notes?.trim() || '',
    approvedBy: undefined,
    approvedDate: undefined,
    rejectedBy: undefined,
    rejectedDate: undefined,
    rejectionReason: undefined,
    type: 'user_addition',
  };

  if (current) {
    writeApps(apps.map(app => (app.id === item.id ? item : app)));
  } else {
    writeApps([item, ...apps]);
  }
  return item;
};

export const saveUserAdditionDraft = async (
  payload: {
    companyId: string;
    company: string;
    taxId: string;
    user: BackendApplicationUser;
    notes?: string;
  },
  applicationId?: string
): Promise<BackendApplication> => upsertUserAdditionRequest(payload, 'draft', applicationId);

export const submitUserAdditionForReview = async (
  payload: {
    companyId: string;
    company: string;
    taxId: string;
    user: BackendApplicationUser;
    notes?: string;
  },
  applicationId?: string
): Promise<BackendApplication> => upsertUserAdditionRequest(payload, 'pending', applicationId);

const upsertCreditTopUpRequest = async (
  payload: {
    companyId: string;
    company: string;
    taxId: string;
    requestedCredits: number;
    notes?: string;
  },
  status: 'pending'
): Promise<BackendApplication> => {
  ensureSeeded();
  await sleep();

  const session = getStoredBackendSession();
  assertCanCreate(session);

  if (payload.requestedCredits <= 0) throw new Error('追加點數需大於 0');

  const apps = readApps();
  const now = formatNow();
  const submittedBy = `${session.role === 'adm' ? 'ADM' : '業務'} - ${session.name}`;
  const applicantEmail = session.email || 'noreply@orange.com';

  const item: BackendApplication = {
    id: getNextApplicationId(apps),
    companyId: payload.companyId,
    company: payload.company.trim(),
    taxId: payload.taxId.trim(),
    applicant: session.name,
    email: applicantEmail,
    phone: '-',
    requestedUsers: 0,
    companyUsers: [],
    requestedCredits: payload.requestedCredits,
    submittedDate: now,
    submittedBy,
    status,
    notes: payload.notes?.trim() || '客戶點數儲值申請',
    approvedBy: undefined,
    approvedDate: undefined,
    rejectedBy: undefined,
    rejectedDate: undefined,
    rejectionReason: undefined,
    type: 'credit_topup',
  };

  writeApps([item, ...apps]);
  return item;
};

export const submitCreditTopUpForReview = async (payload: {
  companyId: string;
  company: string;
  taxId: string;
  requestedCredits: number;
  notes?: string;
}): Promise<BackendApplication> => upsertCreditTopUpRequest(payload, 'pending');

export const approveBackendApplication = async (applicationId: string): Promise<BackendApplication> => {
  ensureSeeded();
  await sleep();

  const session = getStoredBackendSession();
  assertReviewer(session);

  const apps = readApps();
  const target = apps.find(app => app.id === applicationId);
  if (!target) throw new Error('找不到申請單');
  if (target.status !== 'pending') throw new Error('僅待審核申請可核准');

  if (target.type === 'user_addition') {
    await ensureDbSeeded();
    const users = await dbGetAll(DB_STORES.frontendUsers);
    const companies = await dbGetAll(DB_STORES.companies);
    const company = companies.find(c => c.id === target.companyId);
    if (!company) throw new Error('找不到對應公司');
    const requestUser = target.companyUsers?.[0];
    if (!requestUser) throw new Error('找不到申請人員資料');
    const email = requestUser.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === email)) {
      throw new Error('該 Email 已存在，無法重複建立');
    }
    const max = users.reduce((acc, u) => {
      const n = Number(u.id.replace('fu-', ''));
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    const newUser: FrontendUser = {
      id: `fu-${String(max + 1).padStart(3, '0')}`,
      companyId: company.id,
      name: requestUser.name,
      email,
      phone: requestUser.phone,
      password: requestUser.password || '123',
      permissions: requestUser.permissions || {
        uploadCode: false,
        downloadReport: true,
        viewHistory: true,
      },
    };
    await dbPut(DB_STORES.frontendUsers, newUser);
    await dbPut(DB_STORES.companies, { ...company, userCount: company.userCount + 1 });
  }

  if (target.type === 'credit_topup') {
    await ensureDbSeeded();
    const companies = await dbGetAll(DB_STORES.companies);
    const company = companies.find(c => c.id === target.companyId);
    if (!company) throw new Error('找不到對應公司');
    await dbPut(DB_STORES.companies, {
      ...company,
      credits: company.credits + target.requestedCredits,
    });
  }

  const updated: BackendApplication = {
    ...target,
    status: 'approved',
    approvedBy: `${session.role === 'adm' ? 'ADM' : 'PDM'} - ${session.name}`,
    approvedDate: formatNow(),
    rejectedBy: undefined,
    rejectedDate: undefined,
    rejectionReason: undefined,
  };

  writeApps(apps.map(app => (app.id === applicationId ? updated : app)));
  return updated;
};

export const rejectBackendApplication = async (
  applicationId: string,
  rejectionReason: string
): Promise<BackendApplication> => {
  ensureSeeded();
  await sleep();

  const session = getStoredBackendSession();
  assertReviewer(session);

  const apps = readApps();
  const target = apps.find(app => app.id === applicationId);
  if (!target) throw new Error('找不到申請單');
  if (target.status !== 'pending') throw new Error('僅待審核申請可拒絕');

  const updated: BackendApplication = {
    ...target,
    status: 'rejected',
    rejectedBy: `${session.role === 'adm' ? 'ADM' : 'PDM'} - ${session.name}`,
    rejectedDate: formatNow(),
    rejectionReason: rejectionReason.trim() || '未提供原因',
    approvedBy: undefined,
    approvedDate: undefined,
  };

  writeApps(apps.map(app => (app.id === applicationId ? updated : app)));
  return updated;
};
