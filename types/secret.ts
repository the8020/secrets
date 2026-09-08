import { field, z } from "/p/the8020/db/fields.ts";

export const secretName: z.ZodString = field(z.string(), {
  label: "Secret",
  description: "A saved credential, such as a repository access token.",
  valueHelp: async ({ query, offset, limit }) => {
    const { default: Secrets } = await import("../tables/secrets.ts");
    const { sql } = await import("/p/the8020/db/mod.ts");
    const rows = await Secrets.select([Secrets.name])
      .where(
        sql<string>`lower(${sql.ref(Secrets.name)})`,
        "like",
        `%${query.trim().toLowerCase()}%`,
      ).orderBy(Secrets.name)
      .offset(offset).limit(limit + 1).execute();
    return {
      items: rows.slice(0, limit).map((row) => ({
        value: row.name,
        label: row.name,
      })),
      more: rows.length > limit,
    };
  },
  open: async (name) => {
    const { default: secrets } = await import(
      "/p/the8020/admin-core/programs/secrets/program.ts"
    );
    await secrets(name);
  },
});

export const secretInfo = z.object({
  value: field(z.string(), {
    label: "Value",
    description:
      "Paste the credential to save. Saving an existing secret **replaces** its current value.",
  }),
  updatedAt: field(z.string(), {
    label: "Last changed",
    description: "When this credential was most recently replaced.",
  }),
});
