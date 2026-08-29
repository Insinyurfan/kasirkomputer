import { getCurrentUser } from "@/lib/auth";
import { updateOwnAccount } from "@/app/actions/account";
import { redirect } from "next/navigation";

export const metadata = { title: "Akun Saya — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error, ok } = await searchParams;

  const roleLabel = user.isOwner
    ? "Owner (penguasa)"
    : user.role === "ADMIN"
      ? "Admin"
      : "Member";

  return (
    <>
      <h1 className="page-title">Pengaturan Akun</h1>

      <div className="panel">
        <div className="kv">
          <span>Role</span>
          <strong>
            {roleLabel}
            {user.isOwner ? (
              <span className="badge badge-owner" style={{ marginLeft: 8 }}>
                tidak bisa dihapus
              </span>
            ) : null}
          </strong>
        </div>
        <p className="hint">
          Role hanya bisa diubah oleh Admin dari halaman Pengguna.
        </p>
      </div>

      <form action={updateOwnAccount} className="panel">
        <div className="field">
          <label htmlFor="displayName">Nama tampilan</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={user.displayName}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={user.username}
            required
          />
        </div>

        <hr className="divider" />
        <p className="hint">
          Isi bagian di bawah hanya jika ingin mengganti password.
        </p>
        <div className="field">
          <label htmlFor="currentPassword">Password saat ini</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
        </div>
        <div className="field">
          <label htmlFor="newPassword">Password baru</label>
          <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
        </div>

        {error ? <p className="error">{error}</p> : null}
        {ok ? <p className="ok-text">Perubahan tersimpan.</p> : null}
        <button className="btn" type="submit">
          Simpan perubahan
        </button>
      </form>
    </>
  );
}
