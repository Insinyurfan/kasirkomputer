import type { Prisma } from "@prisma/client";

export function startOfDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}
export function endOfDay(s: string): Date | null {
  const start = startOfDay(s);
  if (!start) return null;
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
export function fmtDate(s: string): string {
  const d = startOfDay(s);
  if (!d) return s;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export type HistoryRange = {
  from: string | null;
  to: string | null;
  filtered: boolean;
  where: Prisma.SaleWhereInput;
  label: string;
};

export function parseHistoryRange(
  fromRaw?: string | null,
  toRaw?: string | null,
): HistoryRange {
  const from = startOfDay(fromRaw ?? "") ? fromRaw! : null;
  const to = startOfDay(toRaw ?? "") ? toRaw! : null;
  const filtered = !!(from || to);

  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = startOfDay(from)!;
  if (to) createdAt.lte = endOfDay(to)!;

  return {
    from,
    to,
    filtered,
    where: filtered ? { createdAt } : {},
    label: filtered
      ? `${from ? fmtDate(from) : "awal"} – ${to ? fmtDate(to) : "sekarang"}`
      : "semua waktu",
  };
}
