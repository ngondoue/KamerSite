const API_URL = "api/";


/* Session helpers -- shared by every page that loads main.js */

function getToken() {
    return localStorage.getItem("kamersite_token");
}

function getCurrentUser() {
    const raw = localStorage.getItem("kamersite_user");
    return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
    return Boolean(getToken());
}

function saveSession(user, token) {
    localStorage.setItem("kamersite_token", token);
    localStorage.setItem("kamersite_user", JSON.stringify(user));
}

function logout() {
    localStorage.removeItem("kamersite_token");
    localStorage.removeItem("kamersite_user");
    window.location.href = "auth.html";
}


async function apiFetch(endpoint, options = {}) {

    const headers = { ...(options.headers || {}) };

    // fetch() does NOT set this automatically for a string body -- without
    // it, express.json() on the backend never parses the body, and every
    // POST/PUT would silently arrive as an empty object.
    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();

    if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + endpoint, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}



function loadHeader() {

    const header = document.getElementById("site-header");

    if (!header) return;

    const user = getCurrentUser();

    const accountLinks = isLoggedIn()
        ? `
            <a href="profile.html">
                ${escapeHtml(user?.name || "Profile")}
            </a>

            ${user?.role === "admin" ? `<a href="admin.html">Admin</a>` : ""}

            <a href="#" id="nav-logout-link">
                Logout
            </a>
        `
        : `
            <a href="auth.html">
                Login
            </a>
        `;

    header.innerHTML = `
        <header class="site-header">

            <div class="container navbar">

                <a href="index.html" class="brand">
                    <i class="bx bxs-map-pin"></i> KamerSite
                </a>

                <nav class="nav-links" id="nav-links">

                    <a href="index.html">
                        Home
                    </a>

                    <a href="explore.html">
                        Explore
                    </a>

                    ${accountLinks}

                </nav>

                <button
                    class="nav-toggle"
                    id="nav-toggle">

                    <i class="bx bx-menu"></i>

                </button>

            </div>

        </header>
    `;

    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");

    if (toggle) {

        toggle.addEventListener("click", () => {
            links.classList.toggle("open");
        });

    }

    const logoutLink = document.getElementById("nav-logout-link");

    if (logoutLink) {

        logoutLink.addEventListener("click", (event) => {
            event.preventDefault();
            logout();
        });

    }
}


/* Footer */

function loadFooter() {

    const footer = document.getElementById("site-footer");

    if (!footer) return;

    footer.innerHTML = `
        <footer class="site-footer">

            <div class="container footer-inner">

                <div>
                    <strong><i class="bx bxs-map-pin"></i> KamerSite</strong>

                    <p>
                        Discover amazing places around Yaoundé.
                    </p>
                </div>

                <div class="footer-links">

                    <a href="index.html">
                        Home
                    </a>

                    <a href="explore.html">
                        Explore
                    </a>

                </div>

            </div>

        </footer>
    `;
}


/* Categories */

async function getCategories() {

    return await apiFetch("/categories");
}



function renderPlaceCards(elementId, places) {

    const container = document.getElementById(elementId);

    if (!container) return;

    if (!places || places.length === 0) {

        container.innerHTML = `
            <div class="message">
                No places found.
            </div>
        `;

        return;
    }

    container.innerHTML = places.map(place => {

        const image =
            place.images && place.images.length > 0
                ? place.images[0]
                : "https://via.placeholder.com/600x400?text=KamerSite";

        const category =
            place.category?.name || "Place";

        const priceLabel = formatEntryFee(place.entryFee);

        const rating = place.rating
            ? Number(place.rating).toFixed(1)
            : "New";

        const reviewCount = place.reviewCount || 0;

        return `
            <a
                href="place.html?id=${place._id}"
                class="place-card">

                <div class="place-card-image-wrap">

                    <img
                        src="${image}"
                        alt="${escapeHtml(place.name)}"
                        class="place-card-image">

                    <span class="place-card-category-tag">
                        ${escapeHtml(category)}
                    </span>

                    <span class="place-card-favorite" aria-hidden="true">
                        <i class="bx bx-heart"></i>
                    </span>

                </div>

                <div class="place-card-body">

                    <h3>
                        ${escapeHtml(place.name)}
                    </h3>

                    <p>
                        <i class="bx bxs-map-pin"></i> ${escapeHtml(place.location)}
                    </p>

                    <div class="place-card-footer">

                        <span class="place-card-price">
                            ${escapeHtml(priceLabel)}
                        </span>

                        <span class="place-card-rating">
                            <i class="bx bxs-star"></i> ${rating}
                            ${reviewCount ? `(${reviewCount})` : ""}
                        </span>

                    </div>

                </div>

            </a>
        `;

    }).join("");
}


/* Turns the free-text entryFee field ("2,000 FCFA", "Free", "") into a
   short display label like "From 2,000 FCFA" or "Free". */
function formatEntryFee(entryFee) {

    const value = (entryFee || "").trim();

    if (!value || value.toLowerCase().startsWith("free")) {
        return "Free";
    }

    return `From ${value}`;
}


/* Pulls a rough numeric amount out of a free-text entryFee string
   ("2,000 FCFA" -> 2000, "Free" or "" -> 0), so places can be sorted or
   filtered by real price -- shared by home.js (budget-friendly picks)
   and explore.js (the price-range slider). */
function entryFeeValue(entryFee) {

    if (!entryFee) return 0;

    if (entryFee.toLowerCase().startsWith("free")) return 0;

    const match = entryFee.replace(/,/g, "").match(/\d+/);

    return match ? Number(match[0]) : 0;
}




function escapeHtml(value) {

    if (!value) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


loadHeader();
loadFooter();