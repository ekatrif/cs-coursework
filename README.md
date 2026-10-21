# Async Value Chain

Небольшая TypeScript-библиотека для построения типизированных цепочек над
асинхронными значениями.

```ts
import { asyncValue } from "./src";

const user = asyncValue(
  Promise.resolve({ name: ["Bob", "Smith"] }),
);

const firstName = user.name[0].toLowerCase();

firstName.then(result => console.log(result)); // "bob"
```

Тип каждого следующего шага выводится из исходного значения. Несуществующие
свойства и неверные аргументы методов отклоняются TypeScript.

Методы массивов берутся из стандартных типов `Array` и `ReadonlyArray`, поэтому
доступны и методы вроде `sort`, `flatMap` и `findLast`. Результат каждого вызова
остаётся асинхронной цепочкой. Для обобщённых методов, например `map` и `reduce`,
сохранён вывод типа результата из аргументов.

## Дополнительная схема типов

Если внешний API не сообщает точный тип результата, его можно дополнить
схемой:

```ts
const scheme = {
  json: () => ({
    data: {
      user: {
        name: [String],
      },
    },
  }),
};

const request = asyncValue(fetch("/my-resource"), scheme);

const name = request
  .json()
  .data.user.name[0]
  .toLowerCase();

name.then(result => console.log(result)); // result: string
```

Поддерживаемые дескрипторы примитивов: `String`, `Number`, `Boolean`, `BigInt`
и `Symbol`. Массив с одним дескриптором описывает массив значений, функция —
метод и его возвращаемую структуру, объект — свойства результата.

Схема является только дополнительным источником статических типов. Она не
изменяет выполнение, не преобразует и не валидирует полученные данные. Для
недоверенного JSON следует отдельно использовать runtime-валидатор.

Свойства исходного типа, не перечисленные в схеме, сохраняются:

```ts
const request = asyncValue(fetch("/my-resource"), scheme);

await request.ok;     // свойство Response
await request.json(); // результат уточнён схемой
```

## Пользовательские типы

Пользовательские классы работают без регистрации адаптера:

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

const money = asyncValue(Promise.resolve(new Money(10, "EUR")));

await money.amount;  // number
await money.format(); // string
```

Runtime использует нативные свойства и методы значения, а TypeScript выводит
их из типа класса. Вызовы сохраняют правильный `this`.

## Команды

```sh
npm test
npm run typecheck
npm run build
```

Проект не требует runtime-зависимостей.

## Примеры

- `examples/async-method-chain.js` — цепочка через асинхронное получение сервиса
  и его асинхронный метод. Запуск: `npm run build && node dist/examples/async-method-chain.js`.
- `examples/typed-schema.ts` — схема уточняет результат `json(): Promise<unknown>`
  и позволяет TypeScript проверить продолжение цепочки. Запуск:
  `npm run build && node dist/examples/typed-schema.js`.
