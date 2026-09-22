import { tools, subjects } from "./catalog.js";
import { initChat } from "./chat.js";
import { renderLesson } from "./lessons.js";
const startInChat = location.hash === "#chat";
const $ = (id) => document.getElementById(id);
let current = tools.find((t) => t.id === location.hash.slice(1)) || tools[0];
function button(label, action, className = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.className = className;
  b.onclick = action;
  return b;
}
function navigation() {
  const query = $("search").value.toLocaleLowerCase();
  $("subjects").replaceChildren(
    ...Object.entries(subjects).map(([id, s]) =>
      button(
        `${s.icon}  ${s.name}`,
        () => {
          $("search").value = "";
          select(tools.find((t) => t.subject === id));
        },
        current.subject === id ? "active" : "",
      ),
    ),
  );
  const matches = tools.filter((t) =>
    query
      ? (t.name + " " + t.description).toLocaleLowerCase().includes(query)
      : t.subject === current.subject,
  );
  $("tools").replaceChildren(
    ...matches.map((t) =>
      button(t.name, () => select(t), current.id === t.id ? "active" : ""),
    ),
  );
  if (!matches.length) $("tools").textContent = "Ничего не найдено";
}
function select(tool) {
  document.getElementById("calculator-page").hidden = false;
  document.getElementById("chat-page").hidden = true;
  document.body.classList.remove("chat-view");
  document.getElementById("chat-open").classList.remove("active");
  current = tool;
  history.replaceState(null, "", "#" + tool.id);
  navigation();
  $("title").textContent = tool.name;
  $("description").textContent = tool.description;
  $("eyebrow").textContent = subjects[tool.subject].name.toUpperCase();
  $("breadcrumb").textContent =
    "Рабочая тетрадь / " + subjects[tool.subject].name;
  $("symbol").textContent = tool.symbol;
  $("formula").textContent = tool.formula;
  $("note").textContent = tool.note;
  $("fields").replaceChildren(
    ...tool.fields.map((field) => {
      const label = document.createElement("label");
      label.textContent = field.label;
      if (
        ["textarea", "text", "select"].includes(field.type) &&
        !["a", "b", "c", "d"].includes(field.key)
      )
        label.className = "wide";
      let input = document.createElement(
        field.type === "select"
          ? "select"
          : field.type === "textarea"
            ? "textarea"
            : "input",
      );
      if (field.type === "select")
        for (const value of field.options) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          input.append(option);
        }
      else if (field.type !== "textarea") {
        input.type = field.type;
        if (field.type === "number") input.step = "any";
      }
      input.name = field.key;
      input.value = field.value;
      if (field.type !== "select") input.placeholder = String(field.value);
      input.required = true;
      input.autocomplete = "off";
      input.spellcheck = false;
      label.append(input);
      return label;
    }),
  );
  configureMathControls();
  renderLesson(tool.id, loadExample);
  $("quick").replaceChildren(
    ...tools
      .filter((t) => t.subject === tool.subject && t.id !== tool.id)
      .slice(0, 3)
      .map((t) => button(t.name + " ↗", () => select(t))),
  );
  calculate();
}
// Пример заполняет ту же форму, которую использует обычный расчёт.
function loadExample(values) {
  for (const [key, value] of Object.entries(values)) {
    const field = $("form").elements.namedItem(key);
    if (field) field.value = value;
  }
  updatePowerFields();
  calculate();
  $("form").scrollIntoView({
    block: "center",
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}
function updatePowerFields() {
  if (current.id !== "powers") return;
  const form = $("form");
  const operation = form.elements.namedItem("operation").value;
  const degreeField = form.elements.namedItem("n");
  const needsDegree = ["Степень n", "Корень степени n"].includes(operation);
  degreeField.closest("label").hidden = !needsDegree;
  degreeField.disabled = !needsDegree;
  const formulas = {
    Квадрат: "x² = x · x",
    Куб: "x³ = x · x · x",
    "Степень n": "y = xⁿ",
    "Квадратный корень": "√x = y ≥ 0, если y² = x",
    "Кубический корень": "∛x = y, если y³ = x",
    "Корень степени n": "ⁿ√x = y, если yⁿ = x",
  };
  $("formula").textContent = formulas[operation];
}
function configureMathControls() {
  updatePowerFields();
  if (current.id === "powers")
    $("form")
      .elements.namedItem("operation")
      .addEventListener("change", () => {
        updatePowerFields();
        calculate();
      });
  const field = $("form").elements.namedItem(
    current.id === "scientific"
      ? "expression"
      : current.id === "calculus"
        ? "expr"
        : "__none__",
  );
  $("expression-tools").hidden = !field;
  $("expression-tools").open = false;
  $("expression-buttons").replaceChildren();
  if (!field) return;
  const operations = [
    ["x²", "Квадрат", "", "^2"],
    ["x³", "Куб", "", "^3"],
    ["√", "Квадратный корень", "sqrt(", ")"],
    ["∛", "Кубический корень", "cbrt(", ")"],
    ["( )", "Скобки", "(", ")"],
    ["π", "Число пи", "pi", ""],
  ];
  $("expression-buttons").replaceChildren(
    ...operations.map(([symbol, label, prefix, suffix]) => {
      const control = button(symbol, () => {
        const start = field.selectionStart ?? field.value.length,
          end = field.selectionEnd ?? start;
        const selection = field.value.slice(start, end);
        const replacement =
          !prefix && selection
            ? "(" + selection + ")" + suffix
            : prefix + selection + suffix;
        field.setRangeText(replacement, start, end, "end");
        field.focus();
        if (prefix.endsWith("(") && !selection)
          field.setSelectionRange(start + prefix.length, start + prefix.length);
      });
      control.setAttribute("aria-label", label);
      control.title = label;
      return control;
    }),
  );
}
function calculate() {
  try {
    const values = Object.fromEntries(new FormData($("form")));
    const result = current.calculate(values);
    if (/NaN|Infinity/.test(result.value + " " + result.details))
      throw Error(
        "Результат выходит за диапазон вычислений. Уменьшите значения.",
      );
    $("result").className = "";
    $("result").textContent = result.value;
    $("details").textContent = result.details || "";
    return result;
  } catch (error) {
    $("result").className = "error";
    $("result").textContent = error.message;
    $("details").textContent = "Проверьте исходные данные и повторите расчёт.";
    return { error: error.message };
  }
}
$("form").onsubmit = (e) => {
  e.preventDefault();
  calculate();
};
$("example").onclick = () => select(current);
$("search").oninput = navigation;
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("search").focus();
  }
});
window.addEventListener("hashchange", () => {
  const t = tools.find((t) => t.id === location.hash.slice(1));
  if (t) select(t);
});
select(current);
initChat({
  initialChat: startInChat,
  getContext: () => ({
    tool: current.name,
    subject: subjects[current.subject].name,
    fields: Object.fromEntries(new FormData($("form"))),
    formula: current.formula,
    result: $("result").textContent,
  }),
});
// Необязательная интеграция браузера. Без поддержки WebMCP приложение работает обычно.
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(
      document.modelContext.registerTool({
        name: "calculate_science",
        title: "Выполнить научный расчёт",
        description: "Открыть инструмент, заполнить поля и показать результат.",
        inputSchema: {
          type: "object",
          properties: {
            tool: { type: "string", enum: tools.map((t) => t.id) },
            values: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
          required: ["tool", "values"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const tool = tools.find((t) => t.id === input.tool);
          if (
            !tool ||
            !input.values ||
            Object.keys(input.values).some(
              (k) => !tool.fields.some((f) => f.key === k),
            )
          )
            throw Error("Некорректный инструмент или поля.");
          select(tool);
          for (const [k, v] of Object.entries(input.values))
            $("form").elements.namedItem(k).value = String(v);
          updatePowerFields();
          return calculate();
        },
      }),
    ).catch(() => {});
  } catch {}
}
