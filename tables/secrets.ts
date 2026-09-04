import { type Row, t, table, type TableDatabase } from "/p/the8020/db/mod.ts";

const Secrets = table("the8020__secrets__secrets", {
  name: t.text().primaryKey(),
  value: t.text(),
  updatedAt: t.datetime().defaultNow(),
});

declare module "/p/the8020/db/types.ts" {
  interface Database extends TableDatabase<typeof Secrets> {}
}

export type SecretRow = Row<typeof Secrets>;
export default Secrets;
