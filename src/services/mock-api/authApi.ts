import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import type { FrontendUser, LoginResult } from '../types/model';
import { delay, sleep } from './core';
import { getCompanyById } from './companyApi';

export const loginFrontend = async (email: string, password: string): Promise<LoginResult> => {
  await ensureDbSeeded();
  await sleep();

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new Error('帳號或密碼錯誤');
  }

  const company = await getCompanyById(user.companyId);
  if (!company) {
    throw new Error('找不到使用者對應公司');
  }

  return delay({ user, company }, 80);
};

export const getFrontendUserById = async (userId: string): Promise<FrontendUser | null> => {
  await ensureDbSeeded();
  const users = await dbGetAll(DB_STORES.frontendUsers);
  return users.find(u => u.id === userId) ?? null;
};

export const updateFrontendProfile = async (
  userId: string,
  payload: Pick<FrontendUser, 'name' | 'email' | 'phone'>
): Promise<FrontendUser> => {
  await ensureDbSeeded();
  await sleep();

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const target = users.find(u => u.id === userId);
  if (!target) throw new Error('使用者不存在');

  const duplicated = users.find(
    u => u.id !== userId && u.email.toLowerCase() === payload.email.trim().toLowerCase()
  );
  if (duplicated) {
    throw new Error('此 Email 已被其他帳號使用');
  }

  const nextUser: FrontendUser = {
    ...target,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
  };
  await dbPut(DB_STORES.frontendUsers, nextUser);
  return delay(nextUser, 80);
};

export const changeFrontendPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await ensureDbSeeded();
  await sleep();

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const target = users.find(u => u.id === userId);
  if (!target) throw new Error('使用者不存在');
  if (target.password !== currentPassword) {
    throw new Error('目前密碼不正確');
  }
  if (newPassword.length < 8) {
    throw new Error('新密碼長度至少 8 碼');
  }

  await dbPut(DB_STORES.frontendUsers, { ...target, password: newPassword });
};
