document.documentElement.classList.add("js");

const body = document.body;
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

function closeMenu() {
  if (!navToggle) return;
  body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "展开导航");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "收起导航" : "展开导航");
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

// Keep the photo ribbon on one continuous loop while its perspective follows
// each photo's position on screen, rather than travelling with the photo.
const interestGallery = document.querySelector(".interests-gallery");
const interestMotion = document.querySelector("[data-interests-motion]");
if (interestGallery && interestMotion) {
  const ribbon = interestGallery.querySelector(".interests-ribbon");
  const originals = [...ribbon.children];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const makeCopy = () => originals.map((card) => {
    const copy = card.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelector("button").tabIndex = -1;
    return copy;
  });
  ribbon.prepend(...makeCopy());
  ribbon.append(...makeCopy());
  const cards = [...ribbon.children];
  let metrics = [];
  let cycleWidth = 0;
  let position = 0;
  let lastWritten = 0;
  let viewportWidth = 0;
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let touching = false;
  let visible = false;
  let lastTime = 0;
  let frame = 0;

  const showMotionState = () => {
    interestMotion.textContent = userPaused ? "继续滚动" : "暂停滚动";
  };
  const paintCurve = () => {
    metrics.forEach(({ card, left, width }) => {
      const center = left + width / 2 - interestGallery.scrollLeft;
      if (center < -width || center > viewportWidth + width) return;
      const distance = Math.max(-1.25, Math.min(1.25, (center - viewportWidth / 2) / (viewportWidth / 2)));
      const angle = -distance * (viewportWidth <= 600 ? 12 : 32);
      card.style.setProperty("--photo-turn", `${angle.toFixed(2)}deg`);
      card.style.setProperty("--photo-scale", (1 + 0.08 * distance * distance).toFixed(4));
    });
  };
  const measure = () => {
    const progress = cycleWidth ? (position % cycleWidth) / cycleWidth : 0.045;
    metrics = cards.map((card) => ({ card, left: card.offsetLeft, width: card.offsetWidth }));
    cycleWidth = metrics[originals.length].left - metrics[0].left;
    viewportWidth = interestGallery.clientWidth;
    position = cycleWidth * (1 + progress);
    interestGallery.scrollLeft = position;
    lastWritten = interestGallery.scrollLeft;
    paintCurve();
  };
  const tick = (time) => {
    frame = 0;
    const elapsed = lastTime ? Math.min(time - lastTime, 80) : 0;
    lastTime = time;
    // Respect touchpad/swipe scrolling without discarding sub-pixel movement.
    if (Math.abs(interestGallery.scrollLeft - lastWritten) > 1) {
      position = interestGallery.scrollLeft;
    }
    const focused = interestGallery.contains(document.activeElement);
    if (!userPaused && !hovered && !touching && !focused && !body.classList.contains("lightbox-open")) {
      position += elapsed * 0.018; // 18 px / second: approximately one minute per desktop loop.
      if (position >= cycleWidth * 2) position -= cycleWidth;
      if (position < cycleWidth) position += cycleWidth;
      interestGallery.scrollLeft = position;
      lastWritten = interestGallery.scrollLeft;
    }
    paintCurve();
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!frame && visible && !document.hidden) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  };
  interestMotion.hidden = false;
  showMotionState();
  measure();
  new ResizeObserver(measure).observe(interestGallery);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(interestGallery);
  document.addEventListener("visibilitychange", start);
  interestGallery.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") hovered = true; });
  interestGallery.addEventListener("pointerleave", () => { hovered = false; });
  interestGallery.addEventListener("pointerdown", () => { touching = true; });
  window.addEventListener("pointerup", () => { touching = false; });
  window.addEventListener("pointercancel", () => { touching = false; });
  interestGallery.addEventListener("scroll", () => {
    paintCurve();
    if (touching || hovered || userPaused || interestGallery.contains(document.activeElement)) {
      position = interestGallery.scrollLeft;
      lastWritten = position;
    }
  }, { passive: true });
  interestMotion.addEventListener("click", () => {
    userPaused = !userPaused;
    showMotionState();
  });
  reducedMotion.addEventListener("change", () => {
    userPaused = reducedMotion.matches;
    showMotionState();
  });
}

const lightboxButtons = document.querySelectorAll("[data-lightbox]");
if (lightboxButtons.length) {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "图片大图");
  dialog.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" type="button" aria-label="关闭大图">×</button>
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
      lightboxImage.alt = `放大视图：${sourceImage.alt}`;
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
