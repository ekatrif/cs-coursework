import { asyncValue } from "../src";

const schema = {
  json: () => ({ data: { user: { name: [String] } } }),
};

const response: { ok: boolean; json(): Promise<unknown> } = {
  ok: true,
  async json() {
    return { data: { user: { name: ["Bob", "Smith"] } } };
  },
};

const name = asyncValue(Promise.resolve(response), schema)
  .json()
  .data.user.name[0]
  .toLowerCase();

const isStatusOk = asyncValue(Promise.resolve(response), schema).ok;

name.then(result => {
  console.log(result); // "bob"
}).catch(console.error);

isStatusOk.then(result => {
  console.log(result); // true
}).catch(console.error);
