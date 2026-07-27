document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = Array.from(navLinks)
        .map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);
    const ctaButtons = document.querySelectorAll("a.cta-button");
    const requestForm = document.querySelector(".request-form");
    const navToggle = document.querySelector(".nav-toggle");
    const heroVideo = document.querySelector(".hero-video");

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

    function closeNavMenu() {
        document.body.classList.remove("nav-open");

        if (navToggle) {
            navToggle.setAttribute("aria-expanded", "false");
            navToggle.setAttribute("aria-label", "Open navigation menu");
        }
    }

    if (navToggle) {
        navToggle.addEventListener("click", function () {
            const isOpen = document.body.classList.toggle("nav-open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
            navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
        });
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            scrollToSection(link.getAttribute("href"));
            closeNavMenu();
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeNavMenu();
        }
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

    if (heroVideo) {
        const playlist = (heroVideo.dataset.videoPlaylist || "")
            .split(",")
            .map(function (source) {
                return source.trim();
            })
            .filter(Boolean);
        let currentVideoIndex = 0;
        let failedVideoCount = 0;
        let activeVideo = heroVideo;
        let standbyVideo = heroVideo.cloneNode(false);
        let isTransitioning = false;
        let hasInteractionRetry = false;

        standbyVideo.removeAttribute("id");
        standbyVideo.removeAttribute("data-video-playlist");
        standbyVideo.removeAttribute("poster");
        standbyVideo.classList.remove("is-active");
        heroVideo.after(standbyVideo);

        function setupVideo(video) {
            video.autoplay = false;
            video.defaultMuted = true;
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";
        }

        function prepareVideo(video, source) {
            video.src = source;
            setupVideo(video);
            video.load();
        }

        function retryAfterInteraction(video) {
            if (hasInteractionRetry) {
                return;
            }

            hasInteractionRetry = true;

            function retry() {
                playVideo(video);
                document.removeEventListener("click", retry);
                document.removeEventListener("touchstart", retry);
                document.removeEventListener("keydown", retry);
            }

            document.addEventListener("click", retry, { once: true });
            document.addEventListener("touchstart", retry, { once: true });
            document.addEventListener("keydown", retry, { once: true });
        }

        function playVideo(video) {
            setupVideo(video);

            const playRequest = video.play();

            if (playRequest) {
                return playRequest.catch(function () {
                    video.addEventListener("canplay", function () {
                        playVideo(video);
                    }, { once: true });
                    retryAfterInteraction(video);
                    throw new Error("Hero video playback was blocked.");
                });
            }

            return Promise.resolve();
        }

        function playHeroVideo(index) {
            if (!playlist.length || failedVideoCount >= playlist.length) {
                return;
            }

            currentVideoIndex = index % playlist.length;
            prepareVideo(activeVideo, playlist[currentVideoIndex]);
            activeVideo.classList.add("is-active");
            playVideo(activeVideo).catch(function () {});

            if (playlist.length > 1) {
                prepareVideo(standbyVideo, playlist[(currentVideoIndex + 1) % playlist.length]);
            }
        }

        function transitionHeroVideo() {
            if (isTransitioning || playlist.length < 2) {
                return;
            }

            isTransitioning = true;
            failedVideoCount = 0;
            currentVideoIndex = (currentVideoIndex + 1) % playlist.length;

            standbyVideo.currentTime = 0;
            playVideo(standbyVideo)
                .then(function () {
                    standbyVideo.classList.add("is-active");
                    activeVideo.classList.remove("is-active");

                    window.setTimeout(function () {
                        activeVideo.pause();
                        activeVideo.removeAttribute("src");

                        const previousVideo = activeVideo;
                        activeVideo = standbyVideo;
                        standbyVideo = previousVideo;
                        prepareVideo(standbyVideo, playlist[(currentVideoIndex + 1) % playlist.length]);
                        isTransitioning = false;
                    }, 750);
                })
                .catch(function () {
                    failedVideoCount += 1;
                    isTransitioning = false;

                    if (failedVideoCount < playlist.length) {
                        transitionHeroVideo();
                    }
                });
        }

        function shouldTransition(video) {
            return video.duration && video.duration - video.currentTime <= 1.5;
        }

        [heroVideo, standbyVideo].forEach(function (video) {
            video.addEventListener("timeupdate", function () {
                if (video === activeVideo && shouldTransition(video)) {
                    transitionHeroVideo();
                }
            });

            video.addEventListener("ended", function () {
                if (video === activeVideo) {
                    transitionHeroVideo();
                }
            });

            video.addEventListener("error", function () {
                failedVideoCount += 1;

                if (failedVideoCount < playlist.length) {
                    playHeroVideo(currentVideoIndex + 1);
                }
            });
        });

        playHeroVideo(0);
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
