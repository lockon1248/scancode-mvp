import type { Company, CreditTransaction, DbMeta, FrontendUser, ScanTask } from '../types/model';
import { nowIso } from '../mock-api/core';

const DB_NAME = 'orange-mvp-db';
const DB_VERSION = 1;

const STORE_META = 'meta';
const STORE_COMPANIES = 'companies';
const STORE_FRONT_USERS = 'frontendUsers';
const STORE_SCANS = 'scans';
const STORE_CREDIT_TXS = 'creditTransactions';

const SEEDED_KEY = 'seeded_v1';
const MIGRATED_SCAN_COST_V2_KEY = 'migrated_scan_cost_v2';
const MIGRATED_DEMO_USERS_V3_KEY = 'migrated_demo_users_v3';
const MIGRATED_COMPANY_USER_COUNT_V4_KEY = 'migrated_company_user_count_v4';
const MIGRATED_DEMO_COMPANIES_V5_KEY = 'migrated_demo_companies_v5';
const MIGRATED_ALL_PASSWORDS_V6_KEY = 'migrated_all_passwords_v6';
const MIGRATED_EXPANDED_DEMO_USERS_V7_KEY = 'migrated_expanded_demo_users_v7';
const MIGRATED_DEMO_SCANS_V8_KEY = 'migrated_demo_scans_v8';
const MIGRATED_ACCOUNT_TYPE_V9_KEY = 'migrated_account_type_v9';

const normalizeAccountType = (value: string): string => {
  const text = value.trim();
  if (text === '試用版') return '試用版';
  return '標準版';
};

type StoreRecordMap = {
  [STORE_META]: DbMeta;
  [STORE_COMPANIES]: Company;
  [STORE_FRONT_USERS]: FrontendUser;
  [STORE_SCANS]: ScanTask;
  [STORE_CREDIT_TXS]: CreditTransaction;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

const txDone = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });

const openDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_COMPANIES)) {
          db.createObjectStore(STORE_COMPANIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FRONT_USERS)) {
          const store = db.createObjectStore(STORE_FRONT_USERS, { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: true });
          store.createIndex('companyId', 'companyId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SCANS)) {
          const store = db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
          store.createIndex('companyId', 'companyId', { unique: false });
          store.createIndex('uploadedByUserId', 'uploadedByUserId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_CREDIT_TXS)) {
          const store = db.createObjectStore(STORE_CREDIT_TXS, { keyPath: 'id' });
          store.createIndex('companyId', 'companyId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    });
  }
  return dbPromise;
};

export const dbGet = async <S extends keyof StoreRecordMap>(
  storeName: S,
  key: string
): Promise<StoreRecordMap[S] | undefined> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const result = await requestToPromise(store.get(key));
  await txDone(tx);
  return result as StoreRecordMap[S] | undefined;
};

export const dbGetAll = async <S extends keyof StoreRecordMap>(
  storeName: S
): Promise<Array<StoreRecordMap[S]>> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const result = await requestToPromise(store.getAll());
  await txDone(tx);
  return result as Array<StoreRecordMap[S]>;
};

export const dbPut = async <S extends keyof StoreRecordMap>(
  storeName: S,
  value: StoreRecordMap[S]
): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(value as any);
  await txDone(tx);
};

export const dbBulkPut = async <S extends keyof StoreRecordMap>(
  storeName: S,
  values: Array<StoreRecordMap[S]>
): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  values.forEach(v => store.put(v as any));
  await txDone(tx);
};

const seedCompanies = (): Company[] => [
  {
    id: 'comp-tsmc',
    name: '台積電股份有限公司',
    taxId: '12345678',
    accountType: '標準版',
    credits: 120,
    userCount: 6,
  },
  {
    id: 'comp-mediatek',
    name: '聯發科技股份有限公司',
    taxId: '24536821',
    accountType: '標準版',
    credits: 80,
    userCount: 4,
  },
  {
    id: 'comp-asus',
    name: '華碩電腦股份有限公司',
    taxId: '11347852',
    accountType: '試用版',
    credits: 150,
    userCount: 3,
  },
  {
    id: 'comp-htc',
    name: '宏達國際電子股份有限公司',
    taxId: '16003518',
    accountType: '標準版',
    credits: 60,
    userCount: 3,
  },
];

const seedFrontendUsers = (): FrontendUser[] => [
  {
    id: 'fu-001',
    companyId: 'comp-tsmc',
    name: '張小明',
    email: 'ming.chang@tsmc.com',
    phone: '0912-345-678',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-002',
    companyId: 'comp-tsmc',
    name: '李小華',
    email: 'hua.li@tsmc.com',
    phone: '0911-123-456',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-003',
    companyId: 'comp-tsmc',
    name: '陳上傳',
    email: 'upload.only@tsmc.com',
    phone: '0913-000-003',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: false,
      viewHistory: false,
    },
  },
  {
    id: 'fu-004',
    companyId: 'comp-tsmc',
    name: '林檢視',
    email: 'viewer@tsmc.com',
    phone: '0914-000-004',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-005',
    companyId: 'comp-tsmc',
    name: '王資料',
    email: 'profile.editor@tsmc.com',
    phone: '0915-000-005',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: false,
      viewHistory: false,
    },
  },
  {
    id: 'fu-006',
    companyId: 'comp-mediatek',
    name: '王經理',
    email: 'manager@mediatek.com',
    phone: '0920-111-006',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-007',
    companyId: 'comp-mediatek',
    name: '趙檢視',
    email: 'viewer@mediatek.com',
    phone: '0920-111-007',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-008',
    companyId: 'comp-mediatek',
    name: '林上傳',
    email: 'upload@mediatek.com',
    phone: '0920-111-008',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: false,
      viewHistory: false,
    },
  },
  {
    id: 'fu-009',
    companyId: 'comp-asus',
    name: '陳管理',
    email: 'admin@asus.com',
    phone: '0921-222-009',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-010',
    companyId: 'comp-asus',
    name: '蔡報告',
    email: 'report@asus.com',
    phone: '0921-222-010',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-011',
    companyId: 'comp-htc',
    name: '吳主帳',
    email: 'owner@htc.com',
    phone: '0922-333-011',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-012',
    companyId: 'comp-htc',
    name: '許一般',
    email: 'member@htc.com',
    phone: '0922-333-012',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: false,
      viewHistory: true,
    },
  },
  {
    id: 'fu-013',
    companyId: 'comp-mediatek',
    name: '周資料',
    email: 'profile@mediatek.com',
    phone: '0920-111-013',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: false,
      viewHistory: false,
    },
  },
  {
    id: 'fu-014',
    companyId: 'comp-asus',
    name: '郭上傳',
    email: 'upload@asus.com',
    phone: '0921-222-014',
    password: '123',
    permissions: {
      uploadCode: true,
      downloadReport: false,
      viewHistory: false,
    },
  },
  {
    id: 'fu-015',
    companyId: 'comp-htc',
    name: '黃檢視',
    email: 'viewer@htc.com',
    phone: '0922-333-015',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: true,
    },
  },
  {
    id: 'fu-016',
    companyId: 'comp-tsmc',
    name: '高財務',
    email: 'finance@tsmc.com',
    phone: '0916-000-016',
    password: '123',
    permissions: {
      uploadCode: false,
      downloadReport: true,
      viewHistory: false,
    },
  },
];

const daysAgoIso = (days: number, hour: number, minute: number): string => {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const plusHours = (iso: string, hours: number): string =>
  new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();

const seedScans = (): ScanTask[] => {
  const items: ScanTask[] = [
    {
      id: 'SC-2026-001',
      companyId: 'comp-tsmc',
      uploadedByUserId: 'fu-001',
      name: 'payment-service-v2.3',
      fileName: 'payment-service-v2.3.zip',
      description: '支付模組例行掃描',
      status: 'completed',
      uploadDate: daysAgoIso(28, 10, 30),
      expectedCompleteDate: daysAgoIso(27, 10, 30),
      completedDate: daysAgoIso(27, 13, 10),
      creditsCost: 1,
      issues: { critical: 2, high: 7, medium: 10, low: 12 },
    },
    {
      id: 'SC-2026-002',
      companyId: 'comp-tsmc',
      uploadedByUserId: 'fu-003',
      name: 'account-module-v4',
      fileName: 'account-module-v4.zip',
      description: '帳號模組掃描',
      status: 'completed',
      uploadDate: daysAgoIso(22, 9, 15),
      expectedCompleteDate: daysAgoIso(21, 9, 15),
      completedDate: daysAgoIso(21, 12, 40),
      creditsCost: 1,
      issues: { critical: 1, high: 4, medium: 9, low: 11 },
    },
    {
      id: 'SC-2026-003',
      companyId: 'comp-tsmc',
      uploadedByUserId: 'fu-001',
      name: 'api-gateway-v1.8',
      fileName: 'api-gateway-v1.8.zip',
      description: 'Gateway 版本升級',
      status: 'completed',
      uploadDate: daysAgoIso(16, 14, 5),
      expectedCompleteDate: daysAgoIso(15, 14, 5),
      completedDate: daysAgoIso(15, 17, 0),
      creditsCost: 1,
      issues: { critical: 3, high: 6, medium: 8, low: 10 },
    },
    {
      id: 'SC-2026-004',
      companyId: 'comp-tsmc',
      uploadedByUserId: 'fu-001',
      name: 'frontend-web-v6',
      fileName: 'frontend-web-v6.zip',
      description: '前端主站版本測試',
      status: 'completed',
      uploadDate: daysAgoIso(9, 11, 45),
      expectedCompleteDate: daysAgoIso(8, 11, 45),
      completedDate: daysAgoIso(8, 15, 10),
      creditsCost: 1,
      issues: { critical: 0, high: 3, medium: 7, low: 15 },
    },
    {
      id: 'SC-2026-005',
      companyId: 'comp-tsmc',
      uploadedByUserId: 'fu-001',
      name: 'user-auth-module',
      fileName: 'user-auth-module.zip',
      description: '認證模組掃描',
      status: 'processing',
      uploadDate: daysAgoIso(1, 16, 20),
      expectedCompleteDate: plusHours(daysAgoIso(1, 16, 20), 24),
      completedDate: null,
      creditsCost: 1,
      issues: null,
    },
    {
      id: 'SC-2026-006',
      companyId: 'comp-mediatek',
      uploadedByUserId: 'fu-006',
      name: 'chip-sec-core',
      fileName: 'chip-sec-core.zip',
      description: '晶片安全核心',
      status: 'completed',
      uploadDate: daysAgoIso(25, 10, 0),
      expectedCompleteDate: daysAgoIso(24, 10, 0),
      completedDate: daysAgoIso(24, 14, 5),
      creditsCost: 1,
      issues: { critical: 1, high: 5, medium: 12, low: 18 },
    },
    {
      id: 'SC-2026-007',
      companyId: 'comp-mediatek',
      uploadedByUserId: 'fu-008',
      name: 'wifi-driver-v3',
      fileName: 'wifi-driver-v3.zip',
      description: '驅動程式檢測',
      status: 'completed',
      uploadDate: daysAgoIso(14, 9, 50),
      expectedCompleteDate: daysAgoIso(13, 9, 50),
      completedDate: daysAgoIso(13, 12, 10),
      creditsCost: 1,
      issues: { critical: 2, high: 4, medium: 7, low: 9 },
    },
    {
      id: 'SC-2026-008',
      companyId: 'comp-mediatek',
      uploadedByUserId: 'fu-006',
      name: 'bluetooth-stack-v2',
      fileName: 'bluetooth-stack-v2.zip',
      description: '通訊模組掃描',
      status: 'processing',
      uploadDate: daysAgoIso(3, 13, 30),
      expectedCompleteDate: plusHours(daysAgoIso(3, 13, 30), 24),
      completedDate: null,
      creditsCost: 1,
      issues: null,
    },
    {
      id: 'SC-2026-009',
      companyId: 'comp-asus',
      uploadedByUserId: 'fu-009',
      name: 'bios-tools-v1',
      fileName: 'bios-tools-v1.zip',
      description: 'BIOS 工具鏈',
      status: 'completed',
      uploadDate: daysAgoIso(20, 10, 45),
      expectedCompleteDate: daysAgoIso(19, 10, 45),
      completedDate: daysAgoIso(19, 16, 30),
      creditsCost: 1,
      issues: { critical: 0, high: 2, medium: 6, low: 8 },
    },
    {
      id: 'SC-2026-010',
      companyId: 'comp-asus',
      uploadedByUserId: 'fu-014',
      name: 'router-firmware-v5',
      fileName: 'router-firmware-v5.zip',
      description: '韌體安全掃描',
      status: 'completed',
      uploadDate: daysAgoIso(11, 15, 20),
      expectedCompleteDate: daysAgoIso(10, 15, 20),
      completedDate: daysAgoIso(10, 18, 0),
      creditsCost: 1,
      issues: { critical: 2, high: 7, medium: 9, low: 10 },
    },
    {
      id: 'SC-2026-011',
      companyId: 'comp-asus',
      uploadedByUserId: 'fu-009',
      name: 'support-portal-v4',
      fileName: 'support-portal-v4.zip',
      description: '客服平台掃描',
      status: 'processing',
      uploadDate: daysAgoIso(2, 9, 40),
      expectedCompleteDate: plusHours(daysAgoIso(2, 9, 40), 24),
      completedDate: null,
      creditsCost: 1,
      issues: null,
    },
    {
      id: 'SC-2026-012',
      companyId: 'comp-htc',
      uploadedByUserId: 'fu-011',
      name: 'mobile-app-core',
      fileName: 'mobile-app-core.zip',
      description: '行動 app 核心',
      status: 'completed',
      uploadDate: daysAgoIso(24, 11, 10),
      expectedCompleteDate: daysAgoIso(23, 11, 10),
      completedDate: daysAgoIso(23, 15, 0),
      creditsCost: 1,
      issues: { critical: 1, high: 3, medium: 8, low: 12 },
    },
    {
      id: 'SC-2026-013',
      companyId: 'comp-htc',
      uploadedByUserId: 'fu-015',
      name: 'server-sync-v2',
      fileName: 'server-sync-v2.zip',
      description: '同步服務掃描',
      status: 'completed',
      uploadDate: daysAgoIso(12, 14, 25),
      expectedCompleteDate: daysAgoIso(11, 14, 25),
      completedDate: daysAgoIso(11, 17, 50),
      creditsCost: 1,
      issues: { critical: 0, high: 5, medium: 7, low: 13 },
    },
    {
      id: 'SC-2026-014',
      companyId: 'comp-htc',
      uploadedByUserId: 'fu-011',
      name: 'notification-service-v3',
      fileName: 'notification-service-v3.zip',
      description: '通知服務掃描',
      status: 'processing',
      uploadDate: daysAgoIso(4, 16, 10),
      expectedCompleteDate: plusHours(daysAgoIso(4, 16, 10), 24),
      completedDate: null,
      creditsCost: 1,
      issues: null,
    },
  ];
  return items;
};

const seedCreditTransactions = (): CreditTransaction[] => [
  {
    id: 'TX-001',
    companyId: 'comp-tsmc',
    userId: 'fu-001',
    type: 'purchase',
    amount: 120,
    date: '2024-02-01T09:00:00.000Z',
    description: '點數購買（2024年2月）',
  },
  {
    id: 'TX-002',
    companyId: 'comp-tsmc',
    userId: 'fu-001',
    type: 'usage',
    amount: -1,
    date: '2024-02-10T14:30:00.000Z',
    description: '程式碼掃描 SC-2024-001',
  },
  {
    id: 'TX-003',
    companyId: 'comp-tsmc',
    userId: 'fu-001',
    type: 'usage',
    amount: -1,
    date: '2024-02-11T09:15:00.000Z',
    description: '程式碼掃描 SC-2024-002',
  },
  {
    id: 'TX-004',
    companyId: 'comp-tsmc',
    userId: 'fu-001',
    type: 'usage',
    amount: -1,
    date: '2024-02-11T10:22:00.000Z',
    description: '程式碼掃描 SC-2024-003',
  },
];

const migrateScanCostV2 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_SCAN_COST_V2_KEY);
  if (migrated?.value === 'true') return;

  const scans = await dbGetAll(STORE_SCANS);
  const updatedScans = scans.map(scan =>
    scan.creditsCost === 50 ? { ...scan, creditsCost: 1 } : scan
  );
  await dbBulkPut(STORE_SCANS, updatedScans);

  const txs = await dbGetAll(STORE_CREDIT_TXS);
  const updatedTxs = txs.map(tx =>
    tx.type === 'usage' && tx.amount === -50 ? { ...tx, amount: -1 } : tx
  );
  await dbBulkPut(STORE_CREDIT_TXS, updatedTxs);

  const company = await dbGet(STORE_COMPANIES, 'comp-tsmc');
  if (company && company.credits > 500) {
    // Existing demo data from early prototype used 50 points/scan.
    // Reset to new low-volume baseline so the numbers align with 1 point/scan.
    await dbPut(STORE_COMPANIES, { ...company, credits: 120 });
  }

  await dbPut(STORE_META, { key: MIGRATED_SCAN_COST_V2_KEY, value: 'true' });
};

const migrateDemoUsersV3 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_DEMO_USERS_V3_KEY);
  if (migrated?.value === 'true') return;

  const currentUsers = await dbGetAll(STORE_FRONT_USERS);
  const currentEmailSet = new Set(currentUsers.map(u => u.email.toLowerCase()));

  const toInsert = seedFrontendUsers().filter(
    u => !currentEmailSet.has(u.email.toLowerCase())
  );

  if (toInsert.length > 0) {
    await dbBulkPut(STORE_FRONT_USERS, toInsert);
  }

  await dbPut(STORE_META, { key: MIGRATED_DEMO_USERS_V3_KEY, value: 'true' });
};

const migrateCompanyUserCountV4 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_COMPANY_USER_COUNT_V4_KEY);
  if (migrated?.value === 'true') return;

  const [companies, users] = await Promise.all([
    dbGetAll(STORE_COMPANIES),
    dbGetAll(STORE_FRONT_USERS),
  ]);

  const updated = companies.map(company => ({
    ...company,
    userCount:
      typeof company.userCount === 'number'
        ? company.userCount
        : users.filter(u => u.companyId === company.id).length,
  }));
  await dbBulkPut(STORE_COMPANIES, updated);
  await dbPut(STORE_META, { key: MIGRATED_COMPANY_USER_COUNT_V4_KEY, value: 'true' });
};

const migrateDemoCompaniesV5 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_DEMO_COMPANIES_V5_KEY);
  if (migrated?.value === 'true') return;

  const current = await dbGetAll(STORE_COMPANIES);
  const currentIdSet = new Set(current.map(c => c.id));
  const toInsert = seedCompanies().filter(c => !currentIdSet.has(c.id));
  if (toInsert.length > 0) {
    await dbBulkPut(STORE_COMPANIES, toInsert);
  }

  await dbPut(STORE_META, { key: MIGRATED_DEMO_COMPANIES_V5_KEY, value: 'true' });
};

const migrateAllPasswordsV6 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_ALL_PASSWORDS_V6_KEY);
  if (migrated?.value === 'true') return;

  const users = await dbGetAll(STORE_FRONT_USERS);
  if (users.length > 0) {
    const updated = users.map(user => ({ ...user, password: '123' }));
    await dbBulkPut(STORE_FRONT_USERS, updated);
  }

  await dbPut(STORE_META, { key: MIGRATED_ALL_PASSWORDS_V6_KEY, value: 'true' });
};

const migrateExpandedDemoUsersV7 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_EXPANDED_DEMO_USERS_V7_KEY);
  if (migrated?.value === 'true') return;

  const currentUsers = await dbGetAll(STORE_FRONT_USERS);
  const currentEmailSet = new Set(currentUsers.map(u => u.email.toLowerCase()));
  const toInsert = seedFrontendUsers().filter(u => !currentEmailSet.has(u.email.toLowerCase()));
  if (toInsert.length > 0) {
    await dbBulkPut(STORE_FRONT_USERS, toInsert);
  }

  const [companies, usersAfterInsert] = await Promise.all([
    dbGetAll(STORE_COMPANIES),
    dbGetAll(STORE_FRONT_USERS),
  ]);
  const countMap = usersAfterInsert.reduce<Record<string, number>>((acc, user) => {
    acc[user.companyId] = (acc[user.companyId] || 0) + 1;
    return acc;
  }, {});
  const updatedCompanies = companies.map(company => ({
    ...company,
    userCount: Math.max(company.userCount ?? 0, countMap[company.id] ?? 0),
  }));
  await dbBulkPut(STORE_COMPANIES, updatedCompanies);

  await dbPut(STORE_META, { key: MIGRATED_EXPANDED_DEMO_USERS_V7_KEY, value: 'true' });
};

const migrateDemoScansV8 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_DEMO_SCANS_V8_KEY);
  if (migrated?.value === 'true') return;

  const current = await dbGetAll(STORE_SCANS);
  const idSet = new Set(current.map(scan => scan.id));
  const toInsert = seedScans().filter(scan => !idSet.has(scan.id));
  if (toInsert.length > 0) {
    await dbBulkPut(STORE_SCANS, toInsert);
  }

  await dbPut(STORE_META, { key: MIGRATED_DEMO_SCANS_V8_KEY, value: 'true' });
};

const migrateAccountTypeV9 = async (): Promise<void> => {
  const migrated = await dbGet(STORE_META, MIGRATED_ACCOUNT_TYPE_V9_KEY);
  if (migrated?.value === 'true') return;

  const companies = await dbGetAll(STORE_COMPANIES);
  const updated = companies.map(company => ({
    ...company,
    accountType: normalizeAccountType(company.accountType),
  }));

  await dbBulkPut(STORE_COMPANIES, updated);
  await dbPut(STORE_META, { key: MIGRATED_ACCOUNT_TYPE_V9_KEY, value: 'true' });
};

const syncDemoDataAlways = async (): Promise<void> => {
  const [companies, users] = await Promise.all([
    dbGetAll(STORE_COMPANIES),
    dbGetAll(STORE_FRONT_USERS),
  ]);

  const companyIdSet = new Set(companies.map(c => c.id));
  const userEmailSet = new Set(users.map(u => u.email.toLowerCase()));

  const missingCompanies = seedCompanies().filter(company => !companyIdSet.has(company.id));
  if (missingCompanies.length > 0) {
    await dbBulkPut(STORE_COMPANIES, missingCompanies);
  }

  const missingUsers = seedFrontendUsers().filter(user => !userEmailSet.has(user.email.toLowerCase()));
  if (missingUsers.length > 0) {
    await dbBulkPut(STORE_FRONT_USERS, missingUsers);
  }
};

export const ensureDbSeeded = async (): Promise<void> => {
  const seeded = await dbGet(STORE_META, SEEDED_KEY);
  if (seeded?.value !== 'true') {
    await dbBulkPut(STORE_COMPANIES, seedCompanies());
    await dbBulkPut(STORE_FRONT_USERS, seedFrontendUsers());
    await dbBulkPut(STORE_SCANS, seedScans());
    await dbBulkPut(STORE_CREDIT_TXS, seedCreditTransactions());
    await dbPut(STORE_META, { key: SEEDED_KEY, value: 'true' });
  }

  await migrateScanCostV2();
  await migrateDemoUsersV3();
  await migrateDemoCompaniesV5();
  await migrateCompanyUserCountV4();
  await migrateAllPasswordsV6();
  await migrateExpandedDemoUsersV7();
  await migrateDemoScansV8();
  await migrateAccountTypeV9();
  await syncDemoDataAlways();
};

export const DB_STORES = {
  meta: STORE_META,
  companies: STORE_COMPANIES,
  frontendUsers: STORE_FRONT_USERS,
  scans: STORE_SCANS,
  creditTransactions: STORE_CREDIT_TXS,
} as const;
