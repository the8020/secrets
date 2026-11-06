import { secretName } from "../types/secret.ts";

/** One place where an installed package refers to a named secret. */
export interface SecretUsage {
  secret: string;
  packageId: string;
  title: string;
  detail: string;
  /** UUI program, with its arguments, that opens the referring record. */
  open?: { program: string; arguments: string[] };
}

/** A package whose usages could not be read, so deletion stays blocked. */
export interface SecretUsageProblem {
  packageId: string;
  message: string;
}

/** Packages provide this non-interactive program to report their references. */
export const USAGE_PROGRAM = "secret-usages";
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const PROGRAM_ID =
  /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*){2}$/;
const MAX_USAGES = 1000;

/**
 * Ask every installed package's `secret-usages` program where it refers to the
 * given names. Each program receives the names and returns usage objects.
 */
export async function findSecretUsages(
  names: string[],
  packagesRoot = "/workspace/packages",
): Promise<{ usages: SecretUsage[]; problems: SecretUsageProblem[] }> {
  const wanted = new Set(names.map((name) => secretName.min(1).parse(name)));
  const usages: SecretUsage[] = [];
  const problems: SecretUsageProblem[] = [];
  if (wanted.size === 0) return { usages, problems };
  const { invokeProgram } = await import("/p/the8020/uui/programs.ts");
  for (const packageId of await providers(packagesRoot)) {
    try {
      const result = await invokeProgram(
        `${packageId}/${USAGE_PROGRAM}`,
        [[...wanted]],
        packagesRoot,
      );
      for (const usage of parseUsages(result, packageId)) {
        if (wanted.has(usage.secret)) usages.push(usage);
      }
    } catch (error) {
      problems.push({
        packageId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  usages.sort((a, b) =>
    a.secret.localeCompare(b.secret) ||
    a.packageId.localeCompare(b.packageId) ||
    a.title.localeCompare(b.title)
  );
  return { usages, problems };
}

async function providers(root: string): Promise<string[]> {
  const ids: string[] = [];
  for await (const namespace of Deno.readDir(root)) {
    if (!namespace.isDirectory || !SEGMENT.test(namespace.name)) continue;
    for await (const repository of Deno.readDir(`${root}/${namespace.name}`)) {
      if (!repository.isDirectory || !SEGMENT.test(repository.name)) continue;
      const id = `${namespace.name}/${repository.name}`;
      try {
        const info = await Deno.lstat(
          `${root}/${id}/programs/${USAGE_PROGRAM}/program.toml`,
        );
        if (info.isFile) ids.push(id);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    }
  }
  return ids.sort();
}

export function parseUsages(value: unknown, packageId: string): SecretUsage[] {
  if (!Array.isArray(value) || value.length > MAX_USAGES) {
    throw new TypeError(
      `secret usages must be an array of at most ${MAX_USAGES} entries`,
    );
  }
  return value.map((entry) => {
    const usage = entry as Record<string, unknown> | null;
    const open = usage?.open as Record<string, unknown> | undefined;
    if (
      typeof usage !== "object" || usage === null ||
      typeof usage.secret !== "string" ||
      typeof usage.title !== "string" || usage.title.trim() === "" ||
      usage.title.length > 200 ||
      (usage.detail !== undefined &&
        (typeof usage.detail !== "string" || usage.detail.length > 500)) ||
      (open !== undefined &&
        (typeof open !== "object" || open === null ||
          typeof open.program !== "string" || !PROGRAM_ID.test(open.program) ||
          (open.arguments !== undefined &&
            (!Array.isArray(open.arguments) || open.arguments.length > 8 ||
              open.arguments.some((item) => typeof item !== "string")))))
    ) {
      throw new TypeError("invalid secret usage entry");
    }
    return {
      secret: usage.secret,
      packageId,
      title: usage.title,
      detail: (usage.detail as string | undefined) ?? "",
      ...(open
        ? {
          open: {
            program: open.program as string,
            arguments: (open.arguments as string[] | undefined) ?? [],
          },
        }
        : {}),
    };
  });
}
