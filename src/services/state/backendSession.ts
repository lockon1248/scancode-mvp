export type BackendRole = 'adm' | 'sales' | 'pm';

export interface BackendSessionUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
}

type BackendCredential = BackendSessionUser & { password: string };

const BACKEND_SESSION_KEY = 'backend_session_v1';
const BACKEND_CREDENTIALS_KEY = 'backend_credentials_v1';

const seedBackendCredentials: BackendCredential[] = [
  {
    id: 'bu-000',
    name: '系統管理員',
    email: 'adm@orange.com',
    password: '123',
    role: 'adm',
  },
  {
    id: 'bu-001',
    name: '張小美',
    email: 'sales@orange.com',
    password: '123',
    role: 'sales',
  },
  {
    id: 'bu-002',
    name: '王小華',
    email: 'pm@orange.com',
    password: '123',
    role: 'pm',
  },
  {
    id: 'bu-003',
    name: '李大明',
    email: 'sales.lidaming@orange.com',
    password: '123',
    role: 'sales',
  },
];

export type BackendOperatorRole = 'sales' | 'pm';

export interface BackendOperatorAccount {
  id: string;
  name: string;
  email: string;
  role: BackendOperatorRole;
}

const sleep = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

const readCredentials = (): BackendCredential[] => {
  const raw = localStorage.getItem(BACKEND_CREDENTIALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BackendCredential[];
  } catch {
    return [];
  }
};

const writeCredentials = (items: BackendCredential[]): void => {
  localStorage.setItem(BACKEND_CREDENTIALS_KEY, JSON.stringify(items));
};

const ensureSeeded = (): void => {
  const items = readCredentials();
  if (items.length === 0) {
    writeCredentials(seedBackendCredentials);
    return;
  }
  const idSet = new Set(items.map(item => item.id));
  const missing = seedBackendCredentials.filter(item => !idSet.has(item.id));
  if (missing.length > 0) {
    writeCredentials([...items, ...missing]);
  }
};

const assertAdmin = (): void => {
  const session = getStoredBackendSession();
  if (!session || session.role !== 'adm') {
    throw new Error('僅系統管理員可操作後台帳號');
  }
};

export const loginBackend = async (email: string, password: string): Promise<BackendSessionUser> => {
  ensureSeeded();
  const normalized = email.trim().toLowerCase();
  const credentials = readCredentials();
  const user = credentials.find(u => u.email.toLowerCase() === normalized);
  if (!user || user.password !== password) {
    throw new Error('後台帳號或密碼錯誤');
  }

  const session: BackendSessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  localStorage.setItem(BACKEND_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const logoutBackend = (): void => {
  localStorage.removeItem(BACKEND_SESSION_KEY);
};

export const getStoredBackendSession = (): BackendSessionUser | null => {
  const raw = localStorage.getItem(BACKEND_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BackendSessionUser;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const hasStoredBackendSession = (): boolean => Boolean(getStoredBackendSession());

export const getBackendRole = (): BackendRole | null => getStoredBackendSession()?.role ?? null;

export const listBackendOperatorAccounts = async (): Promise<BackendOperatorAccount[]> => {
  assertAdmin();
  ensureSeeded();
  await sleep();
  const rows = readCredentials()
    .filter(item => item.role === 'sales' || item.role === 'pm')
    .map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role as BackendOperatorRole,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return rows;
};

export const createBackendOperatorAccount = async (payload: {
  name: string;
  email: string;
  password: string;
  role: BackendOperatorRole;
}): Promise<BackendOperatorAccount> => {
  assertAdmin();
  ensureSeeded();
  await sleep();

  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  if (!name) throw new Error('姓名不得為空');
  if (!email) throw new Error('Email 不得為空');
  if (password.length < 3) throw new Error('密碼長度至少 3 碼');

  const items = readCredentials();
  if (items.some(item => item.email.toLowerCase() === email)) {
    throw new Error('此 Email 已存在');
  }

  const max = items.reduce((acc, item) => {
    const n = Number(item.id.replace('bu-', ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  const id = `bu-${String(max + 1).padStart(3, '0')}`;

  const next: BackendCredential = { id, name, email, password, role: payload.role };
  writeCredentials([next, ...items]);
  return { id: next.id, name: next.name, email: next.email, role: next.role as BackendOperatorRole };
};

export const updateBackendOperatorAccount = async (
  accountId: string,
  payload: { name: string; email: string; role: BackendOperatorRole; password?: string }
): Promise<BackendOperatorAccount> => {
  assertAdmin();
  ensureSeeded();
  await sleep();

  const items = readCredentials();
  const target = items.find(item => item.id === accountId);
  if (!target) throw new Error('找不到帳號');
  if (target.role === 'adm') throw new Error('不可編輯管理員帳號');

  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  if (!name) throw new Error('姓名不得為空');
  if (!email) throw new Error('Email 不得為空');
  if (items.some(item => item.id !== accountId && item.email.toLowerCase() === email)) {
    throw new Error('此 Email 已存在');
  }
  const password = payload.password?.trim();
  if (password && password.length < 3) throw new Error('密碼長度至少 3 碼');

  const updated: BackendCredential = {
    ...target,
    name,
    email,
    role: payload.role,
    password: password || target.password,
  };
  writeCredentials(items.map(item => (item.id === accountId ? updated : item)));
  return { id: updated.id, name: updated.name, email: updated.email, role: updated.role as BackendOperatorRole };
};

export const deleteBackendOperatorAccount = async (accountId: string): Promise<void> => {
  assertAdmin();
  ensureSeeded();
  await sleep();

  const items = readCredentials();
  const target = items.find(item => item.id === accountId);
  if (!target) throw new Error('找不到帳號');
  if (target.role === 'adm') throw new Error('不可刪除管理員帳號');

  writeCredentials(items.filter(item => item.id !== accountId));
};
