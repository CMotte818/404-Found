// Pages/main.js — Combined Auth + Habits + Nav
document.addEventListener("DOMContentLoaded", () => {
  // ====== ELEMENTS USED ACROSS PAGES ======
  const loginBtn     = document.getElementById("loginBtn");
  const logoutBtn    = document.getElementById("logoutBtn");
  const dashboard    = document.getElementById("dashboardPreview");
  const userNameEl   = document.getElementById("userName");
  const getStarted   = document.getElementById("getStartedBtn");
  const yearSpan     = document.getElementById("year");
  const whoami       = document.getElementById("whoami"); // optional greeting in header

  // Auth modal bits (present on each page per your markup)
  const authModal = document.getElementById("authModal");
  const authClose = document.getElementById("authClose");
  const authForm  = document.getElementById("authForm");
  const authName  = document.getElementById("authName");
  const authEmail = document.getElementById("authEmail");
  const authRole  = document.getElementById("authRole");

  // ====== AUTH (local-only demo) ======
  const AUTH_FLAG = "ns.auth.isLoggedIn";
  const AUTH_USER = "ns.auth.user"; // {name,email,role}

  const setYear = () => { if (yearSpan) yearSpan.textContent = new Date().getFullYear(); };
  const isLoggedIn = () => localStorage.getItem(AUTH_FLAG) === "true";
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_USER)); }
    catch { return null; }
  };

  const renderAuth = () => {
    const logged = isLoggedIn();
    if (loginBtn)  loginBtn.hidden  = logged;
    if (logoutBtn) logoutBtn.hidden = !logged;
    if (dashboard) dashboard.hidden = !logged;

    const u = getUser();
    if (userNameEl) userNameEl.textContent = (isLoggedIn() && u?.name) ? u.name : "friend";
    if (whoami)     whoami.textContent     = (isLoggedIn() && u) ? `Welcome back, ${u.name}` : "";
  };

  const openModal  = () => { if (authModal) authModal.hidden = false; };
  const closeModal = () => { if (authModal) authModal.hidden = true; };

  const completeLogin = (user) => {
    localStorage.setItem(AUTH_USER, JSON.stringify(user));
    localStorage.setItem(AUTH_FLAG, "true");
    renderAuth();
  };
  const doLogout = () => {
    localStorage.removeItem(AUTH_FLAG);
    localStorage.removeItem(AUTH_USER);
    renderAuth();
  };

  loginBtn?.addEventListener("click", openModal);
  logoutBtn?.addEventListener("click", doLogout);
  authClose?.addEventListener("click", closeModal);

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name  = (authName?.value || "").trim();
    const email = (authEmail?.value || "").trim().toLowerCase();
    const role  = (authRole?.value || "").trim();
    if (!name || !email.includes("@") || !role) return;

    completeLogin({ name, email, role });
    closeModal();

    if (location.pathname.toLowerCase().endsWith("home_page.html")) {
      window.location.href = "habits.html";
    }
  });

  getStarted?.addEventListener("click", () => {
    if (isLoggedIn()) window.location.href = "habits.html";
    else openModal();
  });

  // Guard Habits page (open modal if not logged in)
  const onHabits = location.pathname.toLowerCase().endsWith("habits.html");
  // If not logged in, go back to Home with a #login hint instead of opening the modal here
  if (onHabits && !isLoggedIn()) {
  window.location.replace("home_page.html#login");
  }

  // ====== NAV: smooth-scroll for same-page anchors + active link ======
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!link.hash || link.hash.length <= 1) return; // not an in-page anchor
      const url = new URL(link.href, location.href);
      const samePage = url.pathname === location.pathname;
      if (samePage && url.hash.length > 1) {
        e.preventDefault();
        document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  {
    const path = location.pathname.toLowerCase();
    navLinks.forEach(l => {
      const href = l.getAttribute("href") || "";
      if (!href.startsWith("#") && path.endsWith(href.toLowerCase())) {
        l.classList.add("active");
      }
    });
  }

  // ====== HABITS (only runs if the elements exist) ======
  const HABITS_KEY = "ns.habits.v1";
  const POINTS_KEY = "ns.points.v1";

  const habitForm   = document.getElementById("habitForm");
  const habitTitle  = document.getElementById("habitTitle");
  const habitStep   = document.getElementById("habitStep");
  const habitList   = document.getElementById("habitList");
  const pointsTotal = document.getElementById("pointsTotal");

  const loadJSON = (k, dflt) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? dflt; }
    catch { return dflt; }
  };
  const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let habits = loadJSON(HABITS_KEY, []);  // [{id,title,step,done:false}]
  let points = Number(localStorage.getItem(POINTS_KEY) || "0") || 0;

  const setPoints = (n) => {
    points = Math.max(0, Number(n) || 0);
    localStorage.setItem(POINTS_KEY, String(points));
    if (pointsTotal) pointsTotal.textContent = String(points);
  };

  const uid = () => Math.random().toString(36).slice(2, 9);

  const addHabit = (title, step) => {
    habits.push({ id: uid(), title, step: step || "", done: false });
    saveJSON(HABITS_KEY, habits);
  };

  const deleteHabit = (id) => {
    habits = habits.filter(h => h.id !== id);
    saveJSON(HABITS_KEY, habits);
  };

  const toggleHabit = (id) => {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    h.done = !h.done;
    // Simple scoring: +1 when you mark done, -1 if you unmark
    setPoints(points + (h.done ? 1 : -1));
    saveJSON(HABITS_KEY, habits);
  };

  const renderHabits = () => {
    if (!habitList) return;
    habitList.innerHTML = "";

    if (!habits.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No habits yet—add one above.";
      habitList.appendChild(li);
      return;
    }

    habits.forEach(h => {
      const li = document.createElement("li");
      li.className = "habit-item";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.gap = ".5rem";
      left.style.alignItems = "center";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!h.done;
      cb.addEventListener("change", () => toggleHabit(h.id));

      const title = document.createElement("span");
      title.textContent = h.title;
      title.style.fontWeight = "600";

      const step = document.createElement("span");
      step.textContent = h.step ? ` — ${h.step}` : "";
      step.className = "sub";

      left.appendChild(cb);
      left.appendChild(title);
      left.appendChild(step);

      const actions = document.createElement("div");
      const del = document.createElement("button");
      del.className = "btn btn-ghost";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        deleteHabit(h.id);
        renderHabits();
      });
      actions.appendChild(del);

      li.appendChild(left);
      li.appendChild(actions);
      habitList.appendChild(li);
    });
  };

  const initHabits = () => {
    if (!habitForm || !habitList) return;
    // initial points render
    setPoints(points);

    habitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (habitTitle?.value || "").trim();
      const step  = (habitStep?.value || "").trim();
      if (!title) return;
      addHabit(title, step);
      habitTitle.value = "";
      habitStep.value  = "";
      renderHabits();
    });

    renderHabits();
  };

  // ====== BOOT ======
  setYear();
  renderAuth();
  if (isLoggedIn() && authModal) authModal.hidden = true;
  initHabits();
});
