/* EXPLORE PAGE */

const RESULTS_PER_PAGE = 8;

// Loose keyword matches for the "Features" checkboxes against a place's
// amenities array (best-effort -- amenities is free text, not a schema
// field per feature, so this is a simple case-insensitive contains check).
const FEATURE_KEYWORDS = {
    wifi: ["wifi", "wi-fi"],
    parking: ["parking"],
    outdoor: ["outdoor"],
    family: ["family"],
    pet: ["pet"]
};

const CATEGORY_ICONS = {
    restaurants: "🍴",
    "cafés": "☕",
    cafes: "☕",
    nature: "🌳",
    entertainment: "🎬",
    shopping: "🛍️",
    accommodation: "🏨"
};

let allCategories = [];
let currentPlaces = [];
let activeCategoryId = "";
let currentPage = 1;


document.addEventListener("DOMContentLoaded", async () => {

    setupExploreSearch();
    setupFilterControls();
    setupSmartDiscovery();

    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search") || "";
    const initialCategorySlug = params.get("category") || "";

    document.getElementById("explore-search-input").value = initialSearch;

    await loadCategories(initialCategorySlug);

    await loadPlaces();

});


/* SEARCH */

function setupExploreSearch() {

    const form = document.getElementById("explore-search-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        currentPage = 1;
        await loadPlaces();
    });

}


function setupSmartDiscovery() {

    const button = document.getElementById("smart-discovery-btn");

    if (!button) return;

    button.addEventListener("click", () => {

        const input = document.getElementById("explore-search-input");

        window.scrollTo({ top: 0, behavior: "smooth" });

        if (input) input.focus();

    });

}


/* CATEGORIES + PILLS */

async function loadCategories(initialCategorySlug) {

    try {

        allCategories = await getCategories();

        renderCategoryPills(initialCategorySlug);
        renderCategorySelect();

        if (initialCategorySlug) {

            const matched = allCategories.find(
                (category) => category.slug === initialCategorySlug
                    || category._id === initialCategorySlug
            );

            if (matched) {
                activeCategoryId = matched._id;
            }

        }

    } catch (error) {

        console.log(error);

    }

}


function renderCategoryPills(initialCategorySlug) {

    const container = document.getElementById("explore-category-pills");

    const pills = [
        { id: "", label: "All places", icon: "" },
        ...allCategories.map((category) => ({
            id: category._id,
            label: category.name,
            icon: category.icon || CATEGORY_ICONS[category.slug] || "📍"
        }))
    ];

    container.innerHTML = pills.map((pill) => {

        const isActive =
            pill.id === "" && !initialCategorySlug;

        return `
            <button
                type="button"
                class="category-pill${isActive ? " active" : ""}"
                data-category-id="${pill.id}">
                ${pill.icon ? `${pill.icon} ` : ""}${escapeHtml(pill.label)}
            </button>
        `;

    }).join("");

    container.querySelectorAll(".category-pill").forEach((button) => {

        button.addEventListener("click", async () => {

            container.querySelectorAll(".category-pill").forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            activeCategoryId = button.dataset.categoryId;

            document.getElementById("filter-category").value = activeCategoryId;

            currentPage = 1;

            await loadPlaces();

        });

    });

}


function renderCategorySelect() {

    const select = document.getElementById("filter-category");

    select.innerHTML = `<option value="">All categories</option>`;

    allCategories.forEach((category) => {
        select.innerHTML += `
            <option value="${category._id}">
                ${escapeHtml(category.name)}
            </option>
        `;
    });

}


/* FILTER CONTROLS */

function setupFilterControls() {

    document.getElementById("apply-filters").addEventListener("click", async () => {
        activeCategoryId = document.getElementById("filter-category").value;
        syncActivePill();
        currentPage = 1;
        await loadPlaces();
    });

    document.getElementById("filter-reset").addEventListener("click", async () => {

        document.getElementById("explore-search-input").value = "";
        document.getElementById("filter-category").value = "";
        document.getElementById("filter-price").value = "";
        document.getElementById("filter-location").value = "";

        document.querySelectorAll(".feature-checkbox").forEach((checkbox) => {
            checkbox.checked = false;
        });

        activeCategoryId = "";
        syncActivePill();

        currentPage = 1;

        await loadPlaces();

    });

}


function syncActivePill() {

    document.querySelectorAll(".category-pill").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.categoryId === activeCategoryId
        );
    });

}


/* LOAD + FILTER + RENDER */

async function loadPlaces() {

    const grid = document.getElementById("explore-results-grid");

    grid.innerHTML = `<div class="message">Loading places...</div>`;

    const search = document.getElementById("explore-search-input").value.trim();
    const price = document.getElementById("filter-price").value;

    const query = new URLSearchParams();

    if (search) query.set("search", search);
    if (activeCategoryId) query.set("category", activeCategoryId);
    if (price) query.set("price", price);

    try {

        const places = await apiFetch(`/places?${query.toString()}`);

        currentPlaces = places;

        populateLocationFilter(places);

        const filtered = applyClientFilters(places);

        renderResultsPage(filtered);

    } catch (error) {

        console.log(error);

        grid.innerHTML = `<div class="message">Could not load places.</div>`;

    }

}


function populateLocationFilter(places) {

    const select = document.getElementById("filter-location");
    const previousValue = select.value;

    const locations = [...new Set(
        places.map((place) => place.location).filter(Boolean)
    )].sort();

    select.innerHTML = `<option value="">All locations</option>`;

    locations.forEach((location) => {
        select.innerHTML += `
            <option value="${escapeHtml(location)}">
                ${escapeHtml(location)}
            </option>
        `;
    });

    if (locations.includes(previousValue)) {
        select.value = previousValue;
    }

}


function applyClientFilters(places) {

    const location = document.getElementById("filter-location").value;

    const activeFeatures = [...document.querySelectorAll(".feature-checkbox:checked")]
        .map((checkbox) => checkbox.value);

    return places.filter((place) => {

        if (location && place.location !== location) {
            return false;
        }

        if (activeFeatures.length > 0) {

            const amenitiesText = (place.amenities || [])
                .join(" ")
                .toLowerCase();

            const matchesAllFeatures = activeFeatures.every((feature) => {
                const keywords = FEATURE_KEYWORDS[feature] || [feature];
                return keywords.some((keyword) => amenitiesText.includes(keyword));
            });

            if (!matchesAllFeatures) return false;
        }

        return true;

    });

}


function renderResultsPage(filteredPlaces) {

    const totalResults = filteredPlaces.length;

    document.getElementById("explore-results-count").textContent =
        `${totalResults} place${totalResults === 1 ? "" : "s"}`;

    const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    const pageItems = filteredPlaces.slice(start, start + RESULTS_PER_PAGE);

    renderPlaceCards("explore-results-grid", pageItems);

    renderPagination(totalPages);

}


function renderPagination(totalPages) {

    const container = document.getElementById("explore-pagination");

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `
        <button
            type="button"
            class="page-btn"
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? "disabled" : ""}>
            ‹
        </button>
    `;

    for (let page = 1; page <= totalPages; page++) {
        html += `
            <button
                type="button"
                class="page-btn${page === currentPage ? " active" : ""}"
                data-page="${page}">
                ${page}
            </button>
        `;
    }

    html += `
        <button
            type="button"
            class="page-btn"
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? "disabled" : ""}>
            ›
        </button>
    `;

    container.innerHTML = html;

    container.querySelectorAll(".page-btn").forEach((button) => {

        button.addEventListener("click", () => {

            const page = Number(button.dataset.page);

            if (!page || page < 1 || page > totalPages) return;

            currentPage = page;

            renderResultsPage(applyClientFilters(currentPlaces));

            window.scrollTo({
                top: document.getElementById("explore-results-grid").offsetTop - 100,
                behavior: "smooth"
            });

        });

    });

}
