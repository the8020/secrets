import { context } from "@the8020/context";
import { filter, requirePermission } from "/p/the8020/auth/mod.ts";
import { deleteSecret, getSecret, listSecrets, setSecret } from "../mod.ts";

export const VIEW = "the8020.secrets.secret.view";
const READ = "the8020.secrets.secret.read";
const EDIT = "the8020.secrets.secret.edit";

/**
 * User-facing secret operations. `mod.ts` stays the trusted consumer API for
 * packages that authorize their own operations, such as HTTPS certificates.
 */
export const secrets = {
  /** Names and update times of secrets the current user may view. */
  async list() {
    return await filter(context.username, await listSecrets(), { name: VIEW });
  },
  /** Decrypts a value; requires read for that secret name. */
  async get(name: string) {
    await requirePermission(READ, name);
    return await getSecret(name);
  },
  async set(input: { name: string; value: string }) {
    await requirePermission(EDIT, input.name);
    return await setSecret(input);
  },
  async delete(name: string) {
    await requirePermission(EDIT, name);
    await deleteSecret(name);
  },
};
