export type Role = "ADMIN" | "MEMBER";

export function validateUsername(raw: string): string | { username: string } {
  const username = raw.trim();
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
    return "Username 3–20 karakter, hanya huruf, angka, titik, garis bawah.";
  }
  return { username };
}

export function validateDisplayName(raw: string): string | { displayName: string } {
  const displayName = raw.trim();
  if (displayName.length < 1 || displayName.length > 40) {
    return "Nama tampilan 1–40 karakter.";
  }
  return { displayName };
}

export function validatePassword(raw: string): string | { password: string } {
  if (raw.length < 6) return "Password minimal 6 karakter.";
  if (raw.length > 100) return "Password terlalu panjang.";
  return { password: raw };
}

export function validateRole(raw: string): Role {
  return raw === "ADMIN" ? "ADMIN" : "MEMBER";
}
