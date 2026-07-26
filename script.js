document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = Array.from(navLinks)
        .map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);
    const ctaButtons = document.querySelectorAll("a.cta-button");
    const requestForm = document.querySelector(".request-form");

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

    if (requestForm) {
        requestForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const submitButton = requestForm.querySelector('button[type="submit"]');
            const formData = new FormData(requestForm);
            const originalButtonText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = "Sending...";

            fetch(requestForm.action, {
                method: requestForm.method,
                body: formData,
                headers: {
                    Accept: "application/json",
                },
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.success) {
                        requestForm.reset();
                        showMessage("Request sent successfully. We’ll get back to you soon.");
                        return;
                    }

                    showMessage(data.message || "The request could not be sent. Please try WhatsApp.");
                })
                .catch(function () {
                    showMessage("The request could not be sent. Please try WhatsApp.");
                })
                .finally(function () {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
        });
    }

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
