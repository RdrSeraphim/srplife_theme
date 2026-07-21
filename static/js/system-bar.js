document.addEventListener("DOMContentLoaded", function () {
    // Mobile menu toggle
    const mobileToggle = document.getElementById("system-bar-menu-toggle");
    const systemBarContent = document.querySelector(".system-bar-content");

    if (mobileToggle && systemBarContent) {
        mobileToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            systemBarContent.classList.toggle("active");
        });

        // Close menu when clicking outside
        document.addEventListener("click", function (e) {
            if (
                systemBarContent.classList.contains("active") &&
                !systemBarContent.contains(e.target) &&
                e.target !== mobileToggle
            ) {
                systemBarContent.classList.remove("active");
            }
        });
    }

    // Focused window title in system bar (sway-style)
    const titleElement = document.getElementById("wm-title");
    const defaultTitle = titleElement ? titleElement.textContent : "";

    if (titleElement) {
        document.querySelectorAll("[data-wm-title]").forEach((el) => {
            el.addEventListener("mouseenter", () => {
                titleElement.textContent = el.dataset.wmTitle;
            });
            el.addEventListener("mouseleave", () => {
                titleElement.textContent = defaultTitle;
            });
        });
    }

    // Clock
    const clockElement = document.getElementById("wm-clock");
    if (clockElement) {
        function updateClock() {
            const now = new Date();

            const day = now.getDate().toString().padStart(2, "0");
            const month = (now.getMonth() + 1).toString().padStart(2, "0");
            const year = now.getFullYear();

            let hours = now.getHours();
            const ampm = hours < 12 ? "AM" : "PM";
            hours = hours < 13 ? hours : hours - 12;
            let minutes = now.getMinutes();
            let seconds = now.getSeconds();

            // Format with leading zeros
            hours = hours.toString().padStart(2, "0");
            minutes = minutes.toString().padStart(2, "0");
            seconds = seconds.toString().padStart(2, "0");

            clockElement.textContent = `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
        }

        updateClock(); // Initial call
        setInterval(updateClock, 1000); // Update every second
    }
});
