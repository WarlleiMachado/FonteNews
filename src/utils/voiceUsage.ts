type Provider = 'google' | 'elevenlabs';

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
    const last = localStorage.getItem('voice-usage-month');
    if (last !== MONTH_KEY) {
      localStorage.setItem(`voice-usage-google-${MONTH_KEY}`, '0');
      localStorage.setItem(`voice-usage-elevenlabs-${MONTH_KEY}`, '0');
      localStorage.setItem('voice-usage-month', MONTH_KEY);
    }
  } catch {}
}

export function getMonthlyUsage(provider: Provider): number {
  resetIfNewMonth();
  try {
    const raw = localStorage.getItem(`voice-usage-${provider}-${MONTH_KEY}`);
    return safeParseInt(raw, 0);
  } catch {
    return 0;
  }
}

export function addUsage(provider: Provider, chars: number): number {
  resetIfNewMonth();
  try {
    const current = getMonthlyUsage(provider);
    const next = Math.max(0, current + Math.max(0, chars | 0));
    localStorage.setItem(`voice-usage-${provider}-${MONTH_KEY}`, String(next));
    return next;
  } catch {
    return getMonthlyUsage(provider);
  }
}

export function getMonthlyLimit(provider: Provider, defaults: Record<Provider, number> = { google: 50000, elevenlabs: 10000 }): number {
  try {
    const raw = localStorage.getItem(`voice-limit-${provider}`);
    const val = safeParseInt(raw, defaults[provider]);
    return val;
  } catch {
    return defaults[provider];
  }
}

export function setMonthlyLimit(provider: Provider, limit: number): void {
  try {
    localStorage.setItem(`voice-limit-${provider}`, String(Math.max(0, limit | 0)));
  } catch {}
}

export function canSpend(provider: Provider, chars: number): { ok: boolean; remaining: number; usage: number; limit: number } {
  const limit = getMonthlyLimit(provider);
  const usage = getMonthlyUsage(provider);
  const remaining = Math.max(0, limit - usage);
  const ok = Math.max(0, chars | 0) <= remaining;
  return { ok, remaining, usage, limit };
}