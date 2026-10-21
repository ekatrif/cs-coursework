export type SchemaPrimitive =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | BigIntConstructor
  | SymbolConstructor;

export type Schema =
  | SchemaPrimitive
  | readonly Schema[]
  | { readonly [key: PropertyKey]: Schema }
  | ((...args: never[]) => Schema);

export type InferSchema<S> =
  S extends StringConstructor
    ? string
    : S extends NumberConstructor
      ? number
      : S extends BooleanConstructor
        ? boolean
        : S extends BigIntConstructor
          ? bigint
          : S extends SymbolConstructor
            ? symbol
            : S extends readonly (infer Item)[]
              ? InferSchema<Item>[]
              : S extends (...args: infer Args) => infer Result
                ? (...args: Args) => InferSchema<Result>
                : S extends object
                  ? { [Key in keyof S]: InferSchema<S[Key]> }
                  : never;

type MergeFunction<T, S extends (...args: never[]) => unknown> =
  T extends (...args: infer Args) => infer Result
    ? (...args: Args) => ApplySchema<Awaited<Result>, ReturnType<S>>
    : InferSchema<S>;

type MergeObject<T, S extends object> =
  (T extends object ? Omit<T, keyof S> : unknown) & {
    [Key in keyof S]: ApplySchema<
      Key extends keyof T ? T[Key] : unknown,
      S[Key]
    >;
  };

// Applies a type-only schema on top of an inferred runtime type.
// Keys not mentioned by the schema remain available from the inferred type.

export type ApplySchema<T, S> =
  S extends SchemaPrimitive
    ? InferSchema<S>
    : S extends readonly (infer Item)[]
      ? InferSchema<Item>[]
      : S extends (...args: never[]) => unknown
        ? MergeFunction<T, S>
        : S extends object
          ? MergeObject<T, S>
          : T;
