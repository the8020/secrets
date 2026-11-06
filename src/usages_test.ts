import { assertEquals, assertThrows } from "@std/assert";
import { findSecretUsages, parseUsages } from "./usages.ts";

async function provider(root: string, id: string, body: string) {
  const dir = `${root}/${id}/programs/secret-usages`;
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/program.toml`,
    'schema = 1\ndescription = "Secret usages"\ndiscoverable = false\n',
  );
  await Deno.writeTextFile(`${dir}/program.ts`, body);
}

Deno.test("secret usages are collected from every package that reports them", async () => {
  const root = await Deno.makeTempDir({ prefix: "the8020-secret-usages-" });
  try {
    await provider(
      root,
      "acme/git",
      `export default (names) => names.map((secret) => ({
        secret, title: "Package acme/app", detail: "Repository credentials",
        open: { program: "acme/git/packages", arguments: ["acme/app"] },
      })).concat([{ secret: "unrequested", title: "Ignored" }]);`,
    );
    await provider(root, "acme/idle", "export default () => [];");
    await Deno.mkdir(`${root}/acme/plain/programs/other`, { recursive: true });
    assertEquals(await findSecretUsages(["github"], root), {
      usages: [{
        secret: "github",
        packageId: "acme/git",
        title: "Package acme/app",
        detail: "Repository credentials",
        open: { program: "acme/git/packages", arguments: ["acme/app"] },
      }],
      problems: [],
    });
    // A package that cannot answer must block deletion rather than pass.
    await provider(
      root,
      "acme/broken",
      'export default () => { throw new Error("database unavailable"); };',
    );
    const found = await findSecretUsages(["github"], root);
    assertEquals(found.usages.length, 1);
    assertEquals(found.problems.map((problem) => problem.packageId), [
      "acme/broken",
    ]);
    assertEquals(
      found.problems[0]!.message.includes("database unavailable"),
      true,
    );
    assertEquals(await findSecretUsages([], root), {
      usages: [],
      problems: [],
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("secret usage entries are validated and bounded", () => {
  assertEquals(parseUsages([{ secret: "a", title: "Place" }], "acme/x"), [{
    secret: "a",
    packageId: "acme/x",
    title: "Place",
    detail: "",
  }]);
  for (
    const invalid of [
      {},
      [{ secret: "a" }],
      [{ secret: "a", title: " " }],
      [{ secret: "a", title: "x".repeat(201) }],
      [{ secret: "a", title: "Place", open: { program: "not-an-id" } }],
      [{
        secret: "a",
        title: "Place",
        open: { program: "a/b/c", arguments: [1] },
      }],
      Array.from({ length: 1001 }, () => ({ secret: "a", title: "Place" })),
    ]
  ) assertThrows(() => parseUsages(invalid, "acme/x"), TypeError);
});
