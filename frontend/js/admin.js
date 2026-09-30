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

function displayDashboardPlaces(places) {
const container = document.getElementById("dashboardPlaces");

if (!places || places.length === 0) {
container.innerHTML = `
<div class="empty">
<h3>No places available</h3>
<p>Add a place to get started.</p>
</div>
`;
return;
}

const recentPlaces = places.slice(0, 5);

let html = `
<div class="table-container">
<table class="admin-table">
<thead>
<tr>
<th>Place</th>
<th>Location</th>
<th>Status</th>
</tr>
</thead>
<tbody>
`;

recentPlaces.forEach((place) => {
html += `
<tr>
<td>
<div class="place-cell">
<img
src="${getPlaceImage(place)}"
alt="${escapeHtml(place.name)}"
>

<div>
<div class="place-name">
${escapeHtml(place.name)}
</div>
</div>
</div>
</td>

<td>
${escapeHtml(place.location || "Not provided")}
</td>

<td>
${getStatusBadge(place.status)}
</td>
</tr>
`;
});

html += `
</tbody>
</table>
</div>
`;

container.innerHTML = html;
}
async function loadPlaces() {
const table = document.getElementById("placesTable");

table.innerHTML = `
<tr>
<td colspan="5" class="loading">
Loading places...
</td>
</tr>
`;

try {
const places = await apiFetch("/admin/places");

displayPlaces(places);
} catch (error) {
table.innerHTML = `
<tr>
<td colspan="5" class="empty">
${escapeHtml(error.message)}
</td>
</tr>
`;
}
}


function displayPlaces(places) {
const table = document.getElementById("placesTable");

const search = document
.getElementById("placeSearch")
.value
.toLowerCase();

const status = document.getElementById("placeStatusFilter").value;

const filteredPlaces = places.filter((place) => {

const matchesSearch =
place.name.toLowerCase().includes(search) ||
(place.location || "").toLowerCase().includes(search);

const matchesStatus =
!status || place.status === status;

return matchesSearch && matchesStatus;
});


if (filteredPlaces.length === 0) {
table.innerHTML = `
<tr>
<td colspan="5" class="empty">
No places found.
</td>
</tr>
`;
return;
}


let html = "";

filteredPlaces.forEach((place) => {

const categoryName =
place.category?.name || "No category";

const verified = place.verification?.verified;

html += `
<tr>

<td>
<div class="place-cell">

<img
src="${getPlaceImage(place)}"
alt="${escapeHtml(place.name)}"
>

<div>
<div class="place-name">
${escapeHtml(place.name)}
</div>

<div class="place-location">
${escapeHtml(place.location || "")}
</div>
</div>

</div>
</td>

<td>
${escapeHtml(categoryName)}
</td>

<td>
${getStatusBadge(place.status)}
</td>

<td>
${
verified
? `<span class="verified">Verified</span>`
: `<span class="not-verified">Not verified</span>`
}
</td>

<td>

<div class="actions">

<button
class="btn-small btn-edit"
onclick="editPlace('${place._id}')">
Edit
</button>

<button
class="btn-small btn-delete"
onclick="confirmDeletePlace('${place._id}')">
Delete
</button>

</div>

</td>

</tr>
`;
});

table.innerHTML = html;
}


async function loadPlaceCategories() {
const select = document.getElementById("placeCategory");

try {
const categories = await apiFetch("/categories");

select.innerHTML = `
<option value="">
Select category
</option>
`;

categories.forEach((category) => {
select.innerHTML += `
<option value="${category._id}">
${escapeHtml(category.name)}
</option>
`;
});

} catch (error) {
console.error("Could not load categories:", error);
}
}

function setupPlaceForm() {
const form = document.getElementById("placeForm");

document
.getElementById("showPlaceFormBtn")
.addEventListener("click", () => {

clearPlaceForm();

document
.getElementById("placeFormContainer")
.classList.remove("hidden");
});


document
.getElementById("cancelPlaceBtn")
.addEventListener("click", () => {

clearPlaceForm();

document
.getElementById("placeFormContainer")
.classList.add("hidden");
});


form.addEventListener("submit", savePlace);
}


async function savePlace(event) {
event.preventDefault();

const placeId = document.getElementById("placeId").value;

const activities = document
.getElementById("placeActivities")
.value
.split(",")
.map((item) => item.trim())
.filter(Boolean);

const amenities = document
.getElementById("placeAmenities")
.value
.split(",")
.map((item) => item.trim())
.filter(Boolean);

const image = document
.getElementById("placeImage")
.value
.trim();


const placeData = {
name: document.getElementById("placeName").value.trim(),

description:
document.getElementById("placeDescription").value.trim(),

category:
document.getElementById("placeCategory").value,

location:
document.getElementById("placeLocation").value.trim(),

address:
document.getElementById("placeAddress").value.trim(),

openingHours:
document.getElementById("placeOpeningHours").value.trim(),

entryFee:
document.getElementById("placeEntryFee").value.trim(),

priceRange:
document.getElementById("placePriceRange").value,

activities,

amenities,

images: image ? [image] : [],

status:
document.getElementById("placeStatus").value
};


try {

if (placeId) {

await apiFetch(`/places/${placeId}`, {
method: "PUT",
body: JSON.stringify(placeData)
});

alert("Place updated successfully.");

} else {

await apiFetch("/places", {
method: "POST",
body: JSON.stringify(placeData)
});

alert("Place added successfully.");
}


clearPlaceForm();

document
.getElementById("placeFormContainer")
.classList.add("hidden");

await loadPlaces();
await loadDashboard();

} catch (error) {

alert(error.message || "Could not save place.");
}
}
async function editPlace(placeId) {

try {

const place = await apiFetch(`/admin/places/${placeId}`);

document.getElementById("placeId").value = place._id;
document.getElementById("placeName").value = place.name || "";
document.getElementById("placeDescription").value =
place.description || "";

document.getElementById("placeCategory").value =
place.category?._id || place.category || "";

document.getElementById("placeLocation").value =
place.location || "";

document.getElementById("placeAddress").value =
place.address || "";

document.getElementById("placeOpeningHours").value =
place.openingHours || "";

document.getElementById("placeEntryFee").value =
place.entryFee || "";

document.getElementById("placePriceRange").value =
place.priceRange || "$";

document.getElementById("placeStatus").value =
place.status || "draft";

document.getElementById("placeActivities").value =
(place.activities || []).join(", ");

document.getElementById("placeAmenities").value =
(place.amenities || []).join(", ");

document.getElementById("placeImage").value =
place.images?.[0] || "";


document
.getElementById("placeFormContainer")
.classList.remove("hidden");

window.scrollTo({
top: 0,
behavior: "smooth"
});

} catch (error) {

alert(error.message || "Could not load place.");
}
}

function confirmDeletePlace(placeId) {

openModal(
"Delete Place",
"Are you sure you want to delete this place?",
async () => {

try {

await apiFetch(`/places/${placeId}`, {
method: "DELETE"
});

alert("Place deleted successfully.");

await loadPlaces();
await loadDashboard();

} catch (error) {

alert(error.message || "Could not delete place.");
}
}
);
}
function clearPlaceForm() {

document.getElementById("placeForm").reset();
document.getElementById("placeId").value = "";

document.getElementById("placePriceRange").value = "$";
document.getElementById("placeStatus").value = "draft";
}
async function loadCategories() {

const table = document.getElementById("categoriesTable");

table.innerHTML = `
<tr>
<td colspan="4" class="loading">
Loading categories...
</td>
</tr>
`;


try {

const categories = await apiFetch("/admin/categories");

displayCategories(categories);

} catch (error) {

table.innerHTML = `
<tr>
<td colspan="4" class="empty">
${escapeHtml(error.message)}
</td>
</tr>
`;
}
}


function displayCategories(categories) {

const table = document.getElementById("categoriesTable");

if (!categories || categories.length === 0) {

table.innerHTML = `
<tr>
<td colspan="4" class="empty">
No categories found.
</td>
</tr>
`;

return;
}


let html = "";

categories.forEach((category) => {

html += `
<tr>

<td>
<strong>
${escapeHtml(category.name)}
</strong>
</td>

<td>
${escapeHtml(
category.description || "No description"
)}
</td>

<td>
${getStatusBadge(category.status)}
</td>

<td>

<div class="actions">

<button
class="btn-small btn-edit"
onclick="editCategory('${category._id}')">
Edit
</button>

<button
class="btn-small btn-delete"
onclick="confirmDeleteCategory('${category._id}')">
Delete
</button>

</div>

</td>

</tr>
`;
});

table.innerHTML = html;
}
function setupCategoryForm() {

document
.getElementById("categoryForm")
.addEventListener("submit", saveCategory);


document
.getElementById("cancelCategoryBtn")
.addEventListener("click", clearCategoryForm);
}


async function saveCategory(event) {

event.preventDefault();

const categoryId =
document.getElementById("categoryId").value;


const categoryData = {

name:
document.getElementById("categoryName").value.trim(),

description:
document
.getElementById("categoryDescription")
.value
.trim(),

image:
document
.getElementById("categoryImage")
.value
.trim(),

icon:
document
.getElementById("categoryIcon")
.value
.trim(),

status:
document.getElementById("categoryStatus").value
};


try {

if (categoryId) {

await apiFetch(`/categories/${categoryId}`, {
method: "PUT",
body: JSON.stringify(categoryData)
});

alert("Category updated successfully.");

} else {

await apiFetch("/categories", {
method: "POST",
body: JSON.stringify(categoryData)
});

alert("Category added successfully.");
}


clearCategoryForm();
await loadCategories();
await loadPlaceCategories();

} catch (error) {

alert(error.message || "Could not save category.");
}
}

async function editCategory(categoryId) {

try {

const categories =
await apiFetch("/admin/categories");

const category =
categories.find(
(item) => item._id === categoryId
);

if (!category) {
alert("Category not found.");
return;
}


document.getElementById("categoryId").value =
category._id;

document.getElementById("categoryName").value =
category.name || "";

document.getElementById("categoryDescription").value =
category.description || "";

document.getElementById("categoryImage").value =
category.image || "";

document.getElementById("categoryIcon").value =
category.icon || "";

document.getElementById("categoryStatus").value =
category.status || "active";


window.scrollTo({
top: 0,
behavior: "smooth"
});

} catch (error) {

alert(error.message || "Could not load category.");
}
}

function confirmDeleteCategory(categoryId) {

openModal(
"Delete Category",
"Are you sure you want to delete this category?",
async () => {

try {

await apiFetch(`/categories/${categoryId}`, {
method: "DELETE"
});

alert("Category deleted successfully.");

await loadCategories();
await loadPlaceCategories();

} catch (error) {

alert(
error.message ||
"Could not delete category."
);
}
}
);
}

function clearCategoryForm() {

document.getElementById("categoryForm").reset();

document.getElementById("categoryId").value = "";

document.getElementById("categoryStatus").value =
"active";
}
async function loadReviews() {

const table = document.getElementById("reviewsTable");

table.innerHTML = `
<tr>
<td colspan="6" class="loading">
Loading reviews...
</td>
</tr>
`;


try {

const reviews =
await apiFetch("/admin/reviews");

displayReviews(reviews);

} catch (error) {

table.innerHTML = `
<tr>
<td colspan="6" class="empty">
${escapeHtml(error.message)}
</td>
</tr>
`;
}
}


function displayReviews(reviews) {

const table =
document.getElementById("reviewsTable");

const selectedStatus =
document.getElementById("reviewStatusFilter").value;


const filteredReviews =
reviews.filter((review) => {

if (!selectedStatus) {
return true;
}

return review.status === selectedStatus;
});


if (filteredReviews.length === 0) {

table.innerHTML = `
<tr>
<td colspan="6" class="empty">
No reviews found.
</td>
</tr>
`;

return;
}


let html = "";


filteredReviews.forEach((review) => {

const userName =
review.user?.name || "Unknown user";

const placeName =
review.place?.name || "Unknown place";


html += `
<tr>

<td>
${escapeHtml(userName)}
</td>

<td>
${escapeHtml(placeName)}
</td>

<td>
${"★".repeat(review.rating || 0)}
</td>

<td>
${escapeHtml(review.comment || "")}
</td>

<td>
${getStatusBadge(review.status)}
</td>

<td>

<div class="actions">

${
review.status !== "approved"
? `
<button
class="btn-small btn-approve"
onclick="updateReviewStatus(
'${review._id}',
'approved'
)">
Approve
</button>
`
: ""
}

${
review.status !== "rejected"
? `
<button
class="btn-small btn-reject"
onclick="updateReviewStatus(
'${review._id}',
'rejected'
)">
Reject
</button>
`
: ""
}

<button
class="btn-small btn-delete"
onclick="confirmDeleteReview(
'${review._id}'
)">
Delete
</button>

</div>

</td>

</tr>
`;
});


table.innerHTML = html;
}
async function updateReviewStatus(reviewId, status) {

try {

await apiFetch(`/reviews/${reviewId}`, {

method: "PUT",

body: JSON.stringify({
status: status
})

});

alert(`Review ${status}.`);

await loadReviews();

} catch (error) {

alert(
error.message ||
"Could not update review."
);
}
}


function confirmDeleteReview(reviewId) {

openModal(
"Delete Review",
"Are you sure you want to delete this review?",
async () => {

try {

await apiFetch(`/reviews/${reviewId}`, {
method: "DELETE"
});

alert("Review deleted successfully.");

await loadReviews();

} catch (error) {

alert(
error.message ||
"Could not delete review."
);
}
}
);
}

async function loadUsers() {

const table =
document.getElementById("usersTable");


table.innerHTML = `
<tr>
<td colspan="5" class="loading">
Loading users...
</td>
</tr>
`;


try {

const users =
await apiFetch("/admin/users");

displayUsers(users);

} catch (error) {

table.innerHTML = `
<tr>
<td colspan="5" class="empty">
${escapeHtml(error.message)}
</td>
</tr>
`;
}
}


function displayUsers(users) {

const table =
document.getElementById("usersTable");


if (!users || users.length === 0) {

table.innerHTML = `
<tr>
<td colspan="5" class="empty">
No users found.
</td>
</tr>
`;

return;
}


let html = "";


users.forEach((user) => {

const joined =
user.createdAt
? new Date(user.createdAt)
.toLocaleDateString()
: "Unknown";


html += `
<tr>

<td>
${escapeHtml(user.name)}
</td>

<td>
${escapeHtml(user.email)}
</td>

<td>
${escapeHtml(user.role)}
</td>

<td>
${joined}
</td>

<td>

<div class="actions">

${
user.role === "admin"
? `
<button
class="btn-small btn-view"
onclick="changeUserRole(
'${user._id}',
'user'
)">
Make User
</button>
`
: `
<button
class="btn-small btn-edit"
onclick="changeUserRole(
'${user._id}',
'admin'
)">
Make Admin
</button>
`
}

</div>

</td>

</tr>
`;
});


table.innerHTML = html;
}
async function changeUserRole(userId, role) {

const message =
role === "admin"
? "Make this user an administrator?"
: "Remove administrator access from this user?";


openModal(
"Change User Role",
message,
async () => {

try {

await apiFetch(
`/admin/users/${userId}/role`,
{
method: "PATCH",

body: JSON.stringify({
role: role
})
}
);


alert("User role updated.");

await loadUsers();

} catch (error) {

alert(
error.message ||
"Could not update user role."
);
}
}
);
}
function setupFilters() {

document
.getElementById("placeSearch")
.addEventListener("input", async () => {

const places =
await apiFetch("/admin/places");

displayPlaces(places);
});


document
.getElementById("placeStatusFilter")
.addEventListener("change", async () => {

const places =
await apiFetch("/admin/places");

displayPlaces(places);
});


document
.getElementById("reviewStatusFilter")
.addEventListener("change", async () => {

await loadReviews();
});
}

let modalAction = null;


function setupModal() {

document
.getElementById("cancelModalBtn")
.addEventListener("click", closeModal);


document
.getElementById("confirmModalBtn")
.addEventListener("click", async () => {

if (modalAction) {
await modalAction();
}

closeModal();
});
}


function openModal(title, message, action) {

document.getElementById("modalTitle").textContent =
title;

document.getElementById("modalMessage").textContent =
message;

modalAction = action;

document
.getElementById("confirmModal")
.classList.add("show");
}


function closeModal() {

document
.getElementById("confirmModal")
.classList.remove("show");

modalAction = null;
}

function getStatusBadge(status) {

if (!status) {
return "";
}

return `
<span class="status status-${status}">
${escapeHtml(status)}
</span>
`;
}
function getPlaceImage(place) {

if (place.images && place.images.length > 0) {
return place.images[0];
}

return "assets/images/places/default.jpg";
}

function escapeHtml(value) {

if (value === null || value === undefined) {
return "";
}

return String(value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}







