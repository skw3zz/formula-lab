import test from "node:test";
import assert from "node:assert/strict";
import { tools } from "../dist/catalog.js";
import { lessons } from "../dist/lessons.js";
import { realRoot, realPower, expression } from "../dist/engine.js";

test("Корни и степени, включая отрицательные числа и ограничения", () => {
  assert.equal(realRoot(81, 2), 9);
  assert.equal(realRoot(-27, 3), -3);
  assert.equal(realRoot(32, 5), 2);
  assert.equal(realPower(5, 3), 125);
  assert.equal(realPower(2, -3), 0.125);
  assert.equal(realRoot(0, 7), 0);
  assert.throws(() => realRoot(-16, 2));
  assert.throws(() => realRoot(16, 0));
  assert.throws(() => realRoot(16, 2.5));
  assert.throws(() => realPower(0, 0));
  assert.throws(() => realPower(0, -1));
  assert.throws(() => realPower(-8, 1 / 3));
  assert.throws(() => realPower(10, 400));
});
test("Обычная и типографская запись выражений", () => {
  assert.equal(expression("√(81) + ∛(-27) + 2³"), 14);
  assert.equal(expression("cbrt(-27)+5^2"), 22);
  assert.equal(expression("2 + 3 × 4"), 14);
  assert.equal(expression("(-3)²"), 9);
  assert.equal(expression("-3²"), -9);
  assert.equal(expression("12 ÷ 4 − 1"), 2);
});
test("У каждого инструмента есть урок и исполняемые примеры", () => {
  for (const tool of tools) {
    const lesson = lessons[tool.id];
    assert.ok(lesson, tool.id);
    assert.equal(lesson.steps.length, 3);
    for (const example of lesson.examples) {
      const values = Object.fromEntries(
        tool.fields.map((field) => [field.key, String(field.value)]),
      );
      for (const key of Object.keys(example.values))
        assert.ok(
          tool.fields.some((field) => field.key === key),
          `${tool.id}: ${key}`,
        );
      const result = tool.calculate({ ...values, ...example.values });
      assert.ok(result.value);
      assert.doesNotMatch(result.value + " " + result.details, /NaN|Infinity/);
    }
  }
});
test("Учебные результаты совпадают с известными ответами", () => {
  const calc = (id, values) =>
    tools.find((tool) => tool.id === id).calculate(values).value;
  assert.equal(
    calc("powers", { operation: "Кубический корень", x: "-27" }),
    "-3",
  );
  assert.equal(calc("powers", { operation: "Куб", x: "5" }), "125");
  assert.equal(calc("matrix", { a: "2 1\n1 3" }), "5");
  assert.equal(calc("amount", { formula: "H2O", m: "18.015" }), "1 моль");
  assert.equal(
    calc("solution", { formula: "NaCl", m: "5.844", v: "1", total: "1000" }),
    "0,1 моль/л",
  );
});
