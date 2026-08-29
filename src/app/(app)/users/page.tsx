import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUser } from "@/app/actions/users";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Pengguna — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

function fmt(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireAdmin();
  const { error } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Kelola Pengguna</h1>
        <Link className="btn" href="/users/new">
          + Tambah pengguna
        </Link>
      </div>

      {error ? <p className="error panel">{error}</p> : null}

      <div className="panel">
        <p className="hint">
          Semua Admin bisa menambah &amp; mengubah pengguna. <strong>Hanya
          Owner</strong> yang bisa menghapus akun, dan akun Owner tidak bisa
          dihapus siapa pun.
        </p>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const canDelete = me.isOwner && !u.isOwner;
              return (
                <tr key={u.id}>
                  <td>{u.displayName}</td>
                  <td>{u.username}</td>
                  <td>
                    {u.isOwner ? (
                      <span className="badge badge-owner">Owner</span>
                    ) : u.role === "ADMIN" ? (
                      <span className="badge badge-admin">Admin</span>
                    ) : (
                      <span className="badge">Member</span>
                    )}
                  </td>
                  <td>{fmt(u.createdAt)}</td>
                  <td className="row-actions">
                    <Link className="btn btn-sm secondary" href={`/users/${u.id}/edit`}>
                      Edit
                    </Link>
                    {canDelete ? (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <ConfirmButton confirm={`Hapus akun "${u.displayName}"?`}>
                          Hapus
                        </ConfirmButton>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
