import { kernel } from "@the8020/kernel";
export default () => kernel.secrets.list().then((secrets) => ({ secrets }));
