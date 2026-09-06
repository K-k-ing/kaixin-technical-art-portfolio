// Optional controls: the native player remains available without JavaScript.
const trackVideo = document.getElementById("track-demo-video");
const trackCover = document.querySelector("[data-track-play]");
const trackFeedback = document.querySelector("[data-track-feedback]");
const trackChapters = [...document.querySelectorAll("[data-track-seek]")];
if (trackVideo) {
  let pendingTrackTime;
  const playTrack = () => {
    if (trackCover) trackCover.hidden = true;
    trackVideo.play().then(() => { if (trackFeedback) trackFeedback.textContent = ""; }).catch(() => {
      if (trackFeedback) trackFeedback.textContent = "已准备好演示，请使用视频播放按钮继续。";
    });
  };
  const seekTrack = (time) => {
    trackVideo.currentTime = Math.min(time, Math.max(0, trackVideo.duration - 0.1));
    playTrack();
  };
  trackCover?.addEventListener("click", playTrack);
  trackChapters.forEach((button) => button.addEventListener("click", () => {
    const time = Number(button.dataset.trackSeek);
    if (!Number.isFinite(time)) return;
    if (trackVideo.readyState >= 1) seekTrack(time);
    else { pendingTrackTime = time; if (trackFeedback) trackFeedback.textContent = "正在载入演示…"; trackVideo.preload = "auto"; trackVideo.load(); }
  }));
  trackVideo.addEventListener("loadeddata", () => {
    if (pendingTrackTime !== undefined) { seekTrack(pendingTrackTime); pendingTrackTime = undefined; }
  });
  trackVideo.addEventListener("play", () => { if (trackCover) trackCover.hidden = true; });
  trackVideo.addEventListener("timeupdate", () => {
    const current = trackChapters.filter((button) => Number(button.dataset.trackSeek) <= trackVideo.currentTime + 0.1).at(-1);
    trackChapters.forEach((button) => { if (button === current) button.setAttribute("aria-current", "true"); else button.removeAttribute("aria-current"); });
  });
  trackVideo.addEventListener("error", () => {
    if (trackCover) trackCover.hidden = true;
    if (trackFeedback) trackFeedback.textContent = "视频暂时无法加载，请使用下方完整录屏下载链接。";
  });
}
