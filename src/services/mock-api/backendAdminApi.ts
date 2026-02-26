import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import type { Company, FrontendPermissionSet, FrontendUser } from '../types/model';
import { delay, sleep } from './core';
import { getStoredBackendSession } from '../state/backendSession';

export interface BackendCustomerRow {
  id: string;
  name: string;
  taxId: string;
  accountType: string;
  credits: number;
  userCount: number;
}

const normalizeAccountType = (value: string): string => {
  const text = value.trim();
  if (text === '試用版') return '試用版';
  return '標準版';
};

const assertCanManageCustomer = (): void => {
  const session = getStoredBackendSession();
  if (!session || (session.role !== 'sales' && session.role !== 'adm')) {
    throw new Error('僅業務或管理員可編輯客戶資料');
  }
};

export const listBackendCustomers = async (): Promise<BackendCustomerRow[]> => {
  assertCanManageCustomer();
  await ensureDbSeeded();
  await sleep();

  const companies = await dbGetAll(DB_STORES.companies);
  const users = await dbGetAll(DB_STORES.frontendUsers);

  const rows = companies.map(company => ({
    id: company.id,
    name: company.name,
    taxId: company.taxId,
    accountType: normalizeAccountType(company.accountType),
    credits: company.credits,
    userCount: users.filter(u => u.companyId === company.id).length,
  }));

  return delay(rows, 80);
};

export const updateBackendCustomer = async (
  companyId: string,
  payload: Pick<Company, 'name' | 'taxId' | 'accountType' | 'credits' | 'userCount'>
): Promise<Company> => {
  const session = getStoredBackendSession();
  assertCanManageCustomer();
  await ensureDbSeeded();
  await sleep();

  const companies = await dbGetAll(DB_STORES.companies);
  const target = companies.find(c => c.id === companyId);
  if (!target) throw new Error('公司不存在');

  const updated: Company = {
    ...target,
    name: payload.name.trim(),
    taxId: payload.taxId.trim(),
    accountType: normalizeAccountType(payload.accountType),
    credits: payload.credits,
    userCount: session?.role === 'sales' ? target.userCount : payload.userCount,
  };
  await dbPut(DB_STORES.companies, updated);
  return delay(updated, 80);
};

export const listFrontendUsersByCompany = async (companyId: string): Promise<FrontendUser[]> => {
  assertCanManageCustomer();
  await ensureDbSeeded();
  await sleep();
  const users = await dbGetAll(DB_STORES.frontendUsers);
  return delay(users.filter(u => u.companyId === companyId), 80);
};

export const updateFrontendUserCredentialAndPermissions = async (
  userId: string,
  payload: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    permissions: FrontendPermissionSet;
  }
): Promise<FrontendUser> => {
  assertCanManageCustomer();
  await ensureDbSeeded();
  await sleep();

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const target = users.find(u => u.id === userId);
  if (!target) throw new Error('使用者不存在');

  const nextEmail = payload.email.trim().toLowerCase();
  if (!nextEmail) {
    throw new Error('帳號（Email）不得為空');
  }
  const nextName = payload.name.trim();
  if (!nextName) {
    throw new Error('姓名不得為空');
  }
  const duplicated = users.find(u => u.id !== userId && u.email.toLowerCase() === nextEmail);
  if (duplicated) {
    throw new Error('此帳號（Email）已被使用');
  }

  const nextPassword = payload.password?.trim();
  if (nextPassword && nextPassword.length < 8) {
    throw new Error('新密碼長度至少 8 碼');
  }

  const updated: FrontendUser = {
    ...target,
    name: nextName,
    email: nextEmail,
    phone: payload.phone.trim(),
    password: nextPassword || target.password,
    permissions: {
      uploadCode: payload.permissions.uploadCode,
      downloadReport: payload.permissions.downloadReport,
      viewHistory: payload.permissions.viewHistory,
    },
  };

  await dbPut(DB_STORES.frontendUsers, updated);
  return delay(updated, 80);
};

export const createFrontendUserForCompany = async (
  companyId: string,
  payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    permissions: FrontendPermissionSet;
  }
): Promise<FrontendUser> => {
  assertCanManageCustomer();
  await ensureDbSeeded();
  await sleep();

  const companies = await dbGetAll(DB_STORES.companies);
  const company = companies.find(c => c.id === companyId);
  if (!company) throw new Error('公司不存在');

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const email = payload.email.trim().toLowerCase();
  if (!email) throw new Error('帳號（Email）不得為空');
  if (!payload.name.trim()) throw new Error('姓名不得為空');
  if (payload.password.trim().length < 8) throw new Error('密碼長度至少 8 碼');

  const duplicated = users.find(u => u.email.toLowerCase() === email);
  if (duplicated) throw new Error('此帳號（Email）已被使用');

  const max = users.reduce((acc, u) => {
    const n = Number(u.id.replace('fu-', ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  const id = `fu-${String(max + 1).padStart(3, '0')}`;

  const user: FrontendUser = {
    id,
    companyId,
    name: payload.name.trim(),
    email,
    phone: payload.phone.trim(),
    password: payload.password.trim(),
    permissions: {
      uploadCode: payload.permissions.uploadCode,
      downloadReport: payload.permissions.downloadReport,
      viewHistory: payload.permissions.viewHistory,
    },
  };

  await dbPut(DB_STORES.frontendUsers, user);
  return delay(user, 80);
};
