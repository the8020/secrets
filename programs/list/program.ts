import { secrets } from "../../src/admin.ts";
export default () => secrets.list().then((secrets) => ({ secrets }));
