import { redirect } from "next/navigation";
import { needsSetup, startSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import {
  validateDisplayName,
  validatePassword,
  validateUsername,
} from "@/lib/account-input";

export const metadata = { title: "Setup — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await needsSetup())) redirect("/login");

  const { error } = await searchParams;

  async function createOwner(formData: FormData) {
    "use server";
    if (!(await needsSetup())) redirect("/login");

    const nameCheck = validateDisplayName(String(formData.get("displayName") ?? ""));
    if (typeof nameCheck === "string") {
      redirect(`/setup?error=${encodeURIComponent(nameCheck)}`);
    }
    const userCheck = validateUsername(String(formData.get("username") ?? ""));
    if (typeof userCheck === "string") {
      redirect(`/setup?error=${encodeURIComponent(userCheck)}`);
    }
    const passCheck = validatePassword(String(formData.get("password") ?? ""));
    if (typeof passCheck === "string") {
      redirect(`/setup?error=${encodeURIComponent(passCheck)}`);
    }
    if (String(formData.get("password")) !== String(formData.get("confirm"))) {
      redirect(`/setup?error=${encodeURIComponent("Konfirmasi password tidak cocok.")}`);
    }

    const owner = await prisma.user.create({
      data: {
        displayName: (nameCheck as { displayName: string }).displayName,
        username: (userCheck as { username: string }).username,
        passwordHash: await hashPassword((passCheck as { password: string }).password),
        role: "ADMIN",
        isOwner: true,
      },
    });
    await startSession(owner.id, true);
    redirect("/pos");
  }

  return (
    <AuthShell
      eyebrow="SETUP AWAL"
      title="AKUN PERTAMA"
      subtitle="Buat akun Owner"
      headline="Mulai dengan akun penguasa."
      blurb="Akun pertama ini adalah Owner — punya akses penuh dan tidak bisa dihapus oleh admin lain."
    >
      <p className="auth-lead">
        Belum ada akun. Buat akun <strong>Owner</strong> untuk mulai memakai
        aplikasi.
      </p>
      <form action={createOwner} className="auth-form">
        <div className="field">
          <label htmlFor="displayName">NAMA TAMPILAN</label>
          <input id="displayName" name="displayName" type="text" autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="username">USERNAME</label>
          <input id="username" name="username" type="text" autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="password">PASSWORD</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="field">
          <label htmlFor="confirm">ULANGI PASSWORD</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-lg btn-block" type="submit">
          BUAT AKUN OWNER
        </button>
      </form>
    </AuthShell>
  );
}
