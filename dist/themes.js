// Тема применяется до отрисовки. Палитры страницы находятся в styles.css.
(() => {
  const themes = [
    {
      id: "dark-orange",
      name: "Чёрный · оранжевый",
      bg: "#111214",
      panel: "#26272b",
      accent: "#ffab57",
    },
    {
      id: "dark-blue",
      name: "Чёрный · голубой",
      bg: "#111214",
      panel: "#26272b",
      accent: "#6dcaff",
    },
    {
      id: "dark-white",
      name: "Чёрный · белый",
      bg: "#111214",
      panel: "#26272b",
      accent: "#f2f3f5",
    },
    {
      id: "light-orange",
      name: "Белый · оранжевый",
      bg: "#f5f6f8",
      panel: "#ffffff",
      accent: "#b84908",
    },
    {
      id: "light-black",
      name: "Белый · чёрный",
      bg: "#f5f6f8",
      panel: "#ffffff",
      accent: "#202329",
    },
    {
      id: "light-blue",
      name: "Белый · голубой",
      bg: "#f5f6f8",
      panel: "#ffffff",
      accent: "#0875bd",
    },
  ];
  let selected = "light-blue";
  try {
    const saved = localStorage.getItem("formula-lab-theme");
    if (themes.some((t) => t.id === saved)) selected = saved;
  } catch {}
  document.documentElement.dataset.theme = selected;
  document.addEventListener("DOMContentLoaded", () => {
    const dialog = document.getElementById("theme-dialog");
    function apply(theme) {
      selected = theme.id;
      document.documentElement.dataset.theme = selected;
      document.getElementById("theme-name").textContent = theme.name;
      dialog
        .querySelectorAll("[data-theme-choice]")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.themeChoice === selected),
          ),
        );
      try {
        localStorage.setItem("formula-lab-theme", selected);
      } catch {}
    }
    themes.forEach((theme) => {
      const button = document.createElement("button");
      button.className = "theme-card";
      button.dataset.themeChoice = theme.id;
      button.setAttribute("aria-label", theme.name);
      button.style.setProperty("--preview-bg", theme.bg);
      button.style.setProperty("--preview-panel", theme.panel);
      button.style.setProperty("--preview-accent", theme.accent);
      button.innerHTML =
        '<span class="theme-preview" aria-hidden="true"><span class="preview-sidebar"><i></i><i></i><i></i></span><span class="preview-content"><i></i><span><i></i><i></i></span><b></b></span></span><span class="theme-caption"></span><span class="theme-check" aria-hidden="true">✓</span>';
      button.querySelector(".theme-caption").textContent = theme.name;
      button.onclick = () => apply(theme);
      document
        .getElementById(
          theme.id.startsWith("dark") ? "dark-themes" : "light-themes",
        )
        .append(button);
    });
    apply(themes.find((t) => t.id === selected));
    document.getElementById("theme-open").onclick = () => dialog.showModal();
    document.getElementById("theme-close").onclick = () => dialog.close();
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
  });
})();
