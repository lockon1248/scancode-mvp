import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import type { Company } from '../types/model';
import { delay, sleep } from './core';

export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  await ensureDbSeeded();
  const companies = await dbGetAll(DB_STORES.companies);
  return companies.find(c => c.id === companyId) ?? null;
};

export const updateCompanyCredits = async (companyId: string, nextCredits: number): Promise<Company> => {
  await ensureDbSeeded();
  await sleep();

  const companies = await dbGetAll(DB_STORES.companies);
  const company = companies.find(c => c.id === companyId);
  if (!company) throw new Error('公司不存在');

  const updated: Company = { ...company, credits: nextCredits };
  await dbPut(DB_STORES.companies, updated);
  return delay(updated, 80);
};
