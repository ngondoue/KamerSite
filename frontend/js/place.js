let currentPlace = null;
let currentImage = 0;


async function loadPlace() {

    const params =
        new URLSearchParams(window.location.search);

    const id = params.get("id");


    if (!id) {

        showError("Place not found.");
        return;

    }


    try {

        currentPlace =
            await apiFetch("/places/" + id);

        displayPlace(currentPlace);

        loadNearbyPlaces(id);

    } catch (error) {

        console.log(error);

        showError("Could not load this place.");

    }
}


function displayPlace(place) {

    document.getElementById(
        "place-name"
    ).textContent = place.name;

    document.getElementById(
        "place-title"
    ).textContent = place.name;

    document.getElementById(
        "place-location"
    ).textContent = place.location;

    document.getElementById(
        "place-description"
    ).textContent = place.description;

    document.getElementById(
        "place-about"
    ).textContent = place.description;

    document.getElementById(
        "place-address"
    ).textContent =
        place.address || place.location;

    document.getElementById(
        "place-hours"
    ).textContent =
        place.openingHours || "Not provided";

    document.getElementById(
        "place-fee"
    ).textContent =
        place.entryFee || "Free";

    document.getElementById(
        "place-price"
    ).textContent =
        place.priceRange || "-";

    document.getElementById(
        "place-rating"
    ).textContent =
        `${place.rating || 0} (${place.reviewCount || 0} reviews)`;


    renderActivities(place.activities);

    renderAmenities(place.amenities);

    renderGallery(place.images);

    setupDirections(place);

    setupShare();

    setupFavoriteButton(place);

    loadReviews(place._id);

    setupReviewForm(place._id);

}


/* FAVORITES */

async function setupFavoriteButton(place) {

    const button = document.getElementById("favorite-button");

    if (!button) return;

    let isFavorited = false;

    if (isLoggedIn()) {

        try {

            const favorites = await apiFetch("/favorites");

            isFavorited = favorites.some(
                (favorite) => favorite.place && favorite.place._id === place._id
            );

        } catch (error) {

            console.log(error);

        }

    }

    updateFavoriteButton(button, isFavorited);

    button.addEventListener("click", async function () {

        if (!isLoggedIn()) {
            window.location.href = "auth.html";
            return;
        }

        button.disabled = true;

        try {

            if (isFavorited) {

                await apiFetch(`/favorites/${place._id}`, {
                    method: "DELETE"
                });

                isFavorited = false;

            } else {

                await apiFetch("/favorites", {
                    method: "POST",
                    body: JSON.stringify({ placeId: place._id })
                });

                isFavorited = true;

            }

            updateFavoriteButton(button, isFavorited);

        } catch (error) {

            alert(error.message || "Could not update favorites.");

        }

        button.disabled = false;

    });

}


function updateFavoriteButton(button, isFavorited) {

    button.textContent = isFavorited ? "♥ Saved" : "♡ Save Place";
    button.classList.toggle("active", isFavorited);

}


/* REVIEWS */

async function loadReviews(placeId) {

    const container = document.getElementById("reviews-list");

    if (!container) return;

    try {

        const reviews = await apiFetch(`/reviews/place/${placeId}`);

        renderReviews(reviews);

    } catch (error) {

        container.innerHTML =
            "<p class='message'>Could not load reviews.</p>";

    }

}


function renderReviews(reviews) {

    const container = document.getElementById("reviews-list");

    if (!reviews || reviews.length === 0) {

        container.innerHTML =
            "<p class='message'>No reviews yet. Be the first to review this place.</p>";

        return;
    }

    container.innerHTML = reviews.map((review) => {

        const authorName = review.user?.name || "Anonymous";

        const date = review.createdAt
            ? new Date(review.createdAt).toLocaleDateString()
            : "";

        return `
            <div class="review-card">
                <div class="review-card-header">
                    <strong>${escapeHtml(authorName)}</strong>
                    <span class="review-rating">${"★".repeat(review.rating || 0)}</span>
                </div>
                <p class="review-date">${escapeHtml(date)}</p>
                <p class="review-comment">${escapeHtml(review.comment || "")}</p>
            </div>
        `;

    }).join("");

}


function setupReviewForm(placeId) {

    const formContainer = document.getElementById("review-form-container");
    const loginMessage = document.getElementById("review-login-message");
    const form = document.getElementById("review-form");

    if (!form) return;

    if (isLoggedIn()) {
        formContainer.hidden = false;
        loginMessage.hidden = true;
    } else {
        formContainer.hidden = true;
        loginMessage.hidden = false;
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const error = document.getElementById("review-form-error");
        const success = document.getElementById("review-form-success");
        const button = document.getElementById("review-submit");

        error.hidden = true;
        success.hidden = true;

        const rating = Number(
            document.getElementById("review-rating").value
        );

        const comment = document
            .getElementById("review-comment")
            .value
            .trim();

        if (!rating) {
            error.textContent = "Please select a rating.";
            error.hidden = false;
            return;
        }

        button.disabled = true;
        button.textContent = "Submitting...";

        try {

            await apiFetch("/reviews", {
                method: "POST",
                body: JSON.stringify({
                    place: placeId,
                    rating,
                    comment
                })
            });

            success.textContent =
                "Thanks! Your review was submitted and is awaiting approval.";
            success.hidden = false;

            form.reset();

        } catch (err) {

            error.textContent = err.message;
            error.hidden = false;

        }

        button.disabled = false;
        button.textContent = "Submit Review";

    });

}


function renderActivities(activities) {

    const container =
        document.getElementById("activities-list");

    if (!activities || activities.length === 0) {

        container.innerHTML =
            "<p>No activities listed.</p>";

        return;
    }


    container.innerHTML =
        activities.map(activity => {

            return `
                <span>
                    ${escapeHtml(activity)}
                </span>
            `;

        }).join("");

}


function renderAmenities(amenities) {

    const container =
        document.getElementById("amenities-list");

    if (!amenities || amenities.length === 0) {

        container.innerHTML =
            "<p>No amenities listed.</p>";

        return;
    }


    container.innerHTML =
        amenities.map(amenity => {

            return `
                <span>
                    ${escapeHtml(amenity)}
                </span>
            `;

        }).join("");

}


function renderGallery(images) {

    const image =
        document.getElementById("place-image");

    const gallery =
        document.getElementById("full-gallery");

    const dots =
        document.getElementById("gallery-dots");


    if (!images || images.length === 0) {

        image.src =
            "https://via.placeholder.com/800x600?text=No+Image";

        gallery.innerHTML =
            "<p>No images available.</p>";

        return;

    }


    currentImage = 0;

    showImage();


    gallery.innerHTML =
        images.map(imageUrl => {

            return `
                <img
                    src="${imageUrl}"
                    alt="${escapeHtml(currentPlace.name)}">
            `;

        }).join("");


    dots.innerHTML =
        images.map((imageUrl, index) => {

            return `
                <button
                    class="gallery-dot"
                    data-index="${index}">
                </button>
            `;

        }).join("");


    document
        .querySelectorAll(".gallery-dot")
        .forEach(button => {

            button.addEventListener("click", function () {

                currentImage =
                    Number(this.dataset.index);

                showImage();

            });

        });


    document
        .getElementById("previous-image")
        .addEventListener("click", function () {

            currentImage--;

            if (currentImage < 0) {
                currentImage = images.length - 1;
            }

            showImage();

        });


    document
        .getElementById("next-image")
        .addEventListener("click", function () {

            currentImage++;

            if (currentImage >= images.length) {
                currentImage = 0;
            }

            showImage();

        });

}


function showImage() {

    const images =
        currentPlace.images || [];

    if (images.length === 0) return;


    document.getElementById(
        "place-image"
    ).src = images[currentImage];


    document
        .querySelectorAll(".gallery-dot")
        .forEach((dot, index) => {

            dot.classList.toggle(
                "active",
                index === currentImage
            );

        });

}


function setupDirections(place) {

    const button =
        document.getElementById("directions-button");


    if (
        place.coordinates &&
        place.coordinates.lat !== null &&
        place.coordinates.lng !== null
    ) {

        button.href =
            `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;

    } else {

        button.href =
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.location)}`;

    }

}


function setupShare() {

    const button =
        document.getElementById("share-button");


    button.addEventListener("click", async function () {

        try {

            await navigator.clipboard.writeText(
                window.location.href
            );

            button.textContent = "Link Copied";

            setTimeout(() => {
                button.textContent = "Share";
            }, 2000);

        } catch (error) {

            alert("Copy this page URL to share it.");

        }

    });

}


async function loadNearbyPlaces(placeId) {

    const container =
        document.getElementById("nearby-places");

    try {

        const places =
            await apiFetch(
                `/places/${placeId}/nearby`
            );

        renderPlaceCards(
            "nearby-places",
            places
        );

    } catch (error) {

        container.innerHTML =
            "<p class='message'>No nearby places found.</p>";

    }

}


function showError(message) {

    document.querySelector(
        "main"
    ).innerHTML = `
        <div class="container">
            <div class="message">
                ${message}
            </div>
        </div>
    `;

}


loadPlace();