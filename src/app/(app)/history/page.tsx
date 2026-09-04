import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/money";
import { parseHistoryRange } from "@/lib/history-range";
import { voidSale } from "@/app/actions/sales";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Riwayat — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

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
  const range = parseHistoryRange(sp.from, sp.to);

  const sales = await prisma.sale.findMany({
    where: range.where,
    orderBy: { createdAt: "desc" },
  });

  const total = sales
    .filter((s) => !s.voided)
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const exportHref = (tpl: string) => {
    const q = new URLSearchParams();
    if (range.from) q.set("from", range.from);
    if (range.to) q.set("to", range.to);
    q.set("tpl", tpl);
    return `/history/export?${q}`;
  };
  const PDF_TEMPLATES = [
    { tpl: "thermal", label: "Struk Kasir 80mm" },
    { tpl: "nota", label: "Nota Toko (A5)" },
    { tpl: "invoice", label: "Invoice (A4)" },
  ];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Riwayat penjualan</h1>
        {sales.length > 0 ? (
          <details className="dl-menu">
            <summary className="btn secondary">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Unduh nota (PDF)
            </summary>
            <div className="dl-menu-list">
              <span className="dl-menu-head">Pilih desain struk</span>
              {PDF_TEMPLATES.map((t) => (
                <a key={t.tpl} href={exportHref(t.tpl)}>
                  {t.label}
                </a>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {sp.error ? <p className="error panel">{sp.error}</p> : null}

      <details className="filter-box" open={range.filtered}>
        <summary className="filter-toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M4 5h16l-6 8v5l-4 2v-7L4 5z" strokeLinejoin="round" />
          </svg>
          <span>Filter tanggal</span>
          {range.filtered ? (
            <span className="filter-badge">{range.label}</span>
          ) : null}
        </summary>
        <form className="filter-form" method="get">
          <div className="field">
            <label htmlFor="from">Dari tanggal</label>
            <input id="from" type="date" name="from" defaultValue={range.from ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="to">Sampai tanggal</label>
            <input id="to" type="date" name="to" defaultValue={range.to ?? ""} />
          </div>
          <button className="btn secondary" type="submit">
            Terapkan
          </button>
          {range.filtered ? (
            <Link className="btn btn-ghost btn-sm" href="/history">
              Tampilkan semua
            </Link>
          ) : null}
        </form>
      </details>

      <div className="panel total-strip">
        <span>
          Total penjualan ({range.label}, tanpa yang dibatalkan) · {sales.length}{" "}
          nota
        </span>
        <strong>{formatRupiah(total)}</strong>
      </div>

      {!me.isOwner ? (
        <p className="hint" style={{ marginTop: -8 }}>
          Hanya Owner yang bisa membatalkan (void) nota penjualan.
        </p>
      ) : null}

      <div className="panel table-wrap">
        {sales.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            {range.filtered
              ? "Tidak ada penjualan pada rentang tanggal ini."
              : "Belum ada penjualan."}
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
                    <a className="btn btn-sm secondary" href={`/receipt/${s.id}/pdf`}>
                      PDF
                    </a>
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
