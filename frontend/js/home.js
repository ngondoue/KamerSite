async function loadHomeCategories() {

    const container =
        document.getElementById("hero-category-pills");

    try {

        const categories = await getCategories();

        container.innerHTML = categories.map(category => {

            return `
                <a
                    href="explore.html?category=${encodeURIComponent(category.slug)}"
                    class="category-pill">

                    ${escapeHtml(category.name)}

                </a>
            `;

        }).join("");

    } catch (error) {

        container.innerHTML = "";

    }
}


async function loadPopularPlaces() {

    const container =
        document.getElementById("popular-places-grid");

    container.innerHTML =
        "<p class='message'>Loading places...</p>";

    try {

        const places =
            await apiFetch("/places?rating=4");

        renderPlaceCards(
            "popular-places-grid",
            places.slice(0, 4)
        );

    } catch (error) {

        container.innerHTML =
            "<p class='message'>Could not load places.</p>";

    }
}


document
    .getElementById("home-search-form")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const query =
            document
                .getElementById("home-search-input")
                .value
                .trim();

        if (query) {

            window.location.href =
                "explore.html?search=" +
                encodeURIComponent(query);

        } else {

            window.location.href = "explore.html";

        }

    });


loadHomeCategories();
loadPopularPlaces();