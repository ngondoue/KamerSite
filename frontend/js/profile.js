// Initialize the profile page when the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {

    const profilePage = document.querySelector(".profile-page");

    if (!profilePage) {
        return;
    }


    if (!isLoggedIn()) {

        window.location.href = "auth.html";

        return;
    }


    loadProfile();

    setupProfileForm();

    setupLogout();

});

// Fetch the current user's profile data from the API.
async function loadProfile() {

    try {

        const result = await apiFetch("/auth/profile");

        displayProfile(result.user);

        localStorage.setItem(
            "kamersite_user",
            JSON.stringify(result.user)
        );

    } catch (error) {

        logout();

    }

}

// Fill the profile screen with the logged-in user's information.
function displayProfile(user) {

    const avatar = document.getElementById("profile-avatar");

    const name = document.getElementById("profile-name");

    const email = document.getElementById("profile-email");

    const role = document.getElementById("profile-role-tag");

    const joined = document.getElementById("profile-joined");

    const nameInput =
        document.getElementById("profile-name-input");

    const imageInput =
        document.getElementById("profile-image-input");


    avatar.textContent =
        user.name
            ? user.name.charAt(0).toUpperCase()
            : "?";


    name.textContent = user.name;

    email.textContent = user.email;


    role.textContent =
        user.role === "admin"
            ? "Admin"
            : "Member";


    if (user.createdAt) {

        const date = new Date(user.createdAt);

        joined.textContent =
            `Member since ${date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long"
            })}`;

    }


    nameInput.value = user.name || "";

    imageInput.value = user.profileImage || "";

}

// Handle the profile form submission and update the user data.
function setupProfileForm() {

    const form = document.getElementById("profile-form");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        const error =
            document.getElementById("profile-form-error");

        const success =
            document.getElementById("profile-form-success");

        const button =
            document.getElementById("profile-form-submit");


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

            error.textContent =
                "Name cannot be empty.";

            error.hidden = false;

            return;
        }


        button.disabled = true;
        button.textContent = "Saving...";


        try {

            const result = await apiFetch(
                "/auth/profile",
                {
                    method: "PUT",

                    body: JSON.stringify({
                        name,
                        profileImage
                    })
                }
            );


            displayProfile(result.user);


            localStorage.setItem(
                "kamersite_user",
                JSON.stringify(result.user)
            );


            success.hidden = false;


        } catch (err) {

            error.textContent = err.message;

            error.hidden = false;

        }


        button.disabled = false;
        button.textContent = "Save Changes";

    });

}

// Attach the logout button action for the profile page.
function setupLogout() {

    const button =
        document.getElementById("profile-logout-btn");

    button.addEventListener("click", () => {

        logout();

    });

}
