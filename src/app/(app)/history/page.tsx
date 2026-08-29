import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/money";
import { voidSale } from "@/app/actions/sales";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Riwayat — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}
function endOfDay(s: string): Date | null {
  const start = startOfDay(s);
  if (!start) return null;
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
};
function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; error?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const from = sp.from || todayStr();
  const to = sp.to || from;

  const gte = startOfDay(from) ?? startOfDay(todayStr())!;
  const lte = endOfDay(to) ?? endOfDay(todayStr())!;

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte, lte } },
    orderBy: { createdAt: "desc" },
  });

  const filteredTotal = sales
    .filter((s) => !s.voided)
    .reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <>
      <h1 className="page-title">Riwayat penjualan</h1>

      {sp.error ? <p className="error panel">{sp.error}</p> : null}

      <form className="panel inline-form" method="get">
        <div className="field grow">
          <label htmlFor="from">Dari tanggal</label>
          <input id="from" type="date" name="from" defaultValue={from} />
        </div>
        <div className="field grow">
          <label htmlFor="to">Sampai tanggal</label>
          <input id="to" type="date" name="to" defaultValue={to} />
        </div>
        <button className="btn secondary" type="submit">
          Terapkan
        </button>
      </form>

      <div className="panel total-strip">
        <span>Total penjualan (tidak termasuk yang dibatalkan)</span>
        <strong>{formatRupiah(filteredTotal)}</strong>
      </div>

      {!me.isOwner ? (
        <p className="hint" style={{ marginTop: -8 }}>
          Hanya Owner yang bisa membatalkan (void) nota penjualan.
        </p>
      ) : null}

      <div className="panel table-wrap">
        {sales.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            Tidak ada penjualan pada rentang tanggal ini.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. Nota</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th className="num">Total</th>
                <th>Bayar</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/receipt/${s.id}`}>{s.receiptNo}</Link>
                  </td>
                  <td>{formatDateTime(s.createdAt)}</td>
                  <td>{s.cashierName ?? "—"}</td>
                  <td className="num">{formatRupiah(s.grandTotal)}</td>
                  <td>{PAYMENT_LABEL[s.paymentMethod] ?? s.paymentMethod}</td>
                  <td>
                    {s.voided ? (
                      <span className="badge badge-void">VOID</span>
                    ) : (
                      <span className="badge badge-ok">OK</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <Link className="btn btn-sm secondary" href={`/receipt/${s.id}`}>
                      Nota
                    </Link>
                    {s.voided ? (
                      <span className="hint">
                        {s.voidReason ? `Alasan: ${s.voidReason}` : "Dibatalkan"}
                      </span>
                    ) : me.isOwner ? (
                      <form action={voidSale} className="inline-form tight">
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          type="text"
                          name="reason"
                          placeholder="alasan (opsional)"
                          style={{ width: 140 }}
                        />
                        <ConfirmButton confirm={`Batalkan nota ${s.receiptNo}?`}>
                          Batalkan
                        </ConfirmButton>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
