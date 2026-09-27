/* =========================================
   USER PROFILE
========================================= */

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


