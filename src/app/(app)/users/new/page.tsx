import { requireAdmin } from "@/lib/auth";
import { UserForm } from "@/components/UserForm";

export const metadata = { title: "Pengguna baru — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <h1 className="page-title">Tambah pengguna</h1>
      <UserForm error={error} />
    </>
  );
}
