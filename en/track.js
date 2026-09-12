// Optional playback cover; native controls remain available without JavaScript.
const trackVideo = document.getElementById("track-demo-video");
const trackCover = document.querySelector("[data-track-play]");
const trackFeedback = document.querySelector("[data-track-feedback]");
if (trackVideo) {
  const playTrack = () => {
    if (trackCover) trackCover.hidden = true;
    trackVideo.play().then(() => {
      if (trackFeedback) trackFeedback.textContent = "";
    }).catch(() => {
      if (trackFeedback) trackFeedback.textContent = "The demonstration is ready. Use the video's play button to continue.";
    });
  };
  trackCover?.addEventListener("click", playTrack);
  trackVideo.addEventListener("play", () => {
    if (trackCover) trackCover.hidden = true;
    if (trackFeedback) trackFeedback.textContent = "";
  });
  trackVideo.addEventListener("error", () => {
    if (trackCover) trackCover.hidden = true;
    if (trackFeedback) trackFeedback.textContent = "The video could not load. Use the recording's download link below.";
  });
}
