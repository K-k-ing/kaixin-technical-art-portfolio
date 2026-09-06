// MATE page enhancements; all project content remains readable without JavaScript.
const mateOverview = document.getElementById("mate-overview");
const mateChapterButtons = [...document.querySelectorAll("[data-mate-seek]")];
const mateVideoFeedback = document.querySelector("[data-mate-video-feedback]");
const matePlayCover = document.querySelector("[data-mate-play]");

if (mateOverview) {
  matePlayCover?.addEventListener("click", () => {
    matePlayCover.hidden = true;
    mateOverview.play().catch(() => {
      if (mateVideoFeedback) mateVideoFeedback.textContent = "请使用视频播放按钮继续，或展开下方完整录屏。";
    });
  });
  mateOverview.addEventListener("play", () => {
    if (matePlayCover) matePlayCover.hidden = true;
  });
  let matePendingSeek;
  const seekToChapter = (time) => {
    mateOverview.currentTime = Math.min(time, Math.max(0, mateOverview.duration - 0.1));
    mateOverview.play().then(() => {
      if (mateVideoFeedback) mateVideoFeedback.textContent = "";
    }).catch(() => {
      if (mateVideoFeedback) mateVideoFeedback.textContent = "已定位章节，请点击视频播放按钮继续。";
    });
  };
  mateChapterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const time = Number(button.dataset.mateSeek);
      if (!Number.isFinite(time)) return;
      if (mateOverview.readyState >= 1) seekToChapter(time);
      else {
        matePendingSeek = time;
        if (mateVideoFeedback) mateVideoFeedback.textContent = "正在载入演示…";
        mateOverview.load();
      }
    });
  });
  mateOverview.addEventListener("loadedmetadata", () => {
    if (matePendingSeek !== undefined) {
      seekToChapter(matePendingSeek);
      matePendingSeek = undefined;
    }
  });
  mateOverview.addEventListener("timeupdate", () => {
    const active = mateChapterButtons.filter((button) => Number(button.dataset.mateSeek) <= mateOverview.currentTime + 0.1).at(-1);
    mateChapterButtons.forEach((button) => {
      if (button === active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  });
  mateOverview.addEventListener("error", () => {
    if (mateVideoFeedback) mateVideoFeedback.textContent = "视频暂时无法载入，可以展开下方完整录屏或使用下载链接。";
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
    slider.setAttribute("aria-valuetext", `处理预览显示 ${percentage}%`);
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

// Avoid two demonstrations playing at the same time, including a collapsed full demo.
const mateVideos = [...document.querySelectorAll(".mate-main video")];
mateVideos.forEach((video) => video.addEventListener("play", () => {
  mateVideos.forEach((other) => { if (other !== video) other.pause(); });
}));
document.getElementById("full-demo")?.addEventListener("toggle", (event) => {
  if (!event.currentTarget.open) event.currentTarget.querySelector("video")?.pause();
});
