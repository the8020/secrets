import { field, z } from "/p/the8020/db/fields.ts";

export const secretName: z.ZodString = field(z.string(), {
  label: "Secret",
  description: "A saved credential, such as a repository access token.",
  valueHelp: async (request) => {
    const { default: Secrets } = await import("../tables/secrets.ts");
    const { lookupPage } = await import("/p/the8020/db/lookup.ts");
    return lookupPage(
      z.object({ name: secretName }),
      Secrets.select([Secrets.name]),
      request,
    );
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
