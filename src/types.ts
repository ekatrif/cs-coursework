// never[] позволяет распознать функцию с любыми параметрами, не разрешая передавать произвольные значения
// реальные типы аргументов выводятся ниже
type AnyFunction = (this: unknown, ...args: never[]) => unknown;

type AsyncFunction<Fn> = Fn extends (
  this: infer This,
  ...args: infer Args
) => infer Result
  ? (
      this: This,
      ...args: Args
    ) => AsyncValue<Awaited<Result>>
  : never;

type AsyncArrayMember<Member> =
// Если Member является функцией, то возвращаемая функция будет иметь те же аргументы, но возвращать AsyncValue<Awaited<Result>>
  Member extends (...args: infer Args) => infer Result
    ? (...args: Args) => AsyncValue<Awaited<Result>>
    : AsyncValue<Awaited<Member>>;

// Проходит по свойствам массива и применяет AsyncArrayMember к каждому элементу
type AsyncArrayMembers<Values extends readonly unknown[]> = {
  // Если убрать as Key, TypeScript воспримет этот тип как обычное преобразование элементов массива
  [Key in keyof Values as Key]: AsyncArrayMember<Values[Key]>;
};

type AsyncReducer<Values extends readonly unknown[]> = {
  (
    callback: (
      previousValue: Values[number],
      currentValue: Values[number],
      currentIndex: number,
      array: Values,
    ) => Values[number],
  ): AsyncValue<Values[number]>;
  <Result>(
    callback: (
      previousValue: Result,
      currentValue: Values[number],
      currentIndex: number,
      array: Values,
    ) => Result,
    initialValue: Result,
  ): AsyncValue<Result>;
};

type SpecialArrayMethod =
  | "map"
  | "flatMap"
  | "filter"
  | "find"
  | "findLast"
  | "flat"
  | "reduce"
  | "reduceRight";

type AsyncArrayShape<Values extends readonly unknown[]> =
  Omit<AsyncArrayMembers<Values>, SpecialArrayMethod> & {
    map<Result>(
      callback: (value: Values[number], index: number, array: Values) => Result,
      thisArg?: unknown,
    ): AsyncValue<Result[]>;
    flatMap<Result>(
      callback: (
        value: Values[number],
        index: number,
        array: Values,
      ) => Result | readonly Result[],
      thisArg?: unknown,
    ): AsyncValue<Result[]>;
    filter<Narrowed extends Values[number]>(
      predicate: (
        value: Values[number],
        index: number,
        array: Values,
      ) => value is Narrowed,
      thisArg?: unknown,
    ): AsyncValue<Narrowed[]>;
    filter(
      predicate: (value: Values[number], index: number, array: Values) => unknown,
      thisArg?: unknown,
    ): AsyncValue<Values[number][]>;
    find<Narrowed extends Values[number]>(
      predicate: (
        value: Values[number],
        index: number,
        array: Values,
      ) => value is Narrowed,
      thisArg?: unknown,
    ): AsyncValue<Narrowed | undefined>;
    find(
      predicate: (value: Values[number], index: number, array: Values) => unknown,
      thisArg?: unknown,
    ): AsyncValue<Values[number] | undefined>;
    findLast<Narrowed extends Values[number]>(
      predicate: (
        value: Values[number],
        index: number,
        array: Values,
      ) => value is Narrowed,
      thisArg?: unknown,
    ): AsyncValue<Narrowed | undefined>;
    findLast(
      predicate: (value: Values[number], index: number, array: Values) => unknown,
      thisArg?: unknown,
    ): AsyncValue<Values[number] | undefined>;
    flat<Depth extends number = 1>(
      depth?: Depth,
    ): AsyncValue<FlatArray<Values, Depth>[]>;
    reduce: AsyncReducer<Values>;
    reduceRight: AsyncReducer<Values>;
  };

export type AsyncArray<Item> = AsyncArrayShape<Item[]>;

type AsyncObject<T> = {
  [Key in keyof T]: AsyncValue<Awaited<T[Key]>>;
};

type AsyncShape<T> =
  T extends AnyFunction
    ? AsyncFunction<T>
    : T extends readonly unknown[]
      ? AsyncArrayShape<T>
      : T extends object
        ? AsyncObject<T>
        // Методы примитивов преобразуются в методы асинхронной цепочки
        : T extends string
          ? AsyncObject<String>
          : T extends number
            ? AsyncObject<Number>
            : T extends boolean
              ? AsyncObject<Boolean>
              : T extends bigint
                ? AsyncObject<BigInt>
                : {};


export type AsyncValue<T> = Promise<Awaited<T>> & AsyncShape<Awaited<T>>;
