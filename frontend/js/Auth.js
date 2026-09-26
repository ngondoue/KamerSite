/* AUTHENTICATION*/

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
        return;
    }

    setupAuthSwitch();
    setupPasswordButtons();
    setupLogin();
    setupSignup();

});


/* LOGIN / SIGNUP SWITCH */

function setupAuthSwitch() {

    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");

    showSignup.addEventListener("click", () => {

        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");

        document.getElementById("auth-form-title").textContent =
            "Create your account";

        document.getElementById("auth-form-subtitle").textContent =
            "Join Yaoundé Gems and start exploring";

    });


    showLogin.addEventListener("click", () => {

        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");

        document.getElementById("auth-form-title").textContent =
            "Welcome back";

        document.getElementById("auth-form-subtitle").textContent =
            "Login to your Yaoundé Gems account";

    });

}

/* =========================================
   PASSWORD SHOW / HIDE
========================================= */

function setupPasswordButtons() {

    const buttons = document.querySelectorAll(".password-toggle");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            const input = document.getElementById(
                button.dataset.target
            );

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "Hide";

            } else {

                input.type = "password";
                button.textContent = "Show";

            }

        });

    });

}


