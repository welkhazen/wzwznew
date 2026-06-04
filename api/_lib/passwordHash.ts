import bcrypt from "bcryptjs";

function getPepper(): string {
  return process.env.AUTH_PASSWORD_PEPPER ?? "";
}

function getRounds(): number {
  const raw = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "", 10);
  if (Number.isFinite(raw) && raw >= 4 && raw <= 15) return raw;
  return 10;
}

export async function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(`${rawPassword}${getPepper()}`, getRounds());
}

export async function verifyPassword(rawPassword: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith("$2")) return false;
  return bcrypt.compare(`${rawPassword}${getPepper()}`, storedHash);
}
