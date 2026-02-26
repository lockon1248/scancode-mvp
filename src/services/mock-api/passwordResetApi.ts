import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import { delay, makeId, sleep } from './core';
import type { DbMeta } from '../types/model';

const STORE_KEY_PREFIX = 'password_reset_token:';
const TOKEN_TTL_MINUTES = 15;

interface PasswordResetTokenPayload {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  used: boolean;
}

const parsePayload = (raw: string): PasswordResetTokenPayload | null => {
  try {
    return JSON.parse(raw) as PasswordResetTokenPayload;
  } catch {
    return null;
  }
};

const storePayload = async (payload: PasswordResetTokenPayload): Promise<void> => {
  const record: DbMeta = {
    key: `${STORE_KEY_PREFIX}${payload.token}`,
    value: JSON.stringify(payload),
  };
  await dbPut(DB_STORES.meta, record);
};

const getPayload = async (token: string): Promise<PasswordResetTokenPayload | null> => {
  const rows = await dbGetAll(DB_STORES.meta);
  const hit = rows.find(r => r.key === `${STORE_KEY_PREFIX}${token}`);
  if (!hit) return null;
  return parsePayload(hit.value);
};

export const requestPasswordReset = async (
  email: string
): Promise<{ token: string; expiresAt: string }> => {
  await ensureDbSeeded();
  await sleep();

  const normalizedEmail = email.trim().toLowerCase();
  const users = await dbGetAll(DB_STORES.frontendUsers);
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error('找不到此 Email 對應的帳號');
  }

  const token = makeId('reset');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  const payload: PasswordResetTokenPayload = {
    token,
    userId: user.id,
    email: user.email,
    expiresAt,
    used: false,
  };
  await storePayload(payload);
  return delay({ token, expiresAt }, 80);
};

export const validateResetToken = async (token: string): Promise<{ email: string; expiresAt: string }> => {
  await ensureDbSeeded();
  await sleep();

  const payload = await getPayload(token.trim());
  if (!payload) throw new Error('重設連結不存在');
  if (payload.used) throw new Error('重設連結已使用');
  if (new Date(payload.expiresAt).getTime() < Date.now()) throw new Error('重設連結已過期');

  return delay({ email: payload.email, expiresAt: payload.expiresAt }, 80);
};

export const resetPasswordByToken = async (token: string, newPassword: string): Promise<void> => {
  await ensureDbSeeded();
  await sleep();

  if (newPassword.length < 8) {
    throw new Error('新密碼長度至少 8 碼');
  }

  const payload = await getPayload(token.trim());
  if (!payload) throw new Error('重設連結不存在');
  if (payload.used) throw new Error('重設連結已使用');
  if (new Date(payload.expiresAt).getTime() < Date.now()) throw new Error('重設連結已過期');

  const users = await dbGetAll(DB_STORES.frontendUsers);
  const user = users.find(u => u.id === payload.userId);
  if (!user) throw new Error('找不到對應帳號');

  await dbPut(DB_STORES.frontendUsers, { ...user, password: newPassword });
  await storePayload({ ...payload, used: true });
};
