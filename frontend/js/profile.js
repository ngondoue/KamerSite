/* PROFILE PAGE */

document.addEventListener("DOMContentLoaded", () => {

    if (!isLoggedIn()) {
        window.location.href = "auth.html";
        return;
    }

    loadProfile();
    setupProfileForm();
    setupLogoutButton();
    loadFavorites();

});


/* PROFILE SUMMARY + EDIT FORM */

async function loadProfile() {

    try {

        const { user } = await apiFetch("/auth/profile");

        renderProfileSummary(user);

        document.getElementById("profile-name-input").value =
            user.name || "";

        document.getElementById("profile-image-input").value =
            user.profileImage || "";

    } catch (error) {

        console.log(error);

        alert(error.message || "Could not load your profile.");

    }

}


function renderProfileSummary(user) {

    const initial = (user.name || "?").trim().charAt(0).toUpperCase();

    document.getElementById("profile-avatar").textContent =
        initial || "?";

    document.getElementById("profile-name").textContent =
        user.name || "Unnamed user";

    document.getElementById("profile-email").textContent =
        user.email || "";

    const roleTag = document.getElementById("profile-role-tag");

    roleTag.textContent =
        user.role === "admin" ? "Administrator" : "Member";

    const joined = document.getElementById("profile-joined");

    joined.textContent = user.createdAt
        ? `Joined ${new Date(user.createdAt).toLocaleDateString()}`
        : "";

}


function setupProfileForm() {

    const form = document.getElementById("profile-form");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const error = document.getElementById("profile-form-error");
        const success = document.getElementById("profile-form-success");

        error.hidden = true;
        success.hidden = true;

        const name = document
            .getElementById("profile-name-input")
            .value
            .trim();

        const profileImage = document
            .getElementById("profile-image-input")
            .value
            .trim();

        if (!name) {
            error.textContent = "Please enter your name.";
            error.hidden = false;
            return;
        }

        try {

            const result = await apiFetch("/auth/profile", {
                method: "PUT",
                body: JSON.stringify({ name, profileImage })
            });

            const currentUser = getCurrentUser();
            const token = getToken();

            if (currentUser && token) {
                saveSession(
                    { ...currentUser, name: result.user.name },
                    token
                );
            }

            renderProfileSummary(result.user);

            success.hidden = false;

            // Header shows the user's name -- refresh it so it stays in sync.
            loadHeader();

        } catch (err) {

            error.textContent =
                err.message || "Could not update your profile.";

            error.hidden = false;

        }

    });

}


function setupLogoutButton() {

    const button = document.getElementById("profile-logout-btn");

    if (!button) return;

    button.addEventListener("click", () => {
        logout();
    });

}


/* FAVORITES */

async function loadFavorites() {

    const container = document.getElementById("favorites-list");

    if (!container) return;

    try {

        const favorites = await apiFetch("/favorites");

        renderFavorites(favorites);

    } catch (error) {

        container.innerHTML = `
            <div class="message">
                Could not load your favorites.
            </div>
        `;

    }

}


function renderFavorites(favorites) {

    const container = document.getElementById("favorites-list");

    const validFavorites = (favorites || []).filter((favorite) => favorite.place);

    if (validFavorites.length === 0) {

        container.innerHTML = `
            <div class="empty-favorites">
                <p>You haven't saved any places yet.</p>
                <a href="explore.html" class="btn btn-primary">
                    Explore places
                </a>
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="favorites-grid">
            ${validFavorites.map(renderFavoriteCard).join("")}
        </div>
    `;

    container.querySelectorAll(".favorite-remove").forEach((button) => {

        button.addEventListener("click", async (event) => {

            event.preventDefault();

            const placeId = button.dataset.placeId;

            button.disabled = true;

            try {

                await apiFetch(`/favorites/${placeId}`, {
                    method: "DELETE"
                });

                await loadFavorites();

            } catch (error) {

                alert(error.message || "Could not remove favorite.");
                button.disabled = false;

            }

        });

    });

}


function renderFavoriteCard(favorite) {

    const place = favorite.place;

    const image =
        place.images && place.images.length > 0
            ? place.images[0]
            : "https://via.placeholder.com/600x400?text=KamerSite";

    const category = place.category?.name || "Place";

    const priceLabel = place.entryFee && !place.entryFee.toLowerCase().startsWith("free")
        ? `From ${place.entryFee}`
        : "Free";

    const rating = place.rating ? Number(place.rating).toFixed(1) : "New";

    return `
        <div class="favorite-card">

            <a href="place.html?id=${place._id}" class="favorite-card-image-link">
                <img
                    src="${image}"
                    alt="${escapeHtml(place.name)}"
                    class="favorite-image">
            </a>

            <div class="favorite-info">

                <span class="favorite-category">
                    ${escapeHtml(category)}
                </span>

                <a href="place.html?id=${place._id}">
                    ${escapeHtml(place.name)}
                </a>

                <span class="favorite-location">
                    <i class="bx bxs-map-pin"></i> ${escapeHtml(place.location || "")}
                </span>

                <div class="favorite-meta">
                    <span class="favorite-price">${escapeHtml(priceLabel)}</span>
                    <span class="favorite-rating"><i class="bx bxs-star"></i> ${rating}</span>
                </div>

            </div>

            <button
                class="favorite-remove"
                data-place-id="${place._id}"
                title="Remove from favorites">
                <i class="bx bx-x"></i>
            </button>

        </div>
    `;

}
