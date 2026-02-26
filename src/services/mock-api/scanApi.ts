import { DB_STORES, dbGetAll, dbPut, ensureDbSeeded } from '../db/indexedDb';
import type { CreditTransaction, ScanIssues, ScanTask } from '../types/model';
import { delay, formatDisplayDateTime, getScanCost, makeId, nowIso, sleep } from './core';
import { getCompanyById, updateCompanyCredits } from './companyApi';

const randomIssues = (): ScanIssues => ({
  critical: Math.floor(Math.random() * 4),
  high: Math.floor(Math.random() * 10),
  medium: Math.floor(Math.random() * 15),
  low: Math.floor(Math.random() * 20),
});

const maybeFinalizeScan = async (scan: ScanTask): Promise<ScanTask> => {
  if (scan.status !== 'processing') return scan;

  const now = Date.now();
  const expected = new Date(scan.expectedCompleteDate).getTime();
  if (now < expected) return scan;

  const finalized: ScanTask = {
    ...scan,
    status: 'completed',
    completedDate: nowIso(),
    issues: scan.issues ?? randomIssues(),
  };
  await dbPut(DB_STORES.scans, finalized);
  return finalized;
};

export const listCompanyScans = async (companyId: string): Promise<ScanTask[]> => {
  await ensureDbSeeded();
  await sleep();

  const allScans = await dbGetAll(DB_STORES.scans);
  const companyScans = allScans.filter(s => s.companyId === companyId);

  const normalized = await Promise.all(companyScans.map(maybeFinalizeScan));
  return delay(
    normalized.sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    ),
    80
  );
};

export const createScanTask = async (params: {
  companyId: string;
  userId: string;
  scanName: string;
  fileName: string;
  description: string;
}): Promise<ScanTask> => {
  await ensureDbSeeded();
  await sleep();

  const company = await getCompanyById(params.companyId);
  if (!company) throw new Error('找不到公司資料');

  const scanCost = getScanCost();
  if (company.credits < scanCost) {
    throw new Error('點數不足，請先聯繫業務加值');
  }

  const uploadDate = nowIso();
  const expectedCompleteDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const task: ScanTask = {
    id: `SC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`,
    companyId: params.companyId,
    uploadedByUserId: params.userId,
    name: params.scanName.trim(),
    fileName: params.fileName.trim(),
    description: params.description.trim(),
    status: 'processing',
    uploadDate,
    expectedCompleteDate,
    completedDate: null,
    creditsCost: scanCost,
    issues: null,
  };

  const tx: CreditTransaction = {
    id: makeId('TX'),
    companyId: params.companyId,
    userId: params.userId,
    type: 'usage',
    amount: -scanCost,
    date: uploadDate,
    description: `程式碼掃描 ${task.id}`,
  };

  await dbPut(DB_STORES.scans, task);
  await dbPut(DB_STORES.creditTransactions, tx);
  await updateCompanyCredits(params.companyId, company.credits - scanCost);
  return delay(task, 80);
};

export const listCompanyCreditTransactions = async (
  companyId: string
): Promise<CreditTransaction[]> => {
  await ensureDbSeeded();
  await sleep();

  const allTx = await dbGetAll(DB_STORES.creditTransactions);
  return delay(
    allTx
      .filter(t => t.companyId === companyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    80
  );
};

export const downloadScanReport = async (
  scanId: string,
  format: 'pdf' | 'html'
): Promise<{ fileName: string; blob: Blob }> => {
  await ensureDbSeeded();
  await sleep();

  const scans = await dbGetAll(DB_STORES.scans);
  const target = scans.find(s => s.id === scanId);
  if (!target) throw new Error('找不到掃描任務');
  if (target.status !== 'completed') throw new Error('掃描尚未完成，無法下載');

  const ext = format === 'pdf' ? 'pdf' : 'html';
  const mime = format === 'pdf' ? 'application/pdf' : 'text/html;charset=utf-8';
  const content =
    format === 'pdf'
      ? `Mock PDF Report\nScan: ${target.id}\nName: ${target.name}\nCompleted: ${formatDisplayDateTime(
          target.completedDate ?? target.uploadDate
        )}`
      : `<html><body><h1>Mock HTML Report</h1><p>Scan: ${target.id}</p><p>Name: ${target.name}</p></body></html>`;

  return {
    fileName: `${target.name}-report.${ext}`,
    blob: new Blob([content], { type: mime }),
  };
};
