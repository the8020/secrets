import { msg } from "/p/the8020/secrets/i18n/messages.ts";
import { field, z } from "/p/the8020/db/fields.ts";

export const secretName: z.ZodString = field(
  z.string().trim().max(128).regex(/^(?:[A-Za-z0-9][A-Za-z0-9._-]*)?$/),
  {
    label: msg("secret.secret"),
    description: msg("secret.a_saved_credential_such_as_a_repository"),
    valueHelp: async (request) => {
      const { default: Secrets } = await import("../tables/secrets.ts");
      const { lookupPage } = await import("/p/the8020/db/lookup.ts");
      const { sqlPredicate } = await import("/p/the8020/auth/mod.ts");
      const { context } = await import("@the8020/context");
      const { VIEW } = await import("../src/admin.ts");
      // Offer only names the current user may view.
      const viewable = await sqlPredicate(context.username, VIEW, "name");
      return lookupPage(
        z.object({ name: secretName }),
        Secrets.select([Secrets.name]).where(viewable),
        request,
      );
    },
    open: async (name) => {
      const { default: secrets } = await import(
        "/p/the8020/admin-core/programs/secrets/program.ts"
      );
      await secrets(name);
    },
  },
);

export const secretInfo = z.object({
  value: field(z.string(), {
    label: msg("secret.value"),
    description: msg("secret.paste_the_credential_to_save_saving_an"),
  }),
  updatedAt: field(z.string(), {
    label: msg("secret.last_changed"),
    description: msg("secret.when_this_credential_was_most_recently_replaced"),
  }),
});
