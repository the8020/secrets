import { context } from "@the8020/context";
import { filter, requirePermission } from "/p/the8020/auth/mod.ts";
import { text as localizedText } from "/p/the8020/i18n/mod.ts";
import { msg } from "/p/the8020/secrets/i18n/messages.ts";
import { deleteSecret, getSecret, listSecrets, setSecret } from "../mod.ts";
import {
  findSecretUsages,
  type SecretUsage,
  type SecretUsageProblem,
} from "./usages.ts";

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
  /** Where installed packages refer to this secret; requires view. */
  async usages(name: string) {
    await requirePermission(VIEW, name);
    return await findSecretUsages([name]);
  },
  /** Deletes only a secret that no installed package refers to. */
  async delete(name: string) {
    await requirePermission(EDIT, name);
    const { usages, problems } = await findSecretUsages([name]);
    if (usages.length > 0 || problems.length > 0) {
      throw new SecretInUseError(name, usages, problems);
    }
    await deleteSecret(name);
  },
};

/** Deletion refused: the secret is in use, or a package could not be checked. */
export class SecretInUseError extends Error {
  constructor(
    readonly secret: string,
    readonly usages: SecretUsage[],
    readonly problems: SecretUsageProblem[],
  ) {
    super(localizedText(
      usages.length > 0
        ? msg("admin.secret_is_in_use", { name: secret })
        : msg("admin.secret_usage_could_not_be_checked", { name: secret }),
    ));
    this.name = "SecretInUseError";
  }
}
