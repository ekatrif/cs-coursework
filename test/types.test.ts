import { asyncValue, type AsyncArray, type AsyncValue, type InferSchema } from "../src";

type Equal<Left, Right> =
  (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2)
    ? true
    : false;

type Expect<T extends true> = T;

const user = asyncValue(
  Promise.resolve({ id: 42, name: "Bob", tags: ["admin"] }),
);

type UserName = Awaited<typeof user.name>;
type UserId = Awaited<typeof user.id>;
type UpperName = Awaited<ReturnType<typeof user.name.toUpperCase>>;
type MappedTags = Awaited<ReturnType<typeof user.tags.map<number>>>;

type _userName = Expect<Equal<UserName, string>>;
type _userId = Expect<Equal<UserId, number>>;
type _upperName = Expect<Equal<UpperName, string>>;
type _upperNameAsync = Expect<
  Equal<ReturnType<typeof user.name.toUpperCase>, AsyncValue<string>>
>;
type _fixedIdAsync = Expect<
  Equal<ReturnType<typeof user.id.toFixed>, AsyncValue<string>>
>;
type _mappedTags = Expect<Equal<MappedTags, number[]>>;

user.tags.map(tag => tag.length);

const numbers = asyncValue(Promise.resolve([3, 1, 2]));
type _allArrayMembers = Expect<
  Equal<Exclude<keyof number[], keyof AsyncArray<number>>, never>
>;
const sorted = numbers.sort((left, right) => left - right);
const sortedCopy = numbers.toSorted((left, right) => left - right);
const pushed = numbers.push(4);
const flattened = numbers.flatMap(value => [value, value * 2]);
const sum = numbers.reduce((total, value) => total + value, 0);
const reversedSum = numbers.reduceRight((total, value) => total + value, 0);

type _sorted = Expect<Equal<typeof sorted, AsyncValue<number[]>>>;
type _sortedCopy = Expect<Equal<typeof sortedCopy, AsyncValue<number[]>>>;
type _pushed = Expect<Equal<typeof pushed, AsyncValue<number>>>;
type _arrayLength = Expect<Equal<typeof numbers.length, AsyncValue<number>>>;
type _flattened = Expect<Equal<typeof flattened, AsyncValue<number[]>>>;
type _sum = Expect<Equal<typeof sum, AsyncValue<number>>>;
type _reversedSum = Expect<Equal<typeof reversedSum, AsyncValue<number>>>;

const nested = asyncValue(Promise.resolve([[1], [2]]));
const flat = nested.flat();
type _flat = Expect<Equal<typeof flat, AsyncValue<number[]>>>;

const mixed = asyncValue(Promise.resolve([1, "x"] as (number | string)[]));
const onlyNumbers = mixed.filter((value): value is number => typeof value === "number");
const lastNumber = mixed.findLast((value): value is number => typeof value === "number");
type _onlyNumbers = Expect<Equal<typeof onlyNumbers, AsyncValue<number[]>>>;
type _lastNumber = Expect<Equal<typeof lastNumber, AsyncValue<number | undefined>>>;

const tuple = asyncValue(Promise.resolve([1, "x"] as const));
type _tupleFirst = Expect<Equal<typeof tuple[0], AsyncValue<1>>>;

// @ts-expect-error readonly arrays have no mutating sort method
tuple.sort();

// @ts-expect-error unknown properties must not be accepted
user.unknownProperty;

// @ts-expect-error method arguments must retain their inferred types
user.name.includes(123);

const scheme = {
  json: () => ({ data: { user: { name: [String] } } }),
};

type SchemeValue = InferSchema<typeof scheme>;
type SchemeName = ReturnType<SchemeValue["json"]>["data"]["user"]["name"];
type _schemeName = Expect<Equal<SchemeName, string[]>>;

declare const response: {
  readonly ok: boolean;
  json(): Promise<unknown>;
};

const withScheme = asyncValue(Promise.resolve(response), scheme);
const lowerName = withScheme.json().data.user.name[0].toLowerCase();

type LowerName = Awaited<typeof lowerName>;
type ResponseOk = Awaited<typeof withScheme.ok>;
type _lowerName = Expect<Equal<LowerName, string>>;
type _lowerNameAsync = Expect<Equal<typeof lowerName, AsyncValue<string>>>;
type _responseOk = Expect<Equal<ResponseOk, boolean>>;

lowerName.then(result => {
  const resolvedName: string = result;
  return resolvedName;
});

class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  format(prefix: string): string {
    return `${prefix}${this.amount} ${this.currency}`;
  }
}

declare const money: AsyncValue<Money>;
const formatted = money.format("$");
type FormattedMoney = Awaited<typeof formatted>;
type _formattedMoney = Expect<Equal<FormattedMoney, string>>;

// @ts-expect-error user-defined method arguments remain checked
money.format(10);
