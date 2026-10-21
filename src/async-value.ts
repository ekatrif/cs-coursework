import { executePlan } from "./executor";
import { appendOperation, rootPlan, type PlanNode } from "./plan";
import type { ApplySchema } from "./schema";
import type { AsyncValue } from "./types";

type Materialized = () => Promise<unknown>;

function createProxy(
  source: PromiseLike<unknown> | unknown,
  plan: PlanNode,
): unknown {
  let execution: Promise<unknown> | undefined;

  const materialize: Materialized = () => {
    execution ??= executePlan(source, plan);
    return execution;
  };

  const target = () => undefined;

  return new Proxy(target, {
    get(_target, key) {
      if (key === "then" || key === "catch" || key === "finally") {
        const promise = materialize();
        const method = Reflect.get(promise, key, promise) as Function;
        return method.bind(promise);
      }

      if (key === Symbol.toStringTag) {
        return "AsyncValue";
      }

      return createProxy(
        source,
        appendOperation(plan, { type: "get", key }),
      );
    },

    apply(_target, _thisArgument, args) {
      return createProxy(
        source,
        appendOperation(plan, { type: "apply", args }),
      );
    },
  });
}

export function asyncValue<T>(
  source: T | PromiseLike<T>,
): AsyncValue<Awaited<T>>;
export function asyncValue<T, const S extends object>(
  source: T | PromiseLike<T>,
  schema: S,
): AsyncValue<ApplySchema<Awaited<T>, S>>;
export function asyncValue<T>(
  source: T | PromiseLike<T>,
  _schema?: object,
): AsyncValue<Awaited<T>> {
  return createProxy(source, rootPlan) as AsyncValue<Awaited<T>>;
}
