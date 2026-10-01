import { kernel } from "@the8020/kernel";
import Secrets from "./tables/secrets.ts";
import { secretInfo, secretName } from "./types/secret.ts";

const purpose = "app-secret-store";
const encoder = new TextEncoder();

export async function listSecrets() {
  const rows = await Secrets.select([Secrets.name, Secrets.updatedAt])
    .orderBy(Secrets.name).limit(10001).execute();
  if (rows.length > 10000) {
    throw new Error("Secret listing exceeds 10000 entries");
  }
  return rows.map((row) => ({
    name: row.name,
    updated_at: row.updatedAt.toISOString(),
  }));
}

export async function getSecret(name: string) {
  name = secretName.min(1).parse(name);
  const row = await Secrets.selectAll().where(Secrets.name, "=", name)
    .executeTakeFirstOrThrow();
  const value = new TextDecoder("utf-8", { fatal: true }).decode(
    await kernel.crypto.decrypt(purpose, row.value, encoder.encode(name)),
  );
  return { name, value, updated_at: row.updatedAt.toISOString() };
}

export async function setSecret(input: { name: string; value: string }) {
  const name = secretName.min(1).parse(input.name);
  const value = secretInfo.shape.value.parse(input.value);
  if (
    !value.isWellFormed() || value.length === 0 ||
    encoder.encode(value).length > 64 * 1024
  ) {
    throw new TypeError("Secret value must contain 1–65536 UTF-8 bytes");
  }
  const encrypted = await kernel.crypto.encrypt(
    purpose,
    encoder.encode(value),
    encoder.encode(name),
  );
  const updatedAt = new Date();
  await Secrets.insert({ name, value: encrypted, updatedAt }).onConflict((
    conflict,
  ) => conflict.column("name").doUpdateSet({ value: encrypted, updatedAt }))
    .execute();
  return { name, updated_at: updatedAt.toISOString() };
}
