import test from "node:test";
import assert from "node:assert/strict";
import {
  fractions,
  expression,
  molecule,
  molarMass,
  balance,
  determinant,
  elements,
} from "../dist/engine.js";
import { tools } from "../dist/catalog.js";
test("Точные дроби, отрицательные знаменатели и деление на ноль", () => {
  assert.equal(
    fractions({ a: "3", b: "4", c: "5", d: "6", op: "+" }).value,
    "19 / 12",
  );
  assert.equal(
    fractions({ a: "9007199254740993", b: "1", c: "1", d: "1", op: "+" }).value,
    "9007199254740994",
  );
  assert.equal(
    fractions({ a: "1", b: "-2", c: "1", d: "2", op: "+" }).value,
    "0",
  );
  assert.throws(() => fractions({ a: "1", b: "2", c: "0", d: "3", op: "÷" }));
});
test("Приоритет операций и безопасный разбор выражений", () => {
  assert.equal(expression("-2^2"), -4);
  assert.equal(expression("2^3^2"), 512);
  assert.equal(expression("2^-2"), 0.25);
  assert.equal(expression("sqrt(144)+sin(pi/6)^2"), 12.25);
  for (const source of ["1/0", "sqrt(-1)", "alert(1)", "2(3)", "sin("])
    assert.throws(() => expression(source));
});
test("Скобки, гидраты и таблица элементов", () => {
  assert.equal(Object.keys(elements).length, 118);
  assert.deepEqual(molecule("K4[Fe(CN)6]"), { K: 4, Fe: 1, C: 6, N: 6 });
  assert.deepEqual(molecule("CuSO4·5H2O"), { Cu: 1, S: 1, O: 9, H: 10 });
  assert.ok(Math.abs(molarMass("H2O") - 18.015) < 1e-10);
  for (const source of ["", "Xx2", "H0", "Ca(OH", "H2O)"])
    assert.throws(() => molecule(source));
});
test("Баланс реакций и невозможные уравнения", () => {
  assert.equal(balance("Fe + O2 = Fe2O3").value, "4 Fe + 3 O2 → 2 Fe2O3");
  assert.equal(
    balance("C2H6 + O2 = CO2 + H2O").value,
    "2 C2H6 + 7 O2 → 4 CO2 + 6 H2O",
  );
  assert.equal(
    balance("KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2").value,
    "2 KMnO4 + 16 HCl → 2 KCl + 2 MnCl2 + 8 H2O + 5 Cl2",
  );
  assert.throws(() => balance("H2 = CO2"));
});
test("Определители и примеры всех инструментов", () => {
  assert.equal(
    determinant([
      [2, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ]),
    8,
  );
  assert.equal(
    determinant([
      [1, 2],
      [2, 4],
    ]),
    0,
  );
  for (const tool of tools) {
    const r = tool.calculate(
      Object.fromEntries(tool.fields.map((f) => [f.key, String(f.value)])),
    );
    assert.ok(r.value);
    assert.doesNotMatch(r.value + " " + r.details, /NaN|Infinity/);
  }
});
