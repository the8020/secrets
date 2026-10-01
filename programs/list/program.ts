import { listSecrets } from "../../mod.ts";
export default () => listSecrets().then((secrets) => ({ secrets }));
