"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  validateDisplayName,
  validatePassword,
  validateRole,
  validateUsername,
} from "@/lib/account-input";

function backTo(path: string, msg: string): never {
  redirect(`${path}?error=${encodeURIComponent(msg)}`);
}

export async function createUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const P = "/users/new";

  const nameCheck = validateDisplayName(String(formData.get("displayName") ?? ""));
  if (typeof nameCheck === "string") backTo(P, nameCheck);
  const userCheck = validateUsername(String(formData.get("username") ?? ""));
  if (typeof userCheck === "string") backTo(P, userCheck);
  const passCheck = validatePassword(String(formData.get("password") ?? ""));
  if (typeof passCheck === "string") backTo(P, passCheck);
  const role = validateRole(String(formData.get("role") ?? "MEMBER"));

  try {
    await prisma.user.create({
      data: {
        displayName: (nameCheck as { displayName: string }).displayName,
        username: (userCheck as { username: string }).username,
        passwordHash: await hashPassword((passCheck as { password: string }).password),
        role,
        isOwner: false,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      backTo(P, "Username sudah dipakai.");
    }
    throw e;
  }

  redirect("/users");
}

export async function updateUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/users");
  const P = `/users/${id}/edit`;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/users");

  // The owner account can only be edited by the owner.
  if (target.isOwner && !me.isOwner) {
    backTo("/users", "Akun Owner hanya bisa diubah oleh Owner sendiri.");
  }

  const nameCheck = validateDisplayName(String(formData.get("displayName") ?? ""));
  if (typeof nameCheck === "string") backTo(P, nameCheck);
  const userCheck = validateUsername(String(formData.get("username") ?? ""));
  if (typeof userCheck === "string") backTo(P, userCheck);

  const data: Prisma.UserUpdateInput = {
    displayName: (nameCheck as { displayName: string }).displayName,
    username: (userCheck as { username: string }).username,
  };

  // The owner's role is locked to ADMIN.
  if (!target.isOwner) {
    data.role = validateRole(String(formData.get("role") ?? target.role));
  }

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword) {
    const passCheck = validatePassword(newPassword);
    if (typeof passCheck === "string") backTo(P, passCheck);
    data.passwordHash = await hashPassword(newPassword);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      backTo(P, "Username sudah dipakai akun lain.");
    }
    throw e;
  }

  redirect("/users");
}

export async function deleteUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/users");

  // Only the Owner may delete accounts.
  if (!me.isOwner) {
    backTo("/users", "Hanya Owner yang bisa menghapus akun.");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/users");

  // The Owner account can never be deleted (including by the owner themselves).
  if (target.isOwner) {
    backTo("/users", "Akun Owner tidak bisa dihapus.");
  }

  await prisma.user.delete({ where: { id } });
  redirect("/users");
}
