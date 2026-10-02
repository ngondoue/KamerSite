/* HOME PAGE */

document.addEventListener("DOMContentLoaded", () => {

    setupHomeSearch();
    loadFeaturedPlaces();
    loadBudgetPicks();

});


function setupHomeSearch() {

    const form = document.getElementById("home-search-form");

    if (!form) return;

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const query = document
            .getElementById("home-search-input")
            .value
            .trim();

        const destination = query
            ? `explore.html?search=${encodeURIComponent(query)}`
            : "explore.html";

        window.location.href = destination;

    });

}


async function loadFeaturedPlaces() {

    try {

        const places = await apiFetch("/places");

        // "Featured" = highest rated places first.
        const featured = [...places]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6);

        renderPlaceCards("featured-places-grid", featured);

    } catch (error) {

        console.log(error);

        const container = document.getElementById("featured-places-grid");

        if (container) {
            container.innerHTML = `
                <div class="message">Could not load places.</div>
            `;
        }

    }

}


async function loadBudgetPicks() {

    try {

        const places = await apiFetch("/places");

        const budgetFriendly = [...places]
            .sort((a, b) => entryFeeValue(a.entryFee) - entryFeeValue(b.entryFee))
            .slice(0, 4);

        renderPlaceCards("budget-picks-grid", budgetFriendly);

    } catch (error) {

        console.log(error);

        const container = document.getElementById("budget-picks-grid");

        if (container) {
            container.innerHTML = `
                <div class="message">Could not load places.</div>
            `;
        }

    }

}


// entryFeeValue() now lives in main.js (loaded before this file on every
// page) so the explore page's price-range filter can share it too.
