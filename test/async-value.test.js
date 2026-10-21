const assert = require("node:assert/strict");
const { test } = require("node:test");

const { asyncValue } = require("../dist/src");

test("executes a property and method chain", async () => {
  const value = asyncValue(
    Promise.resolve({ user: { name: ["Bob", "Smith"] } }),
  );

  assert.equal(await value.user.name[0].toLowerCase(), "bob");
});

test("passes the final value to then", async () => {
  const value = asyncValue(Promise.resolve({ name: ["Bob", "Smith"] }));
  const p = value.name[0].toLowerCase();

  const result = await p.then(name => {
    assert.equal(typeof name, "string");
    return name;
  });

  assert.equal(result, "bob");
});

test("uses native array methods that are not declared individually", async () => {
  const values = asyncValue(Promise.resolve([3, 1, 2]));

  assert.deepEqual(await values.sort((left, right) => left - right), [1, 2, 3]);
  assert.deepEqual(
    await values.flatMap(value => [value, value * 2]),
    [1, 2, 2, 4, 3, 6],
  );
});

test("keeps branches independent", async () => {
  const root = asyncValue(
    Promise.resolve({ user: { id: 42, name: "Bob" } }),
  );
  const user = root.user;
  const name = user.name;
  const id = user.id;

  assert.equal(await name, "Bob");
  assert.equal(await id, 42);
});

test("preserves the receiver when calling a method", async () => {
  class Counter {
    constructor(value) {
      this.value = value;
    }

    increment(amount) {
      this.value += amount;
      return this.value;
    }
  }

  const counter = new Counter(1);
  const result = asyncValue(Promise.resolve(counter)).increment(2);

  assert.equal(await result, 3);
  assert.equal(counter.value, 3);
});

test("memoizes execution of one terminal chain", async () => {
  let calls = 0;
  const root = asyncValue(
    Promise.resolve({
      next() {
        calls += 1;
        return calls;
      },
    }),
  );
  const result = root.next();

  assert.deepEqual(await Promise.all([result, result]), [1, 1]);
  assert.equal(calls, 1);
});

test("executes separately constructed chains separately", async () => {
  let calls = 0;
  const root = asyncValue(
    Promise.resolve({
      next() {
        calls += 1;
        return calls;
      },
    }),
  );

  const first = root.next();
  const second = root.next();

  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
});

test("supports symbol properties", async () => {
  const key = Symbol("answer");
  const value = asyncValue(Promise.resolve({ [key]: 42 }));

  assert.equal(await value[key], 42);
});

test("turns getter errors into promise rejections", async () => {
  const value = asyncValue(
    Promise.resolve({
      get failure() {
        throw new Error("getter failed");
      },
    }),
  );

  await assert.rejects(Promise.resolve(value.failure), /getter failed/);
});

test("uses a schema as type information without changing runtime behavior", async () => {
  const response = {
    ok: true,
    async json() {
      return { data: { user: { name: ["Bob", "Smith"] } } };
    },
  };
  const scheme = {
    json: () => ({ data: { user: { name: [String] } } }),
  };

  const request = asyncValue(Promise.resolve(response), scheme);

  assert.equal(await request.json().data.user.name[0].toLowerCase(), "bob");
  assert.equal(await request.ok, true);
});
