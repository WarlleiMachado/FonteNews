const MONTH_KEY = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
})();

function safeParseInt(val: any, def = 0): number {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : def;
}

export function resetIfNewMonth(): void {
  try {
    const last = localStorage.getItem('ytlive-usage-month');
    if (last !== MONTH_KEY) {
      localStorage.setItem(`ytlive-usage-${MONTH_KEY}`, '0');
      localStorage.setItem('ytlive-usage-month', MONTH_KEY);
    }
  } catch {}
}

export function getMonthlyUsage(): number {
  resetIfNewMonth();
  try {
    const raw = localStorage.getItem(`ytlive-usage-${MONTH_KEY}`);
    return safeParseInt(raw, 0);
  } catch {
    return 0;
  }
}

export function addUsage(calls = 1): number {
  resetIfNewMonth();
  try {
    const current = getMonthlyUsage();
    const next = Math.max(0, current + Math.max(0, calls | 0));
    localStorage.setItem(`ytlive-usage-${MONTH_KEY}`, String(next));
    return next;
  } catch {
    return getMonthlyUsage();
  }
}

export function getMonthlyLimit(defaultLimit = 10000): number {
  try {
    const raw = localStorage.getItem('ytlive-limit');
    const val = safeParseInt(raw, defaultLimit);
    return val;
  } catch {
    return defaultLimit;
  }
}

export function setMonthlyLimit(limit: number): void {
  try {
    localStorage.setItem('ytlive-limit', String(Math.max(0, limit | 0)));
  } catch {}
}

export function canSpend(calls = 1): { ok: boolean; remaining: number; usage: number; limit: number } {
  const limit = getMonthlyLimit();
  const usage = getMonthlyUsage();
  const remaining = Math.max(0, limit - usage);
  const ok = Math.max(0, calls | 0) <= remaining;
  return { ok, remaining, usage, limit };
}

export function resetCurrentMonth(): void {
  try {
    localStorage.setItem(`ytlive-usage-${MONTH_KEY}`, '0');
    localStorage.setItem('ytlive-usage-month', MONTH_KEY);
  } catch {}
}