# Async Value Chain

Типизированные цепочки вызовов над значениями, которые появятся позже. Читайте
свойства и вызывайте методы будущего значения, не прерывая цепочку на каждом
шаге с помощью `await`.

```ts
import { asyncValue } from "async-value-chain";

async function main() {
  const user = asyncValue(Promise.resolve({ name: ["Bob", "Smith"] }));
  const firstName = user.name[0].toLowerCase();

  console.log(await firstName); // "bob"
}

main().catch(console.error);
```

TypeScript выводит тип каждого следующего шага из исходного значения. В примере
`firstName` имеет тип `AsyncValue<string>`: его можно ожидать через `await` или
передать обработчик в `.then()`.

## Установка

```sh
npm install async-value-chain
```

Требуется Node.js 18 или новее. Пакет имеет формат CommonJS, содержит
декларации TypeScript и не имеет runtime-зависимостей. В CommonJS используйте:

```js
const { asyncValue } = require("async-value-chain");
```

## Основной API

```ts
asyncValue(source)
asyncValue(source, schema)
```

`source` может быть обычным значением или `PromiseLike`. Функция возвращает
`AsyncValue<T>`, где `T` — тип значения после ожидания `source`. Необязательная
`schema` уточняет типы, когда исходная сигнатура не описывает результат
достаточно точно.

Чтение свойства и вызов метода добавляют действия в цепочку. Они выполняются,
когда вы ожидаете результат через `await` или обращаетесь к `.then()`, `.catch()`
либо `.finally()`. Если `source` уже является промисом, его собственная работа
могла начаться раньше.

```ts
async function main() {
  const names = asyncValue(Promise.resolve(["Bob", "Alice"]));

  const upper = names.map(name => name.toUpperCase());
  const first = names[0].toLowerCase();

  console.log(await upper); // ["BOB", "ALICE"]
  console.log(await first); // "bob"
}

main().catch(console.error);
```

У одного и того же объекта цепочки результат выполнения сохраняется: повторное
`await upper` не вызовет `map` ещё раз. Отдельно построенные цепочки выполняются
отдельно. Это важно для методов с побочными эффектами, например `push`.

Ошибки исходного промиса, геттеров и вызовов методов приводят к отклонению
результирующего промиса. Обрабатывайте их обычным `try/catch` с `await` или
через `.catch()`.

## Вывод типов

Свойства объектов и пользовательских классов, методы примитивов, индексы и
стандартные методы массивов доступны из исходного типа. Аргументы методов
проверяются TypeScript; результат каждого шага остаётся асинхронной цепочкой.
Для обобщённых методов массива, включая `map`, `filter`, `flatMap` и `reduce`,
тип результата выводится из переданных аргументов.

```ts
class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  format(): string {
    return `${this.amount} ${this.currency}`;
  }
}

async function main() {
  const money = asyncValue(Promise.resolve(new Money(10, "EUR")));

  console.log(await money.amount);   // 10
  console.log(await money.format()); // "10 EUR"
}

main().catch(console.error);
```

При вызове метода сохраняется его `this`, поэтому методы экземпляров работают
без дополнительной привязки. Для собственных классов не нужна регистрация
адаптеров.

## Схема для уточнения типов

Если метод возвращает `unknown`, можно описать его ожидаемый результат схемой:

```ts
import { asyncValue } from "async-value-chain";

const response: { ok: boolean; json(): Promise<unknown> } = {
  ok: true,
  async json() {
    return { data: { user: { name: ["Bob", "Smith"] } } };
  },
};

const schema = {
  json: () => ({ data: { user: { name: [String] } } }),
};

async function main() {
  const request = asyncValue(Promise.resolve(response), schema);

  console.log(await request.json().data.user.name[0].toLowerCase()); // "bob"
  console.log(await request.ok); // true
}

main().catch(console.error);
```

В схеме `String`, `Number`, `Boolean`, `BigInt` и `Symbol` описывают примитивы.
Массив с одним дескриптором, например `[String]`, описывает массив строк.
Функция описывает метод и структуру его результата, а объект — свойства.
Свойства исходного типа, которых нет в схеме, сохраняются: поэтому `request.ok`
остаётся доступным.

Схема используется **только для типов**. Она не меняет данные, не вызывает
описанные в ней функции и не проверяет ответ во время выполнения. Проверяйте
недоверенные данные отдельно перед использованием.

## Особенности и ограничения

- `then`, `catch` и `finally` служат для получения результата цепочки. Доступ к
  одноимённым свойствам исходного значения через этот API невозможен.
- Результат поддерживает `await` и методы промиса, но является прокси, поэтому
  проверка `instanceof Promise` не является способом его распознать.
- Типы TypeScript помогают при разработке, но не защищают от неверной схемы или
  данных, которые изменились во время выполнения.

## Разработка

```sh
npm run typecheck
npm test
npm run build
```

`npm test` собирает проект, проверяет типы и запускает runtime-тесты.

## Примеры из репозитория:

- `examples/async-method-chain.js` — асинхронный метод сервиса:
  `npm run build && node dist/examples/async-method-chain.js`.
- `examples/typed-schema.ts` — уточнение результата `json()`:
  `npm run build && node dist/examples/typed-schema.js`.

Лицензия: MIT.
