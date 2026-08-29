// Password recovery tool — resets an existing user's password directly in the DB.
//
//   npm run set-password -- <username> <new-password>
//
// Use this if you are locked out. It does NOT create accounts (the first account
// is created from the /setup page in the app).

import { scryptSync, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: npm run set-password -- <username> <new-password>');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password minimal 6 karakter.");
  process.exit(1);
}

const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { username } });
if (!user) {
  console.error(`User "${username}" tidak ditemukan.`);
  await prisma.$disconnect();
  process.exit(1);
}
await prisma.user.update({
  where: { id: user.id },
  data: { passwordHash: hashPassword(password) },
});
await prisma.$disconnect();
console.log(`Password untuk "${username}" berhasil direset.`);
