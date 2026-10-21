import { secrets } from "../../src/admin.ts";
import { requiredCommandArgument } from "/p/the8020/packages/commands.ts";
export default (...args: string[]) =>
  secrets.get(requiredCommandArgument(args, 0, "secret name")).then((
    secret,
  ) => ({ secret }));
