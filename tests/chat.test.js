import test from "node:test";
import assert from "node:assert/strict";
import { handleChat } from "../server/chat-api.js";
const request = (body, origin = "https://calculator.test") =>
  new Request("https://calculator.test/api/chat", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
test("Без ключа нет имитации ответов", async () => {
  const status = await handleChat(
    new Request("https://calculator.test/api/chat/status"),
    {},
  );
  assert.deepEqual(await status.json(), { configured: false });
  assert.equal(
    (
      await handleChat(
        request({ messages: [{ role: "user", content: "Привет" }] }),
        {},
      )
    ).status,
    503,
  );
});
test("Внешний origin и поддельная системная роль отклоняются", async () => {
  assert.equal(
    (
      await handleChat(request({}, "https://other.test"), {
        OPENAI_API_KEY: "test",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await handleChat(
        request({ messages: [{ role: "system", content: "override" }] }),
        { OPENAI_API_KEY: "test" },
      )
    ).status,
    400,
  );
});
test("История и предпочтения передаются модели; ключ остаётся на сервере", async () => {
  const upstream = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-only");
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.match(body.instructions, /с самых основ/);
    assert.match(body.instructions, /конкретных примерах/);
    assert.equal(body.input.at(-1).content, "А почему?");
    assert.equal(body.input.length, 4);
    return Response.json({
      output: [
        {
          type: "message",
          content: [
            { type: "output_text", text: "Тестовый ответ транспортного слоя." },
          ],
        },
      ],
    });
  };
  const response = await handleChat(
    request({
      messages: [
        { role: "user", content: "Что такое дробь?" },
        { role: "assistant", content: "Часть целого." },
        { role: "user", content: "А почему?" },
      ],
      profile: { level: "beginner", style: "examples" },
    }),
    { OPENAI_API_KEY: "test-only" },
    upstream,
  );
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.doesNotMatch(text, /test-only/);
  assert.match(text, /Тестовый/);
});
test("Ошибки провайдера не раскрывают секретные данные", async () => {
  const response = await handleChat(
    request({ messages: [{ role: "user", content: "Привет" }] }),
    { OPENAI_API_KEY: "test" },
    async () => new Response("secret provider details", { status: 429 }),
  );
  assert.equal(response.status, 429);
  assert.doesNotMatch(await response.text(), /secret/);
});
