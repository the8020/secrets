import { getSecret } from "../../mod.ts";
import { requiredCommandArgument } from "/p/the8020/packages/commands.ts";
export default (...args: string[]) =>
  getSecret(requiredCommandArgument(args, 0, "secret name")).then((
    secret,
  ) => ({ secret }));
