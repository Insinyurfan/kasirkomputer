import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/UserForm";

export const metadata = { title: "Edit pengguna — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const target = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!target) notFound();
  if (target.isOwner && !me.isOwner) redirect("/users?error=" + encodeURIComponent("Akun Owner hanya bisa diubah oleh Owner."));

  return (
    <>
      <h1 className="page-title">Edit pengguna</h1>
      <UserForm
        error={error}
        user={{
          id: target.id,
          displayName: target.displayName,
          username: target.username,
          role: target.role as "ADMIN" | "MEMBER",
          isOwner: target.isOwner,
        }}
      />
    </>
  );
}
