import { assertEquals } from "@std/assert";
import { kernelDatabaseBackendSymbol } from "@the8020/kernel";

(globalThis as unknown as Record<symbol, unknown>)[
  kernelDatabaseBackendSymbol
] = "sqlite";
const { descriptorOf } = await import("/p/the8020/db/mod.ts");
const Secrets = (await import("./secrets.ts")).default;

Deno.test("named secret schema stays minimal", () => {
  assertEquals(Secrets.table, "the8020__secrets__secrets");
  assertEquals(
    descriptorOf(Secrets).columns.map((column) => column.name),
    ["name", "value", "updatedAt"],
  );
});
