"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  validateDisplayName,
  validatePassword,
  validateUsername,
} from "@/lib/account-input";

function back(msg: string): never {
  redirect(`/account?error=${encodeURIComponent(msg)}`);
}

export async function updateOwnAccount(formData: FormData): Promise<void> {
  const me = await requireUser();

  const nameCheck = validateDisplayName(String(formData.get("displayName") ?? ""));
  if (typeof nameCheck === "string") back(nameCheck);
  const userCheck = validateUsername(String(formData.get("username") ?? ""));
  if (typeof userCheck === "string") back(userCheck);

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const dbUser = await prisma.user.findUnique({ where: { id: me.id } });
  if (!dbUser) back("Akun tidak ditemukan.");

  const data: Prisma.UserUpdateInput = {
    displayName: (nameCheck as { displayName: string }).displayName,
    username: (userCheck as { username: string }).username,
  };

  if (newPassword) {
    if (!(await verifyPassword(currentPassword, dbUser.passwordHash))) {
      back("Password lama salah.");
    }
    const passCheck = validatePassword(newPassword);
    if (typeof passCheck === "string") back(passCheck);
    data.passwordHash = await hashPassword(newPassword);
  }

  try {
    await prisma.user.update({ where: { id: me.id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      back("Username sudah dipakai akun lain.");
    }
    throw e;
  }

  redirect("/account?ok=1");
}
