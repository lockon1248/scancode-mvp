export const API_DELAY_MS = 280;
const SCAN_COST = 1;

export const getScanCost = () => SCAN_COST;

export const delay = <T>(value: T, ms = API_DELAY_MS): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

export const sleep = (ms = API_DELAY_MS): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const nowIso = () => new Date().toISOString();

export const makeId = (prefix: string) => {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`;
};

export const formatDisplayDateTime = (iso: string) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};
