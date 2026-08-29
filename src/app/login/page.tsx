import { redirect } from "next/navigation";
import { getCurrentUser, needsSetup, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Masuk — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await needsSetup()) redirect("/setup");
  if (await getCurrentUser()) redirect("/pos");

  const { error } = await searchParams;
  const settings = await getSettings();

  async function login(formData: FormData) {
    "use server";
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    const user = await prisma.user.findUnique({ where: { username } });
    const ok = user && (await verifyPassword(password, user.passwordHash));
    if (!ok || !user) redirect("/login?error=1");

    await startSession(user.id, remember);
    redirect("/pos");
  }

  return (
    <AuthShell
      shop={{ name: settings.shopName, logoUrl: settings.logoUrl }}
      eyebrow="AREA TERBATAS"
      title="AREA TERBATAS"
      subtitle="Login"
      headline="Kelola toko dari satu layar."
      blurb="Kasir, produk, riwayat penjualan, dan akun — semua rapi dalam dashboard yang mudah dipakai."
    >
      <p className="auth-lead">
        Masuk untuk mengelola kasir, katalog produk, dan laporan operasional.
      </p>
      <form action={login} className="auth-form">
        <div className="field">
          <label htmlFor="username">USERNAME</label>
          <div className="input-icon">
            <span aria-hidden>&#128100;</span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">PASSWORD</label>
          <div className="input-icon">
            <span aria-hidden>&#128274;</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        <label className="auth-check">
          <input type="checkbox" name="remember" />
          <span>Ingat saya</span>
        </label>
        {error ? <p className="error">Username atau password salah.</p> : null}
        <button className="btn btn-lg btn-block" type="submit">
          MASUK SEKARANG
        </button>
      </form>
      <p className="auth-foot">
        Belum punya akun? Hubungi Admin toko untuk dibuatkan.
      </p>
    </AuthShell>
  );
}
