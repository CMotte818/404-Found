// Pages/main.js — Auth + Nav + Optional Habits + Home plan previews + Today list
document.addEventListener("DOMContentLoaded", () => {
  // ====== ELEMENTS USED ACROSS PAGES ======
  const loginBtn     = document.getElementById("loginBtn");
  const logoutBtn    = document.getElementById("logoutBtn");
  const dashboard    = document.getElementById("dashboardPreview");
  const userNameEl   = document.getElementById("userName");
  const getStarted   = document.getElementById("getStartedBtn");
  const yearSpan     = document.getElementById("year");
  const whoami       = document.getElementById("whoami");

  // Auth modal bits
  const authModal = document.getElementById("authModal");
  const authClose = document.getElementById("authClose");
  const authForm  = document.getElementById("authForm");
 // const authName  = document.getElementById("authName");
  const authEmail = document.getElementById("authEmail");
  const authRole  = document.getElementById("authRole");

  // ====== CONST KEYS ======
  const AUTH_FLAG       = "ns.auth.isLoggedIn";
  const AUTH_USER       = "ns.auth.user";   // {name,email,role}
  const HABITS_KEY      = "ns.habits.v1";
  const POINTS_KEY      = "ns.points.v1";
  const BUILD_PLAN_KEY  = "ns.buildPlan.v1";
  const BREAK_PLAN_KEY  = "ns.breakPlan.v1";

  // ====== HELPERS ======
  const setYear = () => {
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  };

  const loadJSON = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const isLoggedIn = () => localStorage.getItem(AUTH_FLAG) === "true";
  const getUser    = () => loadJSON(AUTH_USER, null);

  // ====== AUTH RENDER ======
  const renderAuth = () => {
    const logged = isLoggedIn();
    if (loginBtn)  loginBtn.hidden  = logged;
    if (logoutBtn) logoutBtn.hidden = !logged;
    if (dashboard) dashboard.hidden = !logged;

    const u = getUser();
    if (userNameEl) userNameEl.textContent = (logged && u?.name) ? u.name : "friend";
    if (whoami)     whoami.textContent     = (logged && u) ? `Welcome back, ${u.name}` : "";
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
    window.location.href = "home_page.html";
  };

  // ====== AUTH EVENTS ======
  loginBtn?.addEventListener("click", function (e) {
    e.preventDefault
    window.location.href = "login.html";
  });
  logoutBtn?.addEventListener("click", doLogout);
  authClose?.addEventListener("click", closeModal);

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (authEmail?.value || "").trim().toLowerCase();
    const role  = (authRole?.value || "").trim();
    if (!email.includes("@") || !role) return;

    completeLogin({ email, role });

    // after login, go to build a habit
    if (location.pathname.toLowerCase().endsWith("login.html")) {
      window.location.href = "build_habit.html";
    }
  });

  // “Get started” on home → go to build, or open login
  getStarted?.addEventListener("click", () => {
    if (isLoggedIn()) window.location.href = "build_habit.html";
    else window.location.href = 'signup.html';
  });

  // ====== PAGE GUARD FOR BUILD/BREAK ======
  const path = location.pathname.toLowerCase();
  const onBuildHabit = path.endsWith("build_habit.html");
  const onBreakHabit = path.endsWith("break_habit.html");

  if ((onBuildHabit || onBreakHabit) && !isLoggedIn()) {
    window.location.href = "login.html";
  }

  // ====== NAV ACTIVE / SMOOTH ======
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!link.hash || link.hash.length <= 1) return;
      const url = new URL(link.href, location.href);
      const samePage = url.pathname === location.pathname;
      if (samePage && url.hash.length > 1) {
        e.preventDefault();
        document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  navLinks.forEach(l => {
    const href = l.getAttribute("href") || "";
    if (!href.startsWith("#") && path.endsWith(href.toLowerCase())) {
      l.classList.add("active");
    }
  });

  // ====== OPTIONAL HABIT LIST (only if markup exists) ======
  const habitForm   = document.getElementById("habitForm");
  const habitTitle  = document.getElementById("habitTitle");
  const habitStep   = document.getElementById("habitStep");
  const habitList   = document.getElementById("habitList");
  const pointsTotal = document.getElementById("pointsTotal");

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
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  };

  const deleteHabit = (id) => {
    habits = habits.filter(h => h.id !== id);
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  };

  const toggleHabit = (id) => {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    h.done = !h.done;
    setPoints(points + (h.done ? 1 : -1));
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
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
      cb.addEventListener("change", () => {
        toggleHabit(h.id);
        renderHabits();
      });

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

  // ====== HOME: CARD PREVIEWS FROM LOCAL STORAGE ======
  const buildPreview = document.getElementById("buildPlanPreview");
  const breakPreview = document.getElementById("breakPlanPreview");

  const renderBuildPlanCard = () => {
    if (!buildPreview) return;
    const plan = loadJSON(BUILD_PLAN_KEY, null);
    if (!plan) {
      buildPreview.innerHTML = `<p class="sub">No build-habit plan yet.</p>`;
      return;
    }
    buildPreview.innerHTML = `
      <h3 style="margin-top:0;">Build a habit</h3>
      <p><strong>Goal:</strong> ${plan.goal || "—"}</p>
      <p><strong>Steps:</strong> ${
        plan.steps && plan.steps.length ? plan.steps.join(", ") : "—"
      }</p>
      <p><strong>Reward:</strong> ${plan.reward || "—"}</p>
      <p class="sub">Saved on ${new Date(plan.created).toLocaleString()}</p>
    `;
  };

  const renderBreakPlanCard = () => {
    if (!breakPreview) return;
    const plan = loadJSON(BREAK_PLAN_KEY, null);
    if (!plan) {
      breakPreview.innerHTML = `<p class="sub">No break-habit plan yet.</p>`;
      return;
    }
    breakPreview.innerHTML = `
      <h3 style="margin-top:0;">Break a habit</h3>
      <p><strong>Habit:</strong> ${plan.habit || "—"}</p>
      <p><strong>Replacements:</strong> ${
        plan.replacements && plan.replacements.length ? plan.replacements.join(", ") : "—"
      }</p>
      <p><strong>Tiny steps:</strong> ${
        plan.tinySteps && plan.tinySteps.length ? plan.tinySteps.join(", ") : "—"
      }</p>
      <p class="sub">Saved on ${new Date(plan.created).toLocaleString()}</p>
    `;
  };

  // ====== HOME: PUT PLANS INTO THE "TODAY" CARD ======
  const renderTodayFromPlans = () => {
    const todayList = document.getElementById("todayList");
    if (!todayList) return; // not on home or card layout changed

    // remove old dynamic items so it doesn't duplicate
    todayList.querySelectorAll('[data-from="plans"]').forEach(el => el.remove());

   // NEW: steps-only snapshot from build page
    const todayPlan = loadJSON("ns.todayPlan.v1", null);

    // if we have explicit today's steps, show those first
  if (todayPlan && Array.isArray(todayPlan.steps) && todayPlan.steps.length) {
    const li = document.createElement("li");
    li.dataset.from = "plans";
    li.textContent = `✅ Today: ${todayPlan.steps[0]}`;
    todayList.appendChild(li);
  }

    const buildPlan = loadJSON(BUILD_PLAN_KEY, null);
    const breakPlan = loadJSON(BREAK_PLAN_KEY, null);

    if (buildPlan && buildPlan.goal) {
      const li = document.createElement("li");
      li.dataset.from = "plans";
      li.textContent = `✅ Habit: ${buildPlan.goal}`;
      todayList.appendChild(li);

      if (buildPlan.steps && buildPlan.steps.length) {
        const li2 = document.createElement("li");
        li2.dataset.from = "plans";
        li2.textContent = `➡️ First step: ${buildPlan.steps[0]}`;
        todayList.appendChild(li2);
      }
    }

    if (breakPlan && breakPlan.habit) {
      const li = document.createElement("li");
      li.dataset.from = "plans";
      li.textContent = `🧹 Break: ${breakPlan.habit}`;
      todayList.appendChild(li);

      if (breakPlan.tinySteps && breakPlan.tinySteps.length) {
        const li2 = document.createElement("li");
        li2.dataset.from = "plans";
        li2.textContent = `➡️ Try: ${breakPlan.tinySteps[0]}`;
        todayList.appendChild(li2);
      }
    }
  };

  // ====== BOOT ======
  setYear();
  renderAuth();
  if (isLoggedIn() && authModal) authModal.hidden = true;
  initHabits();
  renderBuildPlanCard();
  renderBreakPlanCard();
  renderTodayFromPlans();
});

// Used for creating a new user on the Sign Up page
document.getElementById('signupForm').addEventListener('submit', function (e) {
  //prevent refreshing of page
  e.preventDefault();

  //get values for all entered fields
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  let confirmPassword = document.getElementById('confirmPassword').value;
  let passwordError = document.getElementById("passwordError");
  let confirmPasswordError = document.getElementById('confirmPasswordError');
  let confirmation = document.getElementById('confirmation');

  //confirm that the entered password is valid
  let validPassword = validatePassword(password);
  if (!validPassword) {
      passwordError.textContent = 'Invalid password';
      return;
  }
  else {
      passwordError.textContent = '';
  }

  //confirm that the passwords match
  if (password !== confirmPassword) {
      confirmPasswordError.textContent = 'Passwords do not match';
      return;
  }
  else {
      confirmPasswordError.textContent = '';
  }

  //send all form data to backend

  confirmation.style.color = 'green';
  confirmation.textContent = 'Success! Please proceed to log in page.';

});

document.getElementById('password').addEventListener('focus', function () {
    document.getElementById('passwordRequirement').style.display = 'block';
});

document.getElementById('password').addEventListener('blur', function () {
    document.getElementById('passwordRequirement').style.display = 'none';
});

function validatePassword(password) {
    let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};
