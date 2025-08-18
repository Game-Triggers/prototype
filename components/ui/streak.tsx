"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Trophy, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type StreakSummary = {
  current: number;
  longest: number;
  lastDate: string | null;
  last7Days?: { date: string; active: boolean }[];
};

function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function toUtcMidnight(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function timeUntilNextUtcMidnight(): string {
  const now = new Date();
  const next = toUtcMidnight(new Date(now));
  next.setUTCDate(next.getUTCDate() + 1);
  const diff = next.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function StreakBadge({ className }: { className?: string }) {
  const [summary, setSummary] = useState<StreakSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blaze, setBlaze] = useState(false);
  const hoverRef = useRef<HTMLDivElement | null>(null);

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const readCache = () => {
    try {
      const raw = localStorage.getItem('gt:streak:v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { dayKey: string; summary: StreakSummary };
      if (parsed.dayKey === todayKey) return parsed.summary;
      return null;
    } catch {
      return null;
    }
  };

  const writeCache = (s: StreakSummary | null) => {
    try {
      if (!s) return;
      localStorage.setItem('gt:streak:v1', JSON.stringify({ dayKey: todayKey, summary: s }));
    } catch {}
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/me/streak', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as StreakSummary;
        setSummary(data);
        writeCache(data);
      }
    } catch {
      // silent fail, fall back to cache
      const cached = readCache();
      if (cached) setSummary(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prime from cache immediately to avoid flashing 0
    const cached = readCache();
    if (cached) setSummary(cached);

    fetchSummary();
    const handler = (e?: Event) => {
      setBlaze(true);
      const custom = e as CustomEvent | undefined;
      const data = (custom?.detail || null) as Partial<StreakSummary> | null;
      if (data && typeof data.current === 'number') {
        setSummary((prev) => {
          const next: StreakSummary = {
            current: data.current ?? prev?.current ?? 0,
            longest: Math.max(data.longest ?? 0, prev?.longest ?? 0),
            lastDate: data.lastDate ?? prev?.lastDate ?? null,
            last7Days: data.last7Days ?? prev?.last7Days,
          };
          writeCache(next);
          return next;
        });
      } else {
        fetchSummary();
      }
      window.setTimeout(() => setBlaze(false), 1200);
    };
    const onDocClick = (e: MouseEvent) => {
      if (!hoverRef.current) return;
      if (!hoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('streak:updated', handler as EventListener);
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('streak:updated', handler as EventListener);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
      }
    };
  }, [todayKey]);

  const todayCounted = useMemo(() => {
    if (!summary?.lastDate) return false;
    const last = new Date(summary.lastDate);
    return isSameUtcDay(last, new Date());
  }, [summary?.lastDate]);

  const days = useMemo(() => {
    // Prefer backend days; otherwise build an empty 7-day window
    if (summary?.last7Days && summary.last7Days.length === 7) {
      return summary.last7Days;
    }
    
    const base: { date: string; active: boolean }[] = [];
    const today = toUtcMidnight(new Date());
    for (let i = -6; i <= 0; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() + i);
      base.push({ date: d.toISOString(), active: false });
    }
    if (todayCounted) base[6].active = true;
    return base;
  }, [summary?.last7Days, todayCounted]);

  return (
    <div
      ref={hoverRef}
      className={cn('relative', className)}
      onMouseEnter={() => {
        setOpen(true);
        setBlaze(true);
        window.setTimeout(() => setBlaze(false), 800);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Login streak"
        aria-expanded={open}
        className={cn(
          'relative flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative">
          {/* Blaze effect */}
          {blaze && (
            <span className="absolute -inset-2 rounded-full bg-gradient-to-tr from-orange-500/30 via-pink-500/20 to-yellow-400/30 blur-md animate-pulse" />
          )}
          <Flame className={cn('h-4 w-4 text-orange-500 transition-transform', open ? 'scale-110' : '')} />
        </span>
        <span className="text-xs font-semibold tabular-nums">{summary?.current ?? 0}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-popover text-popover-foreground shadow-xl p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="pointer-events-none absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Streak</div>
              <div className="text-xs text-muted-foreground">
                {todayCounted ? (
                  <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Today counted</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Next in {timeUntilNextUtcMidnight()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-card p-2">
              <div className="text-[10px] text-muted-foreground">Current streak</div>
              <div className="text-lg font-semibold">{summary?.current ?? 0}</div>
            </div>
            <div className="rounded-md border bg-card p-2">
              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                Longest <Trophy className="h-3 w-3 text-yellow-500" />
              </div>
              <div className="text-lg font-semibold">{summary?.longest ?? 0}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Last 7 days</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> active</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border',
                      d.active ? 'bg-orange-500 border-orange-600' : 'bg-muted border-transparent'
                    )}
                    title={new Date(d.date).toUTCString()}
                  />
                </div>
              ))}
            </div>
          </div>

          {loading && (
            <div className="mt-3 text-[10px] text-muted-foreground">Updating…</div>
          )}
        </div>
      )}
    </div>
  );
}
