document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = Array.from(navLinks)
        .map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);
    const ctaButtons = document.querySelectorAll("a.cta-button");

    const message = document.createElement("div");
    message.className = "site-message";
    document.body.appendChild(message);

    let messageTimer;

    function showMessage(text) {
        message.textContent = text;
        message.classList.add("show");

        clearTimeout(messageTimer);
        messageTimer = setTimeout(function () {
            message.classList.remove("show");
        }, 3500);
    }

    function scrollToSection(target) {
        const section = document.querySelector(target);

        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            scrollToSection(link.getAttribute("href"));
        });
    });

    ctaButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            const target = button.getAttribute("href");
            if (target) {
                event.preventDefault();
                scrollToSection(target);
            }
            const messageText = button.getAttribute("data-message") || "We’ll be in touch shortly.";
            showMessage(messageText);
        });
    });

    function setActiveNavLink() {
        let currentSectionId = "";

        sections.forEach(function (section) {
            const top = section.getBoundingClientRect().top;

            if (top <= 140) {
                currentSectionId = section.id;
            }
        });

        navLinks.forEach(function (link) {
            const isActive = link.getAttribute("href") === "#" + currentSectionId;
            link.classList.toggle("active", isActive);
        });
    }

    setActiveNavLink();
    window.addEventListener("scroll", setActiveNavLink);
});
