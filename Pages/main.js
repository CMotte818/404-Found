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
      document.querySelector(link.hash)?.scrollIntoView({ behavior: "smooth" });
    }
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

setYear();
renderAuth();
