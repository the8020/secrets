import { assertEquals } from "@std/assert";
import {
  kernelDatabaseBackendSymbol,
  kernelInvokeSymbol,
} from "@the8020/kernel";
import { fieldMetadata } from "/p/the8020/db/fields.ts";
import { secretName } from "../types/secret.ts";
import { installContextProvider } from "../../kernel/defaults/config/runtime/deno/context/runtime.ts";

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

Deno.test("secret value help reads only names and applies database paging", async () => {
  const globals = globalThis as unknown as Record<symbol, unknown>;
  const previous = globals[kernelInvokeSymbol];
  globals[kernelInvokeSymbol] = (
    operation: string,
    input: Record<string, unknown>,
  ) => {
    assertEquals(operation, "database.execute");
    const statement = String(input.statement);
    assertEquals(statement.includes('"value"'), false);
    assertEquals(statement.includes("select *"), false);
    assertEquals(statement.includes("lower("), true);
    const parameters = input.parameters as unknown[];
    assertEquals(parameters.includes("%git%"), true);
    if (statement.includes("count(*)")) {
      return Promise.resolve({ columns: ["total"], rows: [[5]] });
    }
    assertEquals(parameters.includes(1), true);
    assertEquals(parameters.includes(3), true);
    return Promise.resolve({
      columns: ["name"],
      rows: [["GitHub"]],
    });
  };
  // The system principal sees every name; others get a permission filter.
  const restore = installContextProvider(() => ({
    type: "program",
    id: "the8020/secrets/test",
    userId: "user:system",
    username: "system",
    authenticated: true,
    nodeId: "test",
    sandboxId: "test",
    workerId: "test",
    contextId: "test",
  }));
  try {
    const page = await fieldMetadata(secretName)?.valueHelp?.({
      query: { search: " GIT ", filters: {}, sort: null },
      offset: 3,
      limit: 1,
    });
    assertEquals(page?.rows, [{ name: "GitHub" }]);
    assertEquals([page?.more, page?.totalItems], [true, 5]);
  } finally {
    restore();
    globals[kernelInvokeSymbol] = previous;
  }
});
