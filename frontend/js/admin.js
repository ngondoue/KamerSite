doocument.addEventListener("DOMContentLoaded", () => {
if (!isLoggedIn()) {
window.location.href = "auth.html";
return;
}

loadAdminPage();
});

async function loadAdminPage() {
setupNavigation();
setupLogout();
setupPlaceForm();
setupCategoryForm();
setupFilters();
setupModal();

try {
await loadAdminInfo();
await loadDashboard();
} catch (error) {
console.error("Admin page error:", error);
alert(error.message || "Unable to load admin dashboard.");
}
}


// =========================
// NAVIGATION
// =========================

function setupNavigation() {
const buttons = document.querySelectorAll(".admin-nav-btn");

buttons.forEach((button) => {
if (button.id === "logoutBtn") {
return;
}

button.addEventListener("click", async () => {
const sectionName = button.dataset.section;

showSection(sectionName);

if (sectionName === "dashboard") {
await loadDashboard();
}

if (sectionName === "places") {
await loadPlaces();
await loadPlaceCategories();
}

if (sectionName === "categories") {
await loadCategories();
}

if (sectionName === "reviews") {
await loadReviews();
}

if (sectionName === "users") {
await loadUsers();
}
});
});
}


function showSection(sectionName) {
const sections = document.querySelectorAll(".admin-section");
const buttons = document.querySelectorAll(".admin-nav-btn");

sections.forEach((section) => {
section.classList.remove("active");
});

buttons.forEach((button) => {
button.classList.remove("active");
});

const section = document.getElementById(sectionName);
const button = document.querySelector(
`.admin-nav-btn[data-section="${sectionName}"]`
);

if (section) {
section.classList.add("active");
}

if (button) {
button.classList.add("active");
}

updatePageTitle(sectionName);
}

function updatePageTitle(sectionName) {
const pageTitle = document.getElementById("pageTitle");

const titles = {
dashboard: "Dashboard",
places: "Places",
categories: "Categories",
reviews: "Reviews",
users: "Users"
};

pageTitle.textContent = titles[sectionName] || "Admin Dashboard";
}
async function loadAdminInfo() {
try {
const user = await apiFetch("/auth/profile");

const adminName = document.getElementById("adminName");

if (adminName) {
adminName.textContent = user.name || "Admin";
}

if (user.role !== "admin") {
alert("You do not have admin access.");
logout();
}
} catch (error) {
console.error("Could not load admin information:", error);
logout();
}
}
function setupLogout() {
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", logout);
}


function logout() {
localStorage.removeItem("kamersite_token");
localStorage.removeItem("kamersite_user");

window.location.href = "auth.html";
}
async function loadDashboard() {
const dashboardPlaces = document.getElementById("dashboardPlaces");

dashboardPlaces.innerHTML = `
<div class="loading">
Loading dashboard...
</div>
`;

try {
const data = await apiFetch("/admin/dashboard");

document.getElementById("totalPlaces").textContent =
data.totalPlaces || 0;

document.getElementById("publishedPlaces").textContent =
data.publishedPlaces || 0;

document.getElementById("totalCategories").textContent =
data.totalCategories || 0;

document.getElementById("totalUsers").textContent =
data.totalUsers || 0;

const places = await apiFetch("/admin/places");

displayDashboardPlaces(places);

} catch (error) {
dashboardPlaces.innerHTML = `
<div class="empty">
<h3>Unable to load dashboard</h3>
<p>${error.message}</p>
</div>
`;
}
}

