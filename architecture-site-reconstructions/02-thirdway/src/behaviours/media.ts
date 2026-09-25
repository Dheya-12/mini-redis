/** Vimeo-hosted films are served locally: swap the player placeholder for a muted looping <video>. */
export function initVimeoFilms(root: HTMLElement) {
  const films: HTMLVideoElement[] = [];
  root.querySelectorAll<HTMLElement>(".vimeo-video[data-src]").forEach((box) => {
    const frame = (box.firstElementChild as HTMLElement) ?? box;
    const still = box.dataset.poster;
    if (still) {
      const img = document.createElement("img");
      img.src = still;
      img.alt = "";
      img.className = "video-placeholder absolute inset-0 size-full object-cover";
      frame.appendChild(img);
    }
    const video = document.createElement("video");
    if (still) video.poster = still;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";
    video.src = box.dataset.src!;
    video.setAttribute("aria-hidden", "true");
    video.addEventListener("playing", () => {
      box.querySelectorAll<HTMLElement>(".vimeo-loader, .video-placeholder").forEach((el) => {
        el.style.transition = "opacity .5s";
        el.style.opacity = "0";
      });
    }, { once: true });
    frame.insertBefore(video, frame.querySelector(".video-placeholder"));
    video.play().catch(() => {});
    films.push(video);
  });
  return () => films.forEach((v) => { v.pause(); v.remove(); });
}
