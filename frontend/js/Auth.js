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


