// MATE page enhancements; project content remains readable without JavaScript.
const mateOverview = document.getElementById("mate-overview");
const mateVideoFeedback = document.querySelector("[data-mate-video-feedback]");
const matePlayCover = document.querySelector("[data-mate-play]");

if (mateOverview) {
  matePlayCover?.addEventListener("click", () => {
    matePlayCover.hidden = true;
    mateOverview.play().then(() => {
      if (mateVideoFeedback) mateVideoFeedback.textContent = "";
    }).catch(() => {
      if (mateVideoFeedback) mateVideoFeedback.textContent = "Use the video's play button to continue, or open the download link below.";
    });
  });
  mateOverview.addEventListener("play", () => {
    if (matePlayCover) matePlayCover.hidden = true;
    if (mateVideoFeedback) mateVideoFeedback.textContent = "";
  });
  mateOverview.addEventListener("error", () => {
    if (matePlayCover) matePlayCover.hidden = true;
    if (mateVideoFeedback) mateVideoFeedback.textContent = "The video could not load. You can open or download the recording using the link below.";
  });
}

document.querySelectorAll("[data-mate-comparison]").forEach((comparison) => {
  const slider = comparison.querySelector('input[type="range"]');
  const viewport = comparison.querySelector(".mate-comparison-images");
  const output = comparison.querySelector("output");
  if (!slider || !viewport || !output) return;
  const updateComparison = () => {
    const percentage = Math.max(0, Math.min(100, Number(slider.value)));
    viewport.style.setProperty("--mate-compare", `${percentage}%`);
    output.value = `${percentage}%`;
    slider.setAttribute("aria-valuetext", `Treated preview ${percentage}% visible`);
  };
  slider.addEventListener("input", updateComparison);
  const updateFromPointer = (event) => {
    const bounds = viewport.getBoundingClientRect();
    if (!bounds.width) return;
    slider.value = String(Math.round((event.clientX - bounds.left) / bounds.width * 100));
    updateComparison();
  };
  viewport.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    viewport.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (viewport.hasPointerCapture(event.pointerId)) updateFromPointer(event);
  });
  const releasePointer = (event) => {
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener("pointerup", releasePointer);
  viewport.addEventListener("pointercancel", releasePointer);
  updateComparison();
});
