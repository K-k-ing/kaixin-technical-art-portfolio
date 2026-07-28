document.documentElement.classList.add("js");

const body = document.body;
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

function closeMenu() {
  if (!navToggle) return;
  body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.querySelectorAll("img[data-hide-on-error]").forEach((image) => {
  const hideImage = () => {
    const target = image.closest("[data-optional-media]") || image;
    target.hidden = true;
  };
  image.addEventListener("error", hideImage);
  if (image.complete && image.naturalWidth === 0) hideImage();
});

document.querySelectorAll("video[data-hide-on-error]").forEach((video) => {
  const hideVideo = () => {
    const target = video.closest("[data-optional-section]") || video;
    target.hidden = true;
  };
  video.addEventListener("error", hideVideo);
  video.querySelectorAll("source").forEach((source) => source.addEventListener("error", hideVideo));
});

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -5%" }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-20% 0px -65%", threshold: [0, 0.2, 0.55] }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

const lightboxButtons = document.querySelectorAll("[data-lightbox]");
if (lightboxButtons.length) {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Expanded project image");
  dialog.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" type="button" aria-label="Close expanded image">×</button>
      <div class="lightbox-image-slot"></div>
    </div>`;
  document.body.append(dialog);

  const lightboxImageSlot = dialog.querySelector(".lightbox-image-slot");
  const closeButton = dialog.querySelector("button");
  let lightboxImage;
  let lastLightboxTrigger;

  const closeLightbox = () => {
    if (!dialog.open) return;
    dialog.close();
    body.classList.remove("lightbox-open");
  };

  lightboxButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sourceImage = button.querySelector("img");
      if (!sourceImage) return;
      lastLightboxTrigger = button;
      if (!lightboxImage) {
        lightboxImage = document.createElement("img");
        lightboxImageSlot.append(lightboxImage);
      }
      lightboxImage.src = button.dataset.full || sourceImage.currentSrc || sourceImage.src;
      lightboxImage.alt = `Expanded view: ${sourceImage.alt}`;
      dialog.showModal();
      body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeLightbox();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      closeLightbox();
    }
  });
  dialog.addEventListener("close", () => {
    body.classList.remove("lightbox-open");
    lastLightboxTrigger?.focus();
  });
}
