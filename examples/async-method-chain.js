const { asyncValue } = require("../dist/src");

async function connect() {
  // Имитируем задержку подключения
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    async loadUser(id) {
      // Имитируем задержку получения данных пользователя
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id, name: "Bob" };
    },
  };
}

const p = asyncValue(connect()).loadUser(42).name.toUpperCase();

p.then(name => console.log(name)).catch(console.error);
