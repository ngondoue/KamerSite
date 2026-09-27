let categories = [];


async function loadCategories() {

    try {

        categories = await getCategories();

        const select =
            document.getElementById("filter-category");

        const pills =
            document.getElementById("explore-category-pills");

        const list =
            document.getElementById("category-browse-list");


        categories.forEach(category => {

            select.innerHTML += `
                <option value="${category.slug}">
                    ${escapeHtml(category.name)}
                </option>
            `;

        });


        pills.innerHTML = categories.map(category => {

            return `
                <a
                    href="explore.html?category=${encodeURIComponent(category.slug)}"
                    class="category-pill">

                    ${escapeHtml(category.name)}

                </a>
            `;

        }).join("");


        list.innerHTML = categories.map(category => {

            return `
                <a
                    href="explore.html?category=${encodeURIComponent(category.slug)}"
                    class="category-card">

                    <h3>
                        ${escapeHtml(category.name)}
                    </h3>

                    <p>
                        ${escapeHtml(category.description || "")}
                    </p>

                </a>
            `;

        }).join("");

    } catch (error) {

        console.log(error);

    }
}


async function loadPlaces() {

    const grid =
        document.getElementById("explore-results-grid");

    grid.innerHTML =
        "<p class='message'>Loading places...</p>";


    const params =
        new URLSearchParams();


    const search =
        document
            .getElementById("explore-search-input")
            .value
            .trim();

    const category =
        document.getElementById("filter-category").value;

    const rating =
        document.getElementById("filter-rating").value;

    const price =
        document.getElementById("filter-price").value;


    if (search) {
        params.set("search", search);
    }

    if (category) {
        params.set("category", category);
    }

    if (rating) {
        params.set("rating", rating);
    }

    if (price) {
        params.set("price", price);
    }


    try {

        const places =
            await apiFetch(
                "/places?" + params.toString()
            );

        document.getElementById(
            "explore-results-heading"
        ).textContent =
            `${places.length} Places`;

        renderPlaceCards(
            "explore-results-grid",
            places
        );

    } catch (error) {

        grid.innerHTML =
            "<p class='message'>Could not load places.</p>";

    }
}


function loadSearchFromUrl() {

    const params =
        new URLSearchParams(window.location.search);


    const search =
        params.get("search");

    const category =
        params.get("category");


    if (search) {

        document.getElementById(
            "explore-search-input"
        ).value = search;

    }


    if (category) {

        document.getElementById(
            "filter-category"
        ).value = category;

    }
}


document
    .getElementById("explore-search-form")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        loadPlaces();

    });


document
    .getElementById("filter-category")
    .addEventListener("change", loadPlaces);

document
    .getElementById("filter-rating")
    .addEventListener("change", loadPlaces);

document
    .getElementById("filter-price")
    .addEventListener("change", loadPlaces);


async function startExplorePage() {

    await loadCategories();

    loadSearchFromUrl();

    loadPlaces();

}


startExplorePage();