document.addEventListener("DOMContentLoaded", () => {
  // ---- Simple client-side mock auth (replace with real API later) ----
  const AUTH_KEY = "ns.auth.isLoggedIn";
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const dashboard = document.getElementById("dashboardPreview");
  const getStartedBtn = document.getElementById("getStartedBtn");
  const yearSpan = document.getElementById("year");

  // Update footer year dynamically
  function setYear() {
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  }

  // Check login state
  function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "true";
  }

  // Show/hide dashboard and login/logout buttons
  function renderAuth() {
    const loggedIn = isLoggedIn();
    if (loginBtn) loginBtn.hidden = loggedIn;
    if (logoutBtn) logoutBtn.hidden = !loggedIn;
    if (dashboard) dashboard.hidden = !loggedIn;
  }

  // Fake login/logout (temporary until real server)
  function fakeLogin() {
    localStorage.setItem(AUTH_KEY, "true");
    renderAuth();
  }
  function fakeLogout() {
    localStorage.removeItem(AUTH_KEY);
    renderAuth();
  }

  // Event listeners for buttons
  loginBtn?.addEventListener("click", fakeLogin);
  logoutBtn?.addEventListener("click", fakeLogout);

  getStartedBtn?.addEventListener("click", () => {
    if (!isLoggedIn()) fakeLogin();
    alert("Welcome to Next Steps! This would route to your dashboard.");
  });

  // ---- Smooth scroll + active nav highlight ----
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (link.hash) {
        e.preventDefault();
        const target = document.querySelector(link.hash);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  setYear();
  renderAuth();

  /***** ===== HABITS (localStorage-powered) ===== *****/
  const LS_KEYS = {
    habits: "ns.habits",
    points: "ns.points"
  };
  const POINTS_PER_STEP = 10;

  // State helpers
  function loadHabits() {
    try { return JSON.parse(localStorage.getItem(LS_KEYS.habits)) || []; }
    catch { return []; }
  }
  function saveHabits(list) {
    localStorage.setItem(LS_KEYS.habits, JSON.stringify(list));
  }
  function loadPoints() {
    return parseInt(localStorage.getItem(LS_KEYS.points) || "0", 10);
  }
  function savePoints(n) {
    localStorage.setItem(LS_KEYS.points, String(n));
  }

  // DOM (these may not exist if you haven't added the Habits section yet)
  const habitForm   = document.getElementById("habitForm");
  const habitTitle  = document.getElementById("habitTitle");
  const habitStep   = document.getElementById("habitStep");
  const habitList   = document.getElementById("habitList");
  const pointsTotal = document.getElementById("pointsTotal");

  // Renderers
  function renderPoints() {
    if (pointsTotal) pointsTotal.textContent = loadPoints();
  }

  function renderHabitItem(h) {
    // One card-ish li per habit; steps under it
    const li = document.createElement("li");
    li.style.margin = "0 0 .75rem";
    li.style.padding = ".75rem";
    li.style.border = "1px solid rgba(255,255,255,.07)";
    li.style.borderRadius = "12px";
    li.style.background = "rgba(255,255,255,.04)";

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.gap = ".5rem";
    titleRow.innerHTML = `<strong>${h.title}</strong>
      <button class="btn btn-ghost" data-del="${h.id}" title="Delete habit">Delete</button>`;
    li.appendChild(titleRow);

    const stepsWrap = document.createElement("div");
    stepsWrap.style.marginTop = ".5rem";

    if (!h.steps || h.steps.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hero sub";
      empty.textContent = "No steps yet.";
      stepsWrap.appendChild(empty);
    } else {
      h.steps.forEach(step => {
        const row = document.createElement("label");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.gap = ".5rem";
        row.style.padding = ".45rem .6rem";
        row.style.borderRadius = ".6rem";
        row.style.background = "rgba(255,255,255,.03)";
        row.style.border = "1px solid rgba(255,255,255,.06)";
        row.style.marginBottom = ".4rem";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = ".5rem";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = isStepDoneToday(step);
        cb.addEventListener("change", () => onToggleStep(h.id, step.id, cb.checked));

        const lbl = document.createElement("span");
        lbl.textContent = step.label;

        left.appendChild(cb);
        left.appendChild(lbl);

        const meta = document.createElement("small");
        meta.className = "hero sub";
        meta.textContent = cb.checked ? "Done today" : "Not done";

        row.appendChild(left);
        row.appendChild(meta);
        stepsWrap.appendChild(row);
      });
    }

    // add-a-step tiny form
    const addStepRow = document.createElement("div");
    addStepRow.style.display = "flex";
    addStepRow.style.gap = ".5rem";
    addStepRow.style.marginTop = ".5rem";
    addStepRow.innerHTML = `
      <input type="text" placeholder="Add a step (e.g., Open book)"
        style="flex:1; min-width:160px; padding:.5rem .6rem; border-radius:.6rem;
               border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.05); color:inherit;">
      <button class="btn btn-primary">Add step</button>
    `;
    const addStepInput = addStepRow.querySelector("input");
    const addStepBtn   = addStepRow.querySelector("button");
    addStepBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const label = (addStepInput.value || "").trim();
      if (!label) return;
      addStep(h.id, label);
      addStepInput.value = "";
      renderHabits();
    });

    li.appendChild(stepsWrap);
    li.appendChild(addStepRow);

    // delete handler
    titleRow.querySelector("[data-del]").addEventListener("click", () => {
      removeHabit(h.id);
      renderHabits();
    });

    return li;
  }

  function renderHabits() {
    if (!habitList) return; // section not present
    const list = loadHabits();
    habitList.innerHTML = "";
    list.forEach(h => habitList.appendChild(renderHabitItem(h)));
    renderPoints();
  }

  // Model ops
  function addHabit(title, firstStepLabel) {
    const list = loadHabits();
    const id = crypto.randomUUID?.() || String(Date.now());
    const h = { id, title, steps: [] };
    if (firstStepLabel) {
      h.steps.push({ id: crypto.randomUUID?.() || (id+"-s1"), label: firstStepLabel, lastDoneISO: null });
    }
    list.push(h);
    saveHabits(list);
  }
  function addStep(habitId, label) {
    const list = loadHabits();
    const h = list.find(x => x.id === habitId);
    if (!h) return;
    (h.steps ||= []).push({
      id: crypto.randomUUID?.() || (habitId+"-"+Math.random().toString(16).slice(2)),
      label, lastDoneISO: null
    });
    saveHabits(list);
  }
  function removeHabit(habitId) {
    const list = loadHabits().filter(h => h.id !== habitId);
    saveHabits(list);
  }

  // Local-day comparison (robust to timezone)
  function isSameLocalDay(isoA, isoB) {
    if (!isoA || !isoB) return false;
    const a = new Date(isoA), b = new Date(isoB);
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }
  function isStepDoneToday(step) {
    const todayISO = new Date().toISOString();
    return isSameLocalDay(step.lastDoneISO, todayISO);
  }

  function onToggleStep(habitId, stepId, checked) {
    const list = loadHabits();
    const h = list.find(x => x.id === habitId);
    if (!h) return;
    const s = (h.steps || []).find(x => x.id === stepId);
    if (!s) return;

    const nowISO = new Date().toISOString();

    if (checked) {
      // award points only once per day
      if (!isStepDoneToday(s)) {
        s.lastDoneISO = nowISO;
        const pts = loadPoints() + POINTS_PER_STEP;
        savePoints(pts);
      }
    } else {
      // uncheck removes today's completion & points if it was today
      if (isStepDoneToday(s)) {
        s.lastDoneISO = null;
        const pts = Math.max(0, loadPoints() - POINTS_PER_STEP);
        savePoints(pts);
      }
    }

    saveHabits(list);
    renderHabits();
  }

  // Form wiring
  function initHabits() {
    if (habitForm) {
      habitForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = (habitTitle.value || "").trim();
        const step  = (habitStep.value || "").trim();
        if (!title) return;
        addHabit(title, step);
        habitTitle.value = "";
        habitStep.value  = "";
        renderHabits();
      });
    }
    renderHabits();
  }

  // Kick off habits if section exists
  initHabits();
});

