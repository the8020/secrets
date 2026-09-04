import { kernel, requiredCommandArgument } from "@the8020/kernel";
export default (...args: string[]) =>
  kernel.secrets.get(requiredCommandArgument(args, 0, "secret name")).then((
    secret,
  ) => ({ secret }));
