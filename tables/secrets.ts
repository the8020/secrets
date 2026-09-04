import { type Row, t, table, type TableDatabase } from "@the8020/db";

const Secrets = table("the8020__secrets__secrets", {
  name: t.text().primaryKey(),
  value: t.text(),
  updatedAt: t.datetime().defaultNow(),
});

declare module "@the8020/db/types" {
  interface Database extends TableDatabase<typeof Secrets> {}
}

export type SecretRow = Row<typeof Secrets>;
export default Secrets;
