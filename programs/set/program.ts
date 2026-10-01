import { kernel } from "@the8020/kernel";
import { setSecret } from "../../mod.ts";
import { requiredCommandArgument } from "/p/the8020/packages/commands.ts";
export default (...args: string[]) =>
  setSecret({
    name: requiredCommandArgument(args, 0, "secret name"),
    value: kernel.execution.secret("value"),
  }).then((secret) => ({ secret }));
