import Link from "next/link";
import { createUser, updateUser } from "@/app/actions/users";

type UserValues = {
  id: number;
  displayName: string;
  username: string;
  role: "ADMIN" | "MEMBER";
  isOwner: boolean;
};

export function UserForm({
  error,
  user,
}: {
  error?: string;
  user?: UserValues;
}) {
  const editing = !!user;
  return (
    <form action={editing ? updateUser : createUser} className="panel form-card">
      {editing ? <input type="hidden" name="id" value={user.id} /> : null}

      <div className="field">
        <label htmlFor="displayName">Nama tampilan</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={user?.displayName ?? ""}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          defaultValue={user?.username ?? ""}
          required
        />
      </div>

      <div className="field">
        <label>Role</label>
        {user?.isOwner ? (
          <>
            <input type="text" value="Owner (terkunci)" disabled />
            <p className="hint">Role Owner tidak bisa diubah.</p>
          </>
        ) : (
          <div className="role-choice">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="MEMBER"
                defaultChecked={(user?.role ?? "MEMBER") === "MEMBER"}
              />
              <span>
                <strong>Member</strong>
                <em>Akses penuh kasir; tidak bisa kelola akun.</em>
              </span>
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="ADMIN"
                defaultChecked={user?.role === "ADMIN"}
              />
              <span>
                <strong>Admin</strong>
                <em>Bisa menambah &amp; mengubah akun (tidak bisa menghapus).</em>
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor={editing ? "newPassword" : "password"}>
          {editing ? "Password baru (kosongkan jika tidak diubah)" : "Password"}
        </label>
        <input
          id={editing ? "newPassword" : "password"}
          name={editing ? "newPassword" : "password"}
          type="password"
          autoComplete="new-password"
          required={!editing}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="form-actions">
        <button className="btn" type="submit">
          {editing ? "Simpan perubahan" : "Buat pengguna"}
        </button>
        <Link className="btn secondary" href="/users">
          Batal
        </Link>
      </div>
    </form>
  );
}
