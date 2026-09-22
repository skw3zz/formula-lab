import {
  number as n,
  positive as p,
  format as f,
  fractions,
  vector,
  matrix,
  determinant,
  expression,
  molecule,
  molarMass,
  elements,
  balance,
  realPower,
  realRoot,
} from "./engine.js";
// Каждый инструмент описан одинаково: поля, пример, формула и чистая функция расчёта.
const field = (key, label, value, type = "number", options) => ({
  key,
  label,
  value,
  type,
  options,
});
const text = (key, label, value) => field(key, label, value, "text");
const result = (value, details = "") => ({ value, details });
export const subjects = {
  math: { name: "Математика", icon: "∑" },
  physics: { name: "Физика", icon: "ϟ" },
  chemistry: { name: "Химия", icon: "⚗" },
};
export const tools = [
  {
    id: "fractions",
    subject: "math",
    name: "Дроби",
    symbol: "⅟ₓ",
    description: "Точная арифметика с обыкновенными дробями.",
    formula: "a/b ± c/d = (ad ± bc) / bd",
    note: "Дроби сокращаются автоматически. Целые числа обрабатываются без потери точности; десятичный результат — приближение.",
    fields: [
      text("a", "Числитель A", "3"),
      text("b", "Знаменатель A", "4"),
      field("op", "Действие", "+", "select", ["+", "−", "×", "÷"]),
      text("c", "Числитель B", "5"),
      text("d", "Знаменатель B", "6"),
    ],
    calculate: fractions,
  },
  {
    id: "powers",
    subject: "math",
    name: "Степени и корни",
    symbol: "∛",
    description: "Квадраты, кубы, степени и корни — отдельными действиями.",
    formula: "xⁿ — степень; ⁿ√x = y, если yⁿ = x",
    note: "Работаем с действительными числами. Чётный корень из отрицательного числа не определён в ℝ. Нечётный корень существует: ∛(−27) = −3. Степени и корни вычисляются численно.",
    fields: [
      field("operation", "Действие", "Квадратный корень", "select", [
        "Квадрат",
        "Куб",
        "Степень n",
        "Квадратный корень",
        "Кубический корень",
        "Корень степени n",
      ]),
      field("x", "Число x", 81),
      field("n", "Показатель n", 2),
    ],
    calculate: (v) => {
      const x = n(v.x),
        operation = v.operation;
      const root =
        operation.includes("корень") || operation === "Корень степени n";
      const degree = ["Квадрат", "Квадратный корень"].includes(operation)
        ? 2
        : ["Куб", "Кубический корень"].includes(operation)
          ? 3
          : n(v.n);
      if (
        ![
          "Квадрат",
          "Куб",
          "Степень n",
          "Квадратный корень",
          "Кубический корень",
          "Корень степени n",
        ].includes(operation)
      )
        throw Error("Выберите действие.");
      const value = root ? realRoot(x, degree) : realPower(x, degree);
      return result(
        f(value),
        root
          ? `Корень степени ${f(degree)} из ${f(x)}\nПроверка: (${f(value)})^${f(degree)} ≈ ${f(x)}`
          : `(${f(x)})^${f(degree)} = ${f(value)}`,
      );
    },
  },
  {
    id: "scientific",
    subject: "math",
    name: "Научный",
    symbol: "ƒ(x)",
    description: "Выражения, степени, корни и тригонометрия.",
    formula: "sin, cos, tan, sqrt, cbrt, abs, ln, log, exp",
    note: "Углы задаются в радианах. Используйте pi, e, знак * для умножения и ^ для степени. ln — натуральный логарифм, log — десятичный.",
    fields: [text("expression", "Выражение", "sqrt(144) + sin(pi/6)^2")],
    calculate: (v) => result(f(expression(v.expression))),
  },
  {
    id: "vectors",
    subject: "math",
    name: "Векторы",
    symbol: "a⃗",
    description: "Операции с векторами в трёхмерном пространстве.",
    formula: "a · b = Σ aᵢbᵢ; cos θ = (a · b) / (|a||b|)",
    note: "Введите три координаты через пробел. Угол между векторами выводится в градусах; для нулевого вектора он не определён.",
    fields: [
      text("a", "Вектор A · x y z", "1 2 3"),
      text("b", "Вектор B · x y z", "4 5 6"),
    ],
    calculate: (v) => {
      const a = vector(v.a),
        b = vector(v.b),
        dot = a.reduce((s, x, i) => s + x * b[i], 0),
        la = Math.hypot(...a),
        lb = Math.hypot(...b),
        cross = [
          a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0],
        ],
        show = (x) => "(" + x.map(f).join("; ") + ")";
      return result(
        f(dot),
        `Скалярное произведение A · B\nA + B = ${show(a.map((x, i) => x + b[i]))}\nA − B = ${show(a.map((x, i) => x - b[i]))}\nA × B = ${show(cross)}\n|A| = ${f(la)}; |B| = ${f(lb)}\nУгол: ${la && lb ? f((Math.acos(Math.max(-1, Math.min(1, dot / la / lb))) * 180) / Math.PI) + "°" : "не определён"}`,
      );
    },
  },
  {
    id: "matrix",
    subject: "math",
    name: "Матрицы",
    symbol: "[A]",
    description: "Определитель, транспонирование и обратная матрица.",
    formula: "A⁻¹ = adj(A) / det(A)",
    note: "Квадратные матрицы 2×2–6×6. Разделяйте числа пробелами, строки — переносами. Для почти вырожденных матриц точность ограничена.",
    fields: [field("a", "Матрица A", "2 1 0\n1 3 1\n0 1 2", "textarea")],
    calculate: (v) => {
      const a = matrix(v.a),
        d = determinant(a),
        show = (m) => m.map((r) => r.map(f).join("   ")).join("\n"),
        inverse =
          d === 0
            ? "не существует"
            : show(
                a.map((_, i) =>
                  a.map(
                    (_, j) =>
                      ((-1) ** (i + j) *
                        determinant(
                          a
                            .filter((_, r) => r !== j)
                            .map((r) => r.filter((_, c) => c !== i)),
                        )) /
                      d,
                  ),
                ),
              );
      return result(
        f(d),
        `Определитель det(A)\n\nТранспонированная:\n${show(a[0].map((_, j) => a.map((r) => r[j])))}\n\nОбратная:\n${inverse}`,
      );
    },
  },
  {
    id: "quadratic",
    subject: "math",
    name: "Уравнения",
    symbol: "x²",
    description: "Квадратные и линейные уравнения, включая комплексные корни.",
    formula: "ax² + bx + c = 0; x = (−b ± √D) / 2a",
    note: "Если a = 0, решается линейное уравнение. Отрицательный дискриминант даёт два комплексных корня.",
    fields: [
      field("a", "Коэффициент a", 1),
      field("b", "Коэффициент b", -5),
      field("c", "Коэффициент c", 6),
    ],
    calculate: (v) => {
      const a = n(v.a),
        b = n(v.b),
        c = n(v.c);
      if (a === 0)
        return result(b ? `x = ${f(-c / b)}` : c ? "Решений нет" : "Любое x");
      const d = b * b - 4 * a * c;
      if (d < 0)
        return result(
          `${f(-b / (2 * a))} ± ${f(Math.sqrt(-d) / (2 * Math.abs(a)))}i`,
          `D = ${f(d)}`,
        );
      const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(d));
      return result(
        `x₁ = ${f(q / a)}; x₂ = ${f(q === 0 ? 0 : c / q)}`,
        `D = ${f(d)}`,
      );
    },
  },
  {
    id: "calculus",
    subject: "math",
    name: "Производная и интеграл",
    symbol: "∫",
    description: "Численная производная и определённый интеграл.",
    formula:
      "f′(x) ≈ [f(x+h) − f(x−h)] / 2h\nИнтеграл: составная формула Симпсона",
    note: "Результаты приближённые. Интегрирование: 2000 интервалов; функция должна быть гладкой на всём отрезке. Разрывы и быстрые осцилляции могут дать неверную оценку.",
    fields: [
      text("expr", "Функция f(x)", "x^2"),
      field("x", "Точка производной", 2),
      field("a", "Нижняя граница", 0),
      field("b", "Верхняя граница", 3),
    ],
    calculate: (v) => {
      const x = n(v.x),
        a = n(v.a),
        b = n(v.b),
        fn = (x) => expression(v.expr, x),
        h = 1e-5 * Math.max(1, Math.abs(x)),
        step = (b - a) / 2000;
      let sum = fn(a) + fn(b);
      for (let i = 1; i < 2000; i++) sum += (i % 2 ? 4 : 2) * fn(a + i * step);
      return result(
        f((sum * step) / 3),
        `Определённый интеграл от ${f(a)} до ${f(b)}\nf′(${f(x)}) ≈ ${f((fn(x + h) - fn(x - h)) / (2 * h))}`,
      );
    },
  },
  {
    id: "statistics",
    subject: "math",
    name: "Статистика",
    symbol: "σ",
    description: "Среднее, медиана, дисперсия и стандартное отклонение.",
    formula: "μ = Σxᵢ / N; σ² = Σ(xᵢ − μ)² / N",
    note: "Дисперсия и стандартное отклонение рассчитываются для генеральной совокупности. Десятичные дроби можно вводить через запятую.",
    fields: [
      field(
        "data",
        "Числа через пробел или точку с запятой",
        "12 15 18 18 21 24",
        "textarea",
      ),
    ],
    calculate: (v) => {
      const a = v.data
          .trim()
          .split(/[;\s]+/)
          .map(n)
          .sort((a, b) => a - b),
        mean = a.reduce((s, x) => s + x, 0) / a.length,
        variance = a.reduce((s, x) => s + (x - mean) ** 2, 0) / a.length;
      return result(
        f(mean),
        `Среднее арифметическое\nКоличество: ${a.length}\nМедиана: ${f((a[Math.floor((a.length - 1) / 2)] + a[Math.floor(a.length / 2)]) / 2)}\nДисперсия: ${f(variance)}\nСтандартное отклонение: ${f(Math.sqrt(variance))}\nМинимум: ${f(a[0])}; максимум: ${f(a.at(-1))}`,
      );
    },
  },
  {
    id: "complex",
    subject: "math",
    name: "Комплексные числа",
    symbol: "ℂ",
    description: "Сумма, произведение, частное и модуль комплексных чисел.",
    formula: "(a + bi)(c + di) = (ac − bd) + (ad + bc)i",
    note: "Четыре поля задают действительные и мнимые части двух чисел. Деление на нулевое комплексное число не определено.",
    fields: [
      field("a", "Re A", 3),
      field("b", "Im A", 2),
      field("c", "Re B", 1),
      field("d", "Im B", -4),
    ],
    calculate: (v) => {
      const [a, b, c, d] = ["a", "b", "c", "d"].map((k) => n(v[k])),
        show = (r, i) => `${f(r)} ${i < 0 ? "−" : "+"} ${f(Math.abs(i))}i`;
      return result(
        show(a + c, b + d),
        `A + B\nA × B = ${show(a * c - b * d, a * d + b * c)}\nA / B = ${c * c + d * d ? show((a * c + b * d) / (c * c + d * d), (b * c - a * d) / (c * c + d * d)) : "не определено"}\n|A| = ${f(Math.hypot(a, b))}; |B| = ${f(Math.hypot(c, d))}`,
      );
    },
  },
  {
    id: "motion",
    subject: "physics",
    name: "Кинематика",
    symbol: "v₀",
    description: "Прямолинейное движение с постоянным ускорением.",
    formula: "v = v₀ + at; Δx = v₀t + at²/2",
    note: "Все величины в СИ. Отрицательное перемещение означает движение против выбранной оси. Перемещение не всегда равно пройденному пути.",
    fields: [
      field("v", "Начальная скорость · м/с", 10),
      field("a", "Ускорение · м/с²", 2),
      field("t", "Время · с", 5),
    ],
    calculate: (v) => {
      const t = n(v.t);
      if (t < 0) throw Error("Время не может быть отрицательным.");
      return result(
        f(n(v.v) * t + (n(v.a) * t * t) / 2) + " м",
        `Перемещение\nКонечная скорость: ${f(n(v.v) + n(v.a) * t)} м/с`,
      );
    },
  },
  {
    id: "force",
    subject: "physics",
    name: "Сила и энергия",
    symbol: "F",
    description: "Второй закон Ньютона и механическая энергия.",
    formula: "F = ma; Eₖ = mv²/2; Eₚ = mgh",
    note: "Потенциальная энергия отсчитывается от выбранного нулевого уровня. Использовано стандартное g = 9,80665 м/с².",
    fields: [
      field("m", "Масса · кг", 2),
      field("a", "Ускорение · м/с²", 3),
      field("v", "Скорость · м/с", 10),
      field("h", "Высота · м", 5),
    ],
    calculate: (v) => {
      const m = p(v.m);
      return result(
        f(m * n(v.a)) + " Н",
        `Результирующая сила\nКинетическая энергия: ${f((m * n(v.v) ** 2) / 2)} Дж\nПотенциальная энергия: ${f(m * 9.80665 * n(v.h))} Дж`,
      );
    },
  },
  {
    id: "electric",
    subject: "physics",
    name: "Электрическая цепь",
    symbol: "Ω",
    description: "Закон Ома, мощность и расход энергии.",
    formula: "I = U/R; P = UI; E = Pt",
    note: "Модель постоянного тока для омического сопротивления. Для переменного тока с реактивной нагрузкой нужны другие формулы.",
    fields: [
      field("u", "Напряжение · В", 12),
      field("r", "Сопротивление · Ом", 6),
      field("t", "Время работы · с", 60),
    ],
    calculate: (v) => {
      const u = n(v.u),
        r = p(v.r),
        t = n(v.t);
      if (t < 0) throw Error("Время не может быть отрицательным.");
      return result(
        f(u / r) + " А",
        `Сила тока\nМощность: ${f((u * u) / r)} Вт\nЭнергия: ${f(((u * u) / r) * t)} Дж\nРасход: ${f((((u * u) / r) * t) / 3600000)} кВт·ч`,
      );
    },
  },
  {
    id: "gas",
    subject: "physics",
    name: "Идеальный газ",
    symbol: "pV",
    description: "Давление по уравнению Менделеева — Клапейрона.",
    formula: "pV = nRT; R = 8,314462618 Дж/(моль·К)",
    note: "Температуру вводите в кельвинах: T = t°C + 273,15. Идеальная модель неточна при высоких давлениях и вблизи конденсации.",
    fields: [
      field("n", "Количество вещества · моль", 1),
      field("t", "Температура · К", 298.15),
      field("v", "Объём · м³", 0.024),
    ],
    calculate: (v) => {
      const pressure = (p(v.n) * 8.314462618 * p(v.t)) / p(v.v);
      return result(
        f(pressure) + " Па",
        `${f(pressure / 1000)} кПа\n${f(pressure / 101325)} атм`,
      );
    },
  },
  {
    id: "heat",
    subject: "physics",
    name: "Теплота",
    symbol: "Q",
    description: "Энергия нагревания и охлаждения вещества.",
    formula: "Q = mc(T₂ − T₁)",
    note: "Без фазовых переходов и теплопотерь, при постоянной удельной теплоёмкости. Отрицательное Q означает отдачу теплоты.",
    fields: [
      field("m", "Масса · кг", 1),
      field("c", "Теплоёмкость · Дж/(кг·К)", 4184),
      field("t1", "Начальная температура · °C", 20),
      field("t2", "Конечная температура · °C", 80),
    ],
    calculate: (v) => {
      const t1 = n(v.t1),
        t2 = n(v.t2);
      if (Math.min(t1, t2) < -273.15)
        throw Error("Температура ниже абсолютного нуля.");
      return result(
        f(p(v.m) * p(v.c) * (t2 - t1)) + " Дж",
        `Изменение температуры: ${f(t2 - t1)} °C`,
      );
    },
  },
  {
    id: "waves",
    subject: "physics",
    name: "Волны и фотоны",
    symbol: "λ",
    description: "Длина волны, период и энергия фотона.",
    formula: "λ = v/f; T = 1/f; E = hf",
    note: "Энергия E относится к фотону электромагнитного излучения. В вакууме скорость света точно равна 299 792 458 м/с.",
    fields: [
      field("f", "Частота · Гц", 5e14),
      field("v", "Скорость волны · м/с", 299792458),
    ],
    calculate: (v) => {
      const hz = p(v.f);
      return result(
        f(p(v.v) / hz) + " м",
        `Длина волны\nПериод: ${f(1 / hz)} с\nЭнергия фотона: ${f(6.62607015e-34 * hz)} Дж\n${f((6.62607015e-34 * hz) / 1.602176634e-19)} эВ`,
      );
    },
  },
  {
    id: "molar",
    subject: "chemistry",
    name: "Молярная масса",
    symbol: "M",
    description: "Состав вещества и массовые доли элементов.",
    formula: "M = Σ nᵢAᵢ; wᵢ = nᵢAᵢ / M",
    note: "Поддерживаются все 118 элементов, скобки и кристаллогидраты, например CuSO4·5H2O. Массы округлены; для нестабильных элементов используются массовые числа.",
    fields: [text("formula", "Формула вещества", "Ca(OH)2")],
    calculate: (v) => {
      const m = molarMass(v.formula),
        a = molecule(v.formula);
      return result(
        f(m) + " г/моль",
        Object.entries(a)
          .map(
            ([k, x]) =>
              `${k}: ${x} атом(а) · ${f(((x * elements[k]) / m) * 100)} %`,
          )
          .join("\n"),
      );
    },
  },
  {
    id: "reaction",
    subject: "chemistry",
    name: "Уравнения реакций",
    symbol: "⇄",
    description: "Автоматическая расстановка целых коэффициентов.",
    formula: "Σ атомов реагентов = Σ атомов продуктов",
    note: "Введите известные реагенты и продукты без коэффициентов: Fe + O2 = Fe2O3. Калькулятор балансирует атомы, но не предсказывает продукты или возможность реакции. Ионные уравнения не поддерживаются.",
    fields: [text("reaction", "Уравнение реакции", "Fe + O2 = Fe2O3")],
    calculate: (v) => balance(v.reaction),
  },
  {
    id: "amount",
    subject: "chemistry",
    name: "Количество вещества",
    symbol: "n",
    description: "Переход от массы к молям и числу частиц.",
    formula: "n = m/M; N = nNₐ",
    note: "Число Авогадро: Nₐ = 6,02214076 × 10²³ моль⁻¹. Тип частиц определяется веществом: атомы, молекулы или формульные единицы.",
    fields: [
      text("formula", "Формула вещества", "H2O"),
      field("m", "Масса · г", 18),
    ],
    calculate: (v) => {
      const m = n(v.m);
      if (m < 0) throw Error("Масса не может быть отрицательной.");
      const amount = m / molarMass(v.formula);
      return result(
        f(amount) + " моль",
        `Число частиц: ${f(amount * 6.02214076e23)}\nМолярная масса: ${f(molarMass(v.formula))} г/моль`,
      );
    },
  },
  {
    id: "solution",
    subject: "chemistry",
    name: "Растворы",
    symbol: "c",
    description: "Молярная концентрация и массовая доля.",
    formula: "c = m/(MV); w = m / mраствора × 100%",
    note: "Используйте итоговый объём и полную массу раствора, а не объём и массу растворителя.",
    fields: [
      text("formula", "Растворённое вещество", "NaCl"),
      field("m", "Масса вещества · г", 5.85),
      field("v", "Объём раствора · л", 1),
      field("total", "Масса раствора · г", 1000),
    ],
    calculate: (v) => {
      const m = n(v.m),
        total = p(v.total);
      if (m < 0 || m > total)
        throw Error("Масса вещества должна быть от 0 до массы раствора.");
      return result(
        f(m / molarMass(v.formula) / p(v.v)) + " моль/л",
        `Молярная концентрация\nМассовая доля: ${f((m / total) * 100)} %`,
      );
    },
  },
  {
    id: "ph",
    subject: "chemistry",
    name: "pH и pOH",
    symbol: "pH",
    description: "Кислотность разбавленного водного раствора.",
    formula: "pH = −log₁₀[H⁺]; pH + pOH ≈ 14",
    note: "Приближение для разбавленного идеального раствора при 25 °C. В строгом определении pH используется активность, а не концентрация.",
    fields: [field("h", "Концентрация H⁺ · моль/л", 0.001)],
    calculate: (v) => {
      const ph = -Math.log10(p(v.h));
      return result(
        f(ph),
        `pH\npOH ≈ ${f(14 - ph)}\nСреда: ${Math.abs(ph - 7) < 1e-10 ? "нейтральная" : ph < 7 ? "кислая" : "щелочная"}`,
      );
    },
  },
  {
    id: "stoichiometry",
    subject: "chemistry",
    name: "Стехиометрия",
    symbol: "ν",
    description: "Теоретическая масса продукта по количеству реагента.",
    formula: "mB = (mA / MA) × (νB / νA) × MB",
    note: "Коэффициенты берите из уравненной реакции. Расчёт предполагает избыток остальных реагентов и выход 100%.",
    fields: [
      text("a", "Формула реагента A", "H2"),
      text("b", "Формула продукта B", "H2O"),
      field("m", "Масса A · г", 4.032),
      field("na", "Коэффициент A", 2),
      field("nb", "Коэффициент B", 2),
    ],
    calculate: (v) => {
      const m = n(v.m);
      if (m < 0) throw Error("Масса не может быть отрицательной.");
      return result(
        f((((m / molarMass(v.a)) * p(v.nb)) / p(v.na)) * molarMass(v.b)) + " г",
        "Теоретическая масса продукта B",
      );
    },
  },
];
