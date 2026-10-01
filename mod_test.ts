import { assert, assertEquals, assertRejects } from "@std/assert";
import { DatabaseSync } from "node:sqlite";
import {
  kernelDatabaseBackendSymbol,
  type KernelInvoke,
  kernelInvokeSymbol,
} from "@the8020/kernel";
import { createTableSQL } from "/p/the8020/db/internal/ddl.ts";

const globals = globalThis as unknown as Record<symbol, unknown>;
globals[kernelDatabaseBackendSymbol] = "sqlite";
const { descriptorOf } = await import("/p/the8020/db/mod.ts");
const { default: Secrets } = await import("./tables/secrets.ts");
const { getSecret, setSecret, listSecrets } = await import("./mod.ts");

Deno.test("secret storage encrypts writes and authenticates reads without exposing values in summaries", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(createTableSQL("sqlite", descriptorOf(Secrets)));
  const previous = globals[kernelInvokeSymbol];
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
  globals[kernelInvokeSymbol] = (async (operation, input) => {
    if (operation === "database.execute") {
      const statement = database.prepare(String(input.statement));
      const parameters = (input.parameters as unknown[]).map((value) =>
        value !== null && typeof value === "object"
          ? (value as { value: string }).value
          : value
      ) as Array<string | number | null>;
      if (input.return_rows) {
        const rows = statement.all(...parameters),
          columns = statement.columns().map((column) => column.name);
        return {
          columns,
          rows: rows.map((row) => columns.map((column) => row[column])),
        };
      }
      const result = statement.run(...parameters);
      return {
        columns: [],
        rows: [],
        affected_rows: { type: "bigint", value: String(result.changes) },
      };
    }
    assertEquals(operation, "runtime.operation");
    const args = input.input as {
      purpose: string;
      data: string;
      encrypted: string;
      associated_data: string;
    };
    assertEquals(args.purpose, "app-secret-store");
    const additionalData = Uint8Array.fromBase64(args.associated_data);
    if (input.operation === "crypto.encrypt") {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: "AES-GCM", iv, additionalData },
          key,
          Uint8Array.fromBase64(args.data),
        ),
      );
      return {
        success: true,
        result: {
          encrypted: "v1:" + new Uint8Array([...iv, ...ciphertext]).toBase64(),
        },
      };
    }
    assertEquals(input.operation, "crypto.decrypt");
    const bytes = Uint8Array.fromBase64(args.encrypted.slice(3));
    const data = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.slice(0, 12), additionalData },
        key,
        bytes.slice(12),
      ),
    );
    return { success: true, result: { data: data.toBase64() } };
  }) satisfies KernelInvoke;
  try {
    const value = "  páss:word  ";
    const summary = await setSecret({ name: "github", value });
    assertEquals("value" in summary, false);
    assertEquals((await getSecret("github")).value, value);
    const stored = String(
      database.prepare(
        "SELECT value FROM the8020__secrets__secrets WHERE name='github'",
      ).get()?.value,
    );
    assert(stored.startsWith("v1:") && !stored.includes(value));
    assertEquals(await listSecrets(), [summary]);
    await setSecret({ name: "github", value });
    assert(
      stored !==
        database.prepare(
          "SELECT value FROM the8020__secrets__secrets WHERE name='github'",
        ).get()?.value,
    );
    database.prepare(
      "INSERT INTO the8020__secrets__secrets VALUES ('other', ?, ?)",
    ).run(stored, summary.updated_at);
    await assertRejects(() => getSecret("other"));
    database.prepare(
      "UPDATE the8020__secrets__secrets SET value='plaintext' WHERE name='github'",
    ).run();
    await assertRejects(() => getSecret("github"));
    for (
      const input of [
        { name: "../bad", value },
        { name: "github", value: "" },
        { name: "github", value: "x".repeat(65537) },
      ]
    ) {
      await assertRejects(() => setSecret(input));
    }
  } finally {
    globals[kernelInvokeSymbol] = previous;
    database.close();
  }
});
