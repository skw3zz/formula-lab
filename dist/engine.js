// Независимые вычисления: интерфейс не участвует в математике.
export const format = (x) =>
  typeof x === "number"
    ? Number.isFinite(x)
      ? x !== 0 && (Math.abs(x) < 1e-6 || Math.abs(x) >= 1e12)
        ? x.toExponential(8).replace(".", ",")
        : Number(x.toPrecision(11)).toLocaleString("ru-RU", {
            maximumSignificantDigits: 11,
          })
      : String(x)
    : String(x);
export function number(value) {
  const n = Number(String(value).replace(",", "."));
  if (String(value).trim() === "" || !Number.isFinite(n))
    throw Error("Введите конечное число во все числовые поля.");
  return n;
}
export function positive(x) {
  x = number(x);
  if (x <= 0) throw Error("Значение должно быть больше нуля.");
  return x;
}
export const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
export function fraction(a, b) {
  a = BigInt(a);
  b = BigInt(b);
  if (!b) throw Error("Знаменатель не может быть нулём.");
  const g = gcd(a, b);
  return [(a / g) * (b < 0n ? -1n : 1n), (b / g) * (b < 0n ? -1n : 1n)];
}
export function fractions(v) {
  let a, b, c, d;
  try {
    [a, b, c, d] = ["a", "b", "c", "d"].map((k) => BigInt(v[k]));
  } catch {
    throw Error("Для дробей нужны целые числители и знаменатели.");
  }
  if (!b || !d) throw Error("Знаменатель не может быть нулём.");
  let n, m;
  switch (v.op) {
    case "+":
      n = a * d + c * b;
      m = b * d;
      break;
    case "−":
      n = a * d - c * b;
      m = b * d;
      break;
    case "×":
      n = a * c;
      m = b * d;
      break;
    default:
      n = a * d;
      m = b * c;
  }
  const [p, q] = fraction(n, m);
  return {
    value: q === 1n ? String(p) : `${p} / ${q}`,
    details: `Десятичное приближение: ${format(Number(p) / Number(q))}\nНесокращённая дробь: ${n} / ${m}`,
  };
}
export function vector(s) {
  const a = s
    .trim()
    .split(/[;\s]+/)
    .map(number);
  if (a.length !== 3)
    throw Error("Введите три координаты через пробел или точку с запятой.");
  return a;
}
export function matrix(s) {
  const a = s
    .trim()
    .split("\n")
    .map((r) =>
      r
        .trim()
        .split(/[;\s]+/)
        .map(number),
    );
  if (a.length < 2 || a.length > 6 || a.some((r) => r.length !== a.length))
    throw Error(
      "Нужна квадратная матрица от 2×2 до 6×6. Строки — с новой строки.",
    );
  return a;
}
export function determinant(a) {
  if (a.length === 1) return a[0][0];
  return a[0].reduce(
    (s, x, j) =>
      s +
      (-1) ** j *
        x *
        determinant(a.slice(1).map((r) => r.filter((_, k) => k !== j))),
    0,
  );
}
// Рекурсивный разбор выражений вместо eval: вход не исполняется как JavaScript.
export function realPower(base, exponent) {
  if (base === 0 && exponent === 0)
    throw Error("0⁰ не определено в этом калькуляторе.");
  if (base === 0 && exponent < 0)
    throw Error("Нельзя возводить ноль в отрицательную степень.");
  if (base < 0 && !Number.isInteger(exponent))
    throw Error(
      "Для отрицательного числа используйте целую степень или отдельный нечётный корень, например cbrt(-8).",
    );
  const value = base ** exponent;
  if (!Number.isFinite(value))
    throw Error("Результат слишком велик для численного расчёта.");
  return value;
}
export function realRoot(value, degree) {
  if (!Number.isSafeInteger(degree) || degree < 1 || degree > 1000000)
    throw Error("Степень корня должна быть целым числом от 1 до 1 000 000.");
  if (value < 0 && degree % 2 === 0)
    throw Error(
      "Чётный корень из отрицательного числа не является действительным числом.",
    );
  if (degree === 2) return Math.sqrt(value);
  if (degree === 3) return Math.cbrt(value);
  return Math.sign(value) * Math.abs(value) ** (1 / degree);
}
export function expression(source, x = 0) {
  const text = source
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/√/g, "sqrt")
    .replace(/∛/g, "cbrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  const tokens =
    text.match(/(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[a-z]+|[+\-*/^()]/gi) ||
    [];
  if (tokens.join("") !== text || tokens.length > 300)
    throw Error("Недопустимое выражение.");
  let i = 0;
  const funcs = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    ln: Math.log,
    log: Math.log10,
    exp: Math.exp,
  };
  function atom() {
    const t = tokens[i++];
    if (t === "(") {
      const y = sum();
      if (tokens[i++] !== ")") throw Error("Проверьте скобки.");
      return y;
    }
    if (t === "x") return x;
    if (t === "pi") return Math.PI;
    if (t === "e") return Math.E;
    if (t in funcs) {
      if (tokens[i++] !== "(") throw Error("После функции нужны скобки.");
      const y = sum();
      if (tokens[i++] !== ")") throw Error("Проверьте скобки.");
      return funcs[t](y);
    }
    if (t === undefined || !/^\d|^\./.test(t))
      throw Error("Ожидалось число или функция.");
    return Number(t);
  }
  function power() {
    let y = atom();
    if (tokens[i] === "^") {
      i++;
      y = realPower(y, unary());
    }
    return y;
  }
  function unary() {
    if (tokens[i] === "+") {
      i++;
      return unary();
    }
    if (tokens[i] === "-") {
      i++;
      return -unary();
    }
    return power();
  }
  function product() {
    let y = unary();
    while (["*", "/"].includes(tokens[i])) {
      const op = tokens[i++],
        z = unary();
      y = op === "*" ? y * z : y / z;
    }
    return y;
  }
  function sum() {
    let y = product();
    while (["+", "-"].includes(tokens[i])) {
      const op = tokens[i++],
        z = product();
      y = op === "+" ? y + z : y - z;
    }
    return y;
  }
  const result = sum();
  if (i !== tokens.length || !Number.isFinite(result))
    throw Error("Выражение не определено или результат слишком велик.");
  return result;
}
// Относительные атомные массы округлены; для нестабильных элементов — массовые числа.
const symbols =
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(
    " ",
  );
const masses = [
  1.008, 4.0026, 6.94, 9.0122, 10.81, 12.011, 14.007, 15.999, 18.998, 20.18,
  22.99, 24.305, 26.982, 28.085, 30.974, 32.06, 35.45, 39.948, 39.098, 40.078,
  44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38,
  69.723, 72.63, 74.922, 78.971, 79.904, 83.798, 85.468, 87.62, 88.906, 91.224,
  92.906, 95.95, 98, 101.07, 102.906, 106.42, 107.868, 112.414, 114.818, 118.71,
  121.76, 127.6, 126.904, 131.293, 132.905, 137.327, 138.905, 140.116, 140.908,
  144.242, 145, 150.36, 151.964, 157.25, 158.925, 162.5, 164.93, 167.259,
  168.934, 173.045, 174.967, 178.49, 180.948, 183.84, 186.207, 190.23, 192.217,
  195.084, 196.967, 200.592, 204.38, 207.2, 208.98, 209, 210, 222, 223, 226,
  227, 232.038, 231.036, 238.029, 237, 244, 243, 247, 247, 251, 252, 257, 258,
  259, 266, 267, 268, 269, 270, 277, 278, 281, 282, 285, 286, 289, 290, 293,
  294, 294,
];
export const elements = Object.fromEntries(
  symbols.map((s, i) => [s, masses[i]]),
);
export function molecule(source) {
  let s = source.trim().replace(/[₀-₉]/g, (c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c));
  if (s.length > 180) throw Error("Слишком длинная формула.");
  const total = {};
  for (const part of s.split(/[·.]/)) {
    let i = 0;
    const count = () => {
      const m = part.slice(i).match(/^\d+/);
      if (!m) return 1;
      i += m[0].length;
      const n = Number(m[0]);
      if (n < 1 || n > 1e6) throw Error("Недопустимый индекс.");
      return n;
    };
    const multiplier = count();
    function group(close = "") {
      const result = {};
      while (i < part.length && part[i] !== close) {
        if ("([".includes(part[i])) {
          const end = part[i++] === "(" ? ")" : "]",
            inner = group(end);
          if (part[i++] !== end) throw Error("Проверьте скобки формулы.");
          const n = count();
          for (const [k, v] of Object.entries(inner))
            result[k] = (result[k] || 0) + v * n;
        } else {
          const m = part.slice(i).match(/^[A-Z][a-z]?/);
          if (!m || !elements[m[0]])
            throw Error("Неизвестный элемент или некорректная формула.");
          i += m[0].length;
          result[m[0]] = (result[m[0]] || 0) + count();
        }
      }
      return result;
    }
    const g = group();
    if (i !== part.length || !Object.keys(g).length)
      throw Error("Проверьте формулу вещества.");
    for (const [k, v] of Object.entries(g))
      total[k] = (total[k] || 0) + v * multiplier;
  }
  return total;
}
export const molarMass = (s) =>
  Object.entries(molecule(s)).reduce((sum, [k, n]) => sum + elements[k] * n, 0);
// Баланс атомов через точное исключение Гаусса над рациональными числами.
export function balance(source) {
  const sides = source.split(/->|→|=/);
  if (sides.length !== 2)
    throw Error("Разделите реагенты и продукты знаком =.");
  const left = sides[0].split("+").map((s) => s.trim()),
    right = sides[1].split("+").map((s) => s.trim()),
    species = [...left, ...right];
  if (species.length > 12 || species.some((s) => /^\d/.test(s)))
    throw Error("Введите до 12 веществ без готовых коэффициентов.");
  const atoms = species.map(molecule),
    keys = [...new Set(atoms.flatMap(Object.keys))];
  const f = (n, d = 1n) => fraction(n, d),
    add = (a, b) => f(a[0] * b[1] + b[0] * a[1], a[1] * b[1]),
    mul = (a, b) => f(a[0] * b[0], a[1] * b[1]),
    neg = (a) => [-a[0], a[1]],
    div = (a, b) => f(a[0] * b[1], a[1] * b[0]);
  const a = keys.map((k) =>
    atoms.map((o, j) => f(BigInt((o[k] || 0) * (j < left.length ? 1 : -1)))),
  );
  let row = 0;
  const piv = [];
  for (let c = 0; c < species.length && row < a.length; c++) {
    let p = a.findIndex((r, j) => j >= row && r[c][0] !== 0n);
    if (p < 0) continue;
    [a[p], a[row]] = [a[row], a[p]];
    const q = a[row][c];
    a[row] = a[row].map((t) => div(t, q));
    for (let r = 0; r < a.length; r++)
      if (r !== row) {
        const q = a[r][c];
        a[r] = a[r].map((t, j) => add(t, neg(mul(q, a[row][j]))));
      }
    piv.push(c);
    row++;
  }
  const free = species.map((_, i) => i).filter((i) => !piv.includes(i));
  if (free.length !== 1)
    throw Error(
      "Однозначный баланс не найден: проверьте вещества или разделите реакцию.",
    );
  const x = species.map(() => f(0n));
  x[free[0]] = f(1n);
  piv.forEach((c, r) => (x[c] = neg(a[r][free[0]])));
  let l = 1n;
  for (const q of x) l = (l * q[1]) / gcd(l, q[1]);
  let ints = x.map((q) => (q[0] * l) / q[1]);
  if (ints.every((n) => n < 0n)) ints = ints.map((n) => -n);
  if (ints.some((n) => n <= 0n))
    throw Error(
      "Указанные вещества не образуют баланс с положительными коэффициентами.",
    );
  const g = ints.reduce(gcd);
  ints = ints.map((n) => n / g);
  const render = (s, j) => (ints[j] === 1n ? "" : ints[j] + " ") + s;
  return {
    value:
      left.map(render).join(" + ") +
      " → " +
      right.map((s, j) => render(s, j + left.length)).join(" + "),
    details:
      "Число атомов каждого элемента слева и справа совпадает.\nКоэффициенты: " +
      ints.join(" : "),
  };
}
