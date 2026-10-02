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
    restaurants: '<i class="bx bx-restaurant"></i>',
    "cafés": '<i class="bx bx-coffee"></i>',
    cafes: '<i class="bx bx-coffee"></i>',
    nature: '<i class="bx bx-leaf"></i>',
    entertainment: '<i class="bx bx-film"></i>',
    shopping: '<i class="bx bx-shopping-bag"></i>',
    accommodation: '<i class="bx bx-hotel"></i>'
};

// Upper bound for the price-range slider, in FCFA. Real entryFee values
// seen so far top out well under this; if a place is ever priced higher,
// it just pins to the top of the range instead of breaking anything.
const PRICE_SLIDER_MAX = 10000;
const PRICE_SLIDER_STEP = 500;

let allCategories = [];
let currentPlaces = [];
let activeCategoryId = "";
let currentPage = 1;
let priceMin = 0;
let priceMax = PRICE_SLIDER_MAX;


document.addEventListener("DOMContentLoaded", async () => {

    setupExploreSearch();
    setupFilterControls();
    setupPriceRangeSlider();
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
            // category.icon (if set in the DB) is stored as a bare Font
            // Awesome class string, e.g. "bx bx-restaurant", so it
            // needs wrapping in an <i> tag -- CATEGORY_ICONS values are
            // already full tags.
            icon: CATEGORY_ICONS[category.slug]
                || (category.icon ? `<i class="${escapeHtml(category.icon)}"></i>` : "")
                || '<i class="bx bxs-map-pin"></i>'
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
        document.getElementById("filter-location").value = "";

        document.querySelectorAll(".feature-checkbox").forEach((checkbox) => {
            checkbox.checked = false;
        });

        priceMin = 0;
        priceMax = PRICE_SLIDER_MAX;
        document.getElementById("price-range-min").value = priceMin;
        document.getElementById("price-range-max").value = priceMax;
        updatePriceRangeDisplay();

        activeCategoryId = "";
        syncActivePill();

        currentPage = 1;

        await loadPlaces();

    });

}


/* PRICE RANGE SLIDER
   Two overlapping <input type="range"> elements, styled in explore.css
   to look like one horizontal bar with two handles. Filtering happens
   client-side against each place's real entryFee amount (parsed by the
   shared entryFeeValue() helper in main.js) -- there's no fake "$/$$/$$$"
   tier involved anywhere in this. */

function setupPriceRangeSlider() {

    const minInput = document.getElementById("price-range-min");
    const maxInput = document.getElementById("price-range-max");

    if (!minInput || !maxInput) return;

    minInput.min = 0;
    minInput.max = PRICE_SLIDER_MAX;
    minInput.step = PRICE_SLIDER_STEP;
    maxInput.min = 0;
    maxInput.max = PRICE_SLIDER_MAX;
    maxInput.step = PRICE_SLIDER_STEP;

    minInput.value = priceMin;
    maxInput.value = priceMax;

    const onChange = () => {

        priceMin = Number(minInput.value);
        priceMax = Number(maxInput.value);

        // Keep the two handles from crossing over each other.
        if (priceMin > priceMax) {
            [priceMin, priceMax] = [priceMax, priceMin];
            minInput.value = priceMin;
            maxInput.value = priceMax;
        }

        updatePriceRangeDisplay();

    };

    minInput.addEventListener("input", onChange);
    maxInput.addEventListener("input", onChange);

    updatePriceRangeDisplay();

}


function updatePriceRangeDisplay() {

    const fill = document.getElementById("price-range-fill");
    const minLabel = document.getElementById("price-range-min-label");
    const maxLabel = document.getElementById("price-range-max-label");

    const minPercent = (priceMin / PRICE_SLIDER_MAX) * 100;
    const maxPercent = (priceMax / PRICE_SLIDER_MAX) * 100;

    if (fill) {
        fill.style.left = `${minPercent}%`;
        fill.style.width = `${maxPercent - minPercent}%`;
    }

    if (minLabel) {
        minLabel.textContent = formatFcfa(priceMin);
    }

    if (maxLabel) {
        maxLabel.textContent = priceMax >= PRICE_SLIDER_MAX
            ? `${formatFcfa(priceMax)}+`
            : formatFcfa(priceMax);
    }

}


function formatFcfa(amount) {
    return `${amount.toLocaleString()} FCFA`;
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

    const query = new URLSearchParams();

    if (search) query.set("search", search);
    if (activeCategoryId) query.set("category", activeCategoryId);
    // Price is a free-text entryFee string ("2,000 FCFA"), not the old
    // "$/$$/$$$" tier -- the backend can't filter on it, so the price
    // range slider is applied client-side in applyClientFilters() below.

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

        // When the top handle is pushed all the way to the end of the
        // slider, treat it as "no upper limit" rather than excluding
        // anything priced above PRICE_SLIDER_MAX.
        const amount = entryFeeValue(place.entryFee);
        const effectiveMax = priceMax >= PRICE_SLIDER_MAX ? Infinity : priceMax;

        if (amount < priceMin || amount > effectiveMax) {
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
