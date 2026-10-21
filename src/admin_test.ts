import { assertRejects } from "@std/assert";
import { authDatabase } from "/p/the8020/auth/src/test_support.ts";

Deno.test("user-facing secret operations require read or edit per name", async () => {
  const fixture = await authDatabase();
  const { secrets } = await import("./admin.ts");
  const users = await import("/p/the8020/users/src/admin.ts");
  try {
    await users.add("alice");
    fixture.asUser("alice");
    await assertRejects(
      () => secrets.get("github"),
      Error,
      "Permission denied: the8020.secrets.secret.read",
    );
    await assertRejects(
      () => secrets.set({ name: "github", value: "token" }),
      Error,
      "Permission denied: the8020.secrets.secret.edit",
    );
    await assertRejects(
      () => secrets.delete("github"),
      Error,
      "Permission denied: the8020.secrets.secret.edit",
    );
  } finally {
    fixture.close();
  }
});
