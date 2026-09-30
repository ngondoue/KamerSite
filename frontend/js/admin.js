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


