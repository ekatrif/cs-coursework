Этап 1. Спроектировать внутреннюю модель (AST)

Самое первое — вообще не думать о Promise и Proxy.

Нужно определить, что представляет собой цепочка вызовов.

Например

async(fetch(...))
    .json()
    .data.user.name
    .at(0)
    .toLowerCase()

внутри должна превратиться во что-то вроде

Root
 └── Call("json")
      └── Get("data")
           └── Get("user")
                └── Get("name")
                     └── Call("at", [0])
                          └── Call("toLowerCase")

или в линейный список

[
    call("json"),
    get("data"),
    get("user"),
    get("name"),
    call("at", [0]),
    call("toLowerCase")
]

На этом этапе вообще не нужен TypeScript.

Нужно только решить:

как хранится цепочка;
как выполняется;
как сериализуется;
можно ли ее оптимизировать.

Этап 2. Исполнитель (Interpreter)

Теперь появляется класс

Executor

который умеет пройти по AST.

Например

await executor.execute(rootPromise, ast)

Он делает

await promise

↓

json()

↓

.data

↓

.user

↓

.name

↓

.at()

↓

.toLowerCase()

Это уже рабочая библиотека.

Без Proxy.

Без типизации.


Этап 3. Runtime Proxy

Только теперь появляется

new Proxy(...)

Его задача максимально простая.

Каждый

get

делает

ast.push(GetNode(...))

Каждый

apply

делает

ast.push(CallNode(...))

И возвращает новый Proxy.

Он вообще ничего не знает о Promise.


Этап 4. Универсальный Async<T>

Теперь начинается самое интересное.

Создается главный тип библиотеки

Async<T>

Он является единственной публичной точкой входа.

Например

Async<User>

должен автоматически стать

{

    id: Async<number>

    name: Async<string>

}

То есть

Async<T>

рекурсивно разворачивает объект.


Этап 5. Типовые адаптеры

Я бы не стал сразу писать

if string

if array

if number

...

Лучше сразу сделать систему адаптеров.

Например

interface TypeAdapter<T> {

    runtime

    types

}

Затем

StringAdapter

ArrayAdapter

MapAdapter

SetAdapter

DateAdapter

Каждый знает

какие методы существуют;
какой тип они возвращают.

Например

split()

↓

Async<string[]>

или

map()

↓

Async<U[]>

Этап 6. Реестр типов

Теперь появляется Registry.

Например

registry.register(
    Array,
    arrayAdapter
)

или

registry.register(
    URL,
    urlAdapter
)

Библиотека становится расширяемой.

Пользователь может написать

registry.register(
    Money,
    moneyAdapter
)

и получить

amount

currency

format()

round()

...

без изменения ядра.

Этап 7. Плагинная система

На этом этапе появляются полноценные плагины.

Например

plugin({
    runtime: ...,
    typings: ...,
    optimizer: ...
})

Плагин может:

добавить новый тип;
добавить новые методы;
изменить исполнение;
добавить оптимизацию.

Это уже архитектура уровня Prisma.


Этап 8. Оптимизатор AST

Когда дерево уже есть, появляется возможность его изменять.

Например

map()

↓

filter()

↓

map()

↓

length

можно объединить.

Или

json()

↓

data

можно заменить одним быстрым вызовом.

Позже здесь же можно добавить:

кеширование;
логирование;
профилирование;
батчинг.

Этап 9. Middleware Pipeline

После этого Executor становится цепочкой middleware.

Например

Proxy

↓

AST

↓

Optimizer

↓

Logger

↓

Cache

↓

Executor

Каждый middleware получает

context

и может изменить выполнение.

Например

TimingMiddleware

RetryMiddleware

MemoizeMiddleware

TracingMiddleware

Этап 10. Публичный API

Только теперь появляется красивый API.

Например

const result =
    async(fetch(...))
        .json()
        .data.user.name
        .at(0)
        .toLowerCase();

или

const result =
    chain(fetch(...))
        .json()
        .data.user.name
        .first()
        .toLowerCase();

Пользователь вообще не знает, что внутри AST.

Что я бы сразу не делал

Есть несколько вещей, которые очень хочется реализовать сразу, но они сильно усложнят проект.

1. Индексация через [0]

Лучше начать с

.at(0)

или

.get(0)

Потом уже пытаться сделать поддержку индексирования.

2. Поддержка всех встроенных типов

Для MVP достаточно

Object

Array

String

Number

Boolean

Map

Set

Promise

Остальное можно подключать плагинами.

3. Полную оптимизацию

AST нужен сразу.

Оптимизатор — нет.

Сначала он может быть

identity(ast)
Как бы выглядела архитектура целиком
                      User API
                          │
                          ▼
                   Async<T> (Types)
                          │
                          ▼
                      Proxy Runtime
                          │
                          ▼
                    AST Builder
                          │
                          ▼
                  Plugin Registry
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
          Type Adapters     Runtime Plugins
                 │                │
                 └───────┬────────┘
                         ▼
                   AST Optimizer
                         │
                         ▼
                Middleware Pipeline
                         │
                         ▼
                     Executor
                         │
                         ▼
                    Promise<Result>
                    
Я бы добавил ещё один "нулевой" этап

Перед написанием кода стоит формализовать систему типов. Именно она будет определять весь остальной дизайн. Полезно описать несколько базовых преобразований:

Async<T>

Async<string>

Async<string[]>

Async<Map<K, V>>

Async<Promise<T>>

Async<T | undefined>

Async<T | null>

и проверить, как после каждой операции меняется тип. Если удастся сделать Async<T> композиционным и рекурсивным, то дальнейшее расширение библиотеки (новые адаптеры, плагины, middleware) будет происходить почти без изменений ядра. Именно типовая система, а не Proxy, станет фундаментом всей библиотеки.