import { collectOperations, type PlanNode } from "./plan";

function readableKey(key: PropertyKey): string {
  return typeof key === "symbol" ? key.toString() : JSON.stringify(key);
}

export async function executePlan(
  source: PromiseLike<unknown> | unknown,
  plan: PlanNode,
): Promise<unknown> {
  let value: unknown = await source;
  let receiver: unknown = undefined;

  for (const operation of collectOperations(plan)) {
    if (operation.type === "get") {
      if (value === null || value === undefined) {
        throw new TypeError(
          `Cannot read ${readableKey(operation.key)} from ${String(value)}`,
        );
      }

      receiver = value;
      value = Reflect.get(Object(value), operation.key, value);
    } else {
      if (typeof value !== "function") {
        throw new TypeError(`Cannot call a value of type ${typeof value}`);
      }

      value = Reflect.apply(value, receiver, operation.args);
      receiver = undefined;
    }

    value = await value;
  }

  return value;
}
