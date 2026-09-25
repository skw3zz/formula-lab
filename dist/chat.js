// История — в пределах вкладки. Предпочтения — на этом устройстве.
export async function initChat({ initialChat, getContext }) {
  // GitHub Pages обслуживает только статические файлы, сервер чата там отсутствует.
  if (location.hostname.endsWith(".github.io")) return;
  const $ = (id) => document.getElementById(id);
  // Пока сервер не настроен, чат не появляется в навигации, даже по #chat.
  // После подключения ключа достаточно перезагрузить страницу.
  try {
    const response = await fetch("/api/chat/status", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !(await response.json()).configured) return;
  } catch {
    return;
  }
  $("chat-open").hidden = false;
  let messages = [],
    controller = null,
    ready = false;
  const profileIds = [
    "learning-level",
    "learning-style",
    "learning-goal",
    "share-context",
  ];
  try {
    const saved = JSON.parse(sessionStorage.getItem("formula-chat") || "[]");
    if (Array.isArray(saved))
      messages = saved
        .filter(
          (m) =>
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string",
        )
        .slice(-20);
    const profile = JSON.parse(localStorage.getItem("formula-profile") || "{}");
    profileIds.forEach((id) => {
      if (id === "share-context") $(id).checked = profile[id] !== false;
      else if (typeof profile[id] === "string") $(id).value = profile[id];
    });
  } catch {}
  function saveProfile() {
    const profile = Object.fromEntries(
      profileIds.map((id) => [
        id,
        id === "share-context" ? $(id).checked : $(id).value,
      ]),
    );
    try {
      localStorage.setItem("formula-profile", JSON.stringify(profile));
    } catch {}
  }
  profileIds.forEach((id) => $(id).addEventListener("change", saveProfile));
  function render() {
    $("messages").replaceChildren(
      ...messages.map((message) => {
        const article = document.createElement("article");
        article.className = "message " + message.role;
        const name = document.createElement("span");
        name.className = "message-author";
        name.textContent = message.role === "user" ? "ТЫ" : "✦ ФОРМУЛА";
        const body = document.createElement("div");
        body.textContent = message.content;
        article.append(name, body);
        return article;
      }),
    );
    $("chat-starters").hidden = messages.length > 0;
    $("messages").scrollTop = $("messages").scrollHeight;
    try {
      sessionStorage.setItem(
        "formula-chat",
        JSON.stringify(messages.slice(-20)),
      );
    } catch {}
  }
  async function connection() {
    try {
      const response = await fetch("/api/chat/status", { cache: "no-store" });
      if (!response.ok) throw Error();
      const status = await response.json();
      ready = status.configured === true;
      $("ai-status").textContent = ready
        ? "✦ Готов к твоим вопросам"
        : "ИИ ещё не подключён. Владелец сайта должен подключить сервис ответов.";
    } catch {
      $("ai-status").textContent =
        "Не удалось проверить подключение ИИ. Попробуй открыть чат позже.";
      ready = false;
    }
    $("chat-send").disabled = !ready || !!controller;
  }
  function open() {
    $("calculator-page").hidden = true;
    $("chat-page").hidden = false;
    document.body.classList.add("chat-view");
    $("chat-open").classList.add("active");
    history.replaceState(null, "", "#chat");
    $("context-name").textContent = "Сейчас: " + getContext().tool;
    connection();
  }
  $("chat-open").onclick = open;
  window.addEventListener("hashchange", () => {
    if (location.hash === "#chat") open();
  });
  $("new-chat").onclick = () => {
    controller?.abort();
    messages = [];
    render();
    $("chat-error").textContent = "";
    $("chat-input").value = "";
  };
  document.querySelectorAll("[data-prompt]").forEach(
    (button) =>
      (button.onclick = () => {
        $("chat-input").value = button.dataset.prompt;
        $("chat-input").focus();
      }),
  );
  $("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      $("chat-form").requestSubmit();
    }
  });
  $("chat-stop").onclick = () => controller?.abort();
  $("chat-form").onsubmit = async (event) => {
    event.preventDefault();
    const text = $("chat-input").value.trim();
    if (!text || controller || !ready) return;
    const previous = messages.slice(-19);
    messages = [...previous, { role: "user", content: text }];
    render();
    $("chat-input").value = "";
    $("chat-error").textContent = "";
    controller = new AbortController();
    const activeController = controller;
    $("chat-send").disabled = true;
    $("chat-stop").hidden = false;
    $("ai-status").textContent = "✦ Обдумываю вопрос…";
    const timeout = setTimeout(() => activeController.abort(), 65000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: activeController.signal,
        body: JSON.stringify({
          messages,
          profile: {
            level: $("learning-level").value,
            style: $("learning-style").value,
            goal: $("learning-goal").value,
          },
          context: $("share-context").checked ? getContext() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Не удалось получить ответ.");
      if (typeof data.reply !== "string" || !data.reply.trim())
        throw Error("Сервис вернул пустой ответ.");
      if (activeController.signal.aborted) return;
      messages.push({ role: "assistant", content: data.reply });
      render();
    } catch (error) {
      if (messages.length && messages.at(-1)?.content === text) {
        messages = previous;
        render();
        $("chat-input").value = text;
        $("chat-error").textContent =
          error.name === "AbortError"
            ? "Запрос остановлен. Сообщение сохранено в поле ввода."
            : error.message;
      }
    } finally {
      clearTimeout(timeout);
      controller = null;
      $("chat-stop").hidden = true;
      $("chat-send").disabled = !ready;
      $("ai-status").textContent = ready
        ? "✦ Готов к твоим вопросам"
        : "ИИ ещё не подключён.";
    }
  };
  render();
  if (initialChat) open();
}
