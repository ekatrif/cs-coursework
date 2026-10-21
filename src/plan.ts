export type Operation =
  | Readonly<{
      type: "get";
      key: PropertyKey;
    }>
  | Readonly<{
      type: "apply";
      args: readonly unknown[];
    }>;

export interface PlanNode {
  readonly parent: PlanNode | null;
  readonly operation: Operation | null;
}

export const rootPlan: PlanNode = Object.freeze({
  parent: null,
  operation: null,
});

export function appendOperation(
  parent: PlanNode,
  operation: Operation,
): PlanNode {
  return Object.freeze({ parent, operation: Object.freeze(operation) });
}

export function collectOperations(node: PlanNode): readonly Operation[] {
  const reversed: Operation[] = [];
  let current: PlanNode | null = node;

  while (current !== null) {
    if (current.operation !== null) {
      reversed.push(current.operation);
    }

    current = current.parent;
  }

  reversed.reverse();
  return reversed;
}
