const screens = Array.from(document.querySelectorAll("[data-screen]"));
const stars = document.getElementById("stars");
const ambientEffects = document.getElementById("ambient-effects");
const music = document.getElementById("birthday-music");
const musicToggle = document.getElementById("music-toggle");
const fireworksCanvas = document.getElementById("fireworks");
const fireworksContext = fireworksCanvas.getContext("2d");

const totalPhotos = 57;
let currentPhoto = 1;
let fireworksAnimation = null;
let activeScreen = "opening";
let musicAvailable = true;

// Shared helpers keep the animation and navigation code small and predictable.
function random(min, max) {
  return Math.random() * (max - min) + min;
}

function padPhotoNumber(number) {
  return String(number).padStart(2, "0");
}

function showScreen(id) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });

  activeScreen = id;
  window.scrollTo({ top: 0, behavior: "smooth" });

  const nextScreen = document.getElementById(id);
  const envelope = nextScreen?.querySelector("[data-envelope]");
  const typewriter = nextScreen?.querySelector("[data-typewriter]");

  if (envelope) {
    envelope.classList.remove("played");
    requestAnimationFrame(() => envelope.classList.add("played"));
  }

  if (typewriter) {
    runTypewriter(typewriter, typewriter.dataset.typewriter);
  }

  if (id === "video-finale") {
    window.setTimeout(() => playFinalVideo(), 650);
  } else {
    pauseFinalVideo();
  }

  if (id === "final-surprise" || id === "ending") {
    startFireworks();
  } else if (id !== "video-finale") {
    stopFireworks();
  }
}

// Build the permanent moonlit star field once on page load.
function createStars() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 140; index += 1) {
    const star = document.createElement("span");
    star.style.left = `${random(0, 100)}%`;
    star.style.top = `${random(0, 100)}%`;
    star.style.setProperty("--duration", `${random(1.6, 4.8)}s`);
    star.style.setProperty("--opacity", random(0.35, 1).toFixed(2));
    fragment.appendChild(star);
  }

  stars.appendChild(fragment);
}

// Ambient romantic effects stay lightweight by creating and removing small DOM nodes.
function createFloatingHeart() {
  const heart = document.createElement("span");
  heart.className = "heart-float";
  heart.textContent = "❤️";
  heart.style.setProperty("--left", `${random(0, 100)}%`);
  heart.style.setProperty("--size", `${random(1, 2.4)}rem`);
  heart.style.setProperty("--drift", `${random(-90, 90)}px`);
  heart.style.setProperty("--float-duration", `${random(5.5, 10)}s`);
  ambientEffects.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function createFallingPiece(kind = "rose") {
  const piece = document.createElement("span");
  piece.className = `ambient-piece ${kind === "ring" ? "ring" : ""}`;
  piece.textContent = kind === "ring" ? "💍" : "🌹";
  piece.style.setProperty("--left", `${random(0, 100)}%`);
  piece.style.setProperty("--size", `${random(1, 2.1)}rem`);
  piece.style.setProperty("--drift", `${random(-120, 120)}px`);
  piece.style.setProperty("--fall-duration", `${random(4.5, 8)}s`);
  piece.style.setProperty("--color", kind === "ring" ? "var(--rose-gold)" : "#ff9abf");
  ambientEffects.appendChild(piece);
  piece.addEventListener("animationend", () => piece.remove());
}

// Celebration bursts are used after correct answers and special story moments.
function burst(effect) {
  const counts = {
    hearts: { hearts: 34, roses: 0, rings: 0 },
    "hearts-roses": { hearts: 26, roses: 18, rings: 0 },
    rings: { hearts: 24, roses: 10, rings: 20 },
  };
  const selected = counts[effect] || counts.hearts;

  for (let i = 0; i < selected.hearts; i += 1) {
    setTimeout(createFloatingHeart, i * 35);
  }
  for (let i = 0; i < selected.roses; i += 1) {
    setTimeout(() => createFallingPiece("rose"), i * 45);
  }
  for (let i = 0; i < selected.rings; i += 1) {
    setTimeout(() => createFallingPiece("ring"), i * 45);
  }
}

function startAmbientEffects() {
  setInterval(createFloatingHeart, 1300);
  setInterval(() => createFallingPiece("rose"), 5200);
}

// The countdown intentionally starts after a user gesture so music can begin reliably.
function startCountdown() {
  let number = 5;
  const countdownNumber = document.getElementById("countdown-number");
  countdownNumber.textContent = number;

  const timer = setInterval(() => {
    number -= 1;
    countdownNumber.textContent = number;

    if (number === 0) {
      clearInterval(timer);
      showScreen("birthday");
    }
  }, 1000);
}

function runTypewriter(element, text) {
  let index = 0;
  element.textContent = "";

  const write = () => {
    element.textContent = text.slice(0, index);
    index += 1;

    if (index <= text.length) {
      window.setTimeout(write, 34);
    }
  };

  window.setTimeout(write, 900);
}

// Central navigation keeps every chapter as a real screen with a clear id.
function setupNavigation() {
  document.querySelector("[data-start]").addEventListener("click", async () => {
    musicToggle.classList.remove("hidden");

    if (!musicAvailable) {
      musicToggle.textContent = "Music Missing";
      musicToggle.disabled = true;
      showScreen("countdown");
      startCountdown();
      return;
    }

    try {
      await music.play();
      musicToggle.textContent = "Pause Music";
    } catch {
      musicToggle.textContent = "Play Music";
    }

    showScreen("countdown");
    startCountdown();
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.go));
  });

  musicToggle.addEventListener("click", async () => {
    if (!musicAvailable) return;

    if (music.paused) {
      const finalVideo = document.getElementById("final-video");
      if (finalVideo && !finalVideo.paused) {
        finalVideo.pause();
      }

      await music.play();
      musicToggle.textContent = "Pause Music";
    } else {
      music.pause();
      musicToggle.textContent = "Play Music";
    }
  });
}

function setupMusic() {
  music.addEventListener("error", () => {
    musicAvailable = false;
    musicToggle.textContent = "Music Missing";
    musicToggle.disabled = true;
  });
}

function setupQuizzes() {
  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const correctAnswer = quiz.dataset.correct;
    const feedback = quiz.querySelector(".feedback");
    const nextAction = quiz.querySelector(".next-action");

    quiz.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.remove("wrong");

        if (button.dataset.answer === correctAnswer) {
          quiz.querySelectorAll("[data-answer]").forEach((option) => {
            option.disabled = true;
            option.classList.toggle("correct", option === button);
          });
          feedback.textContent = quiz.dataset.success;
          nextAction.classList.remove("hidden");
          burst(quiz.dataset.effect);
        } else {
          feedback.textContent = "😜 Try Again My Love";
          button.classList.add("wrong");
        }
      });
    });
  });
}

// The album expects photos/photo01.jpg through photos/photo57.jpg.
function updateAlbum(direction = 0) {
  currentPhoto += direction;

  if (currentPhoto < 1) currentPhoto = totalPhotos;
  if (currentPhoto > totalPhotos) currentPhoto = 1;

  const photo = document.getElementById("album-photo");
  const caption = document.getElementById("photo-caption");
  const count = document.getElementById("photo-count");

  photo.classList.add("changing");

  setTimeout(() => {
    photo.src = `photos/photo${padPhotoNumber(currentPhoto)}.jpg`;
    photo.alt = `Memory photo ${currentPhoto}`;
    caption.textContent = `Caption placeholder for photo ${currentPhoto}`;
    count.textContent = `Photo ${currentPhoto} of ${totalPhotos}`;
    photo.classList.remove("changing");
  }, 220);
}

function setupAlbum() {
  document.getElementById("prev-photo").addEventListener("click", () => updateAlbum(-1));
  document.getElementById("next-photo").addEventListener("click", () => updateAlbum(1));
  updateAlbum(0);
}

async function playFinalVideo() {
  const player = document.querySelector("[data-video-player]");
  const video = document.getElementById("final-video");

  if (!player || !video) return;

  music.pause();
  musicToggle.textContent = "Play Music";

  try {
    await video.play();
    player.classList.add("playing");
  } catch {
    video.controls = true;
  }
}

function pauseFinalVideo() {
  const video = document.getElementById("final-video");

  if (video && !video.paused) {
    video.pause();
  }
}

function setupVideoPlayer() {
  const player = document.querySelector("[data-video-player]");
  const playButton = document.querySelector("[data-play-video]");
  const video = document.getElementById("final-video");

  if (!player || !playButton || !video) return;

  playButton.addEventListener("click", playFinalVideo);

  video.addEventListener("play", () => {
    player.classList.add("playing");
    music.pause();
    musicToggle.textContent = "Play Music";
  });
}

// Canvas fireworks avoid external dependencies while keeping the finale lively.
function resizeFireworksCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  fireworksCanvas.width = window.innerWidth * pixelRatio;
  fireworksCanvas.height = window.innerHeight * pixelRatio;
  fireworksContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createFireworkParticle(x, y) {
  const colors = ["#ff6fae", "#f3c08f", "#ffffff", "#f5b6a8"];
  const particles = [];
  const count = 44;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const velocity = random(1.4, 4.4);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: random(42, 72),
      color: colors[Math.floor(random(0, colors.length))],
    });
  }

  return particles;
}

function startFireworks() {
  if (fireworksAnimation) return;

  fireworksCanvas.classList.add("active");
  resizeFireworksCanvas();

  let particles = [];
  let frame = 0;

  const animate = () => {
    fireworksContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    frame += 1;

    if (frame % 32 === 0) {
      particles = particles.concat(
        createFireworkParticle(random(80, window.innerWidth - 80), random(80, window.innerHeight * 0.52))
      );
    }

    particles = particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.life -= 1;

      fireworksContext.globalAlpha = Math.max(particle.life / 72, 0);
      fireworksContext.fillStyle = particle.color;
      fireworksContext.beginPath();
      fireworksContext.arc(particle.x, particle.y, 2.2, 0, Math.PI * 2);
      fireworksContext.fill();

      return particle.life > 0;
    });

    fireworksContext.globalAlpha = 1;
    fireworksAnimation = requestAnimationFrame(animate);
  };

  animate();
}

function stopFireworks() {
  fireworksCanvas.classList.remove("active");

  if (fireworksAnimation) {
    cancelAnimationFrame(fireworksAnimation);
    fireworksAnimation = null;
    fireworksContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

createStars();
startAmbientEffects();
setupMusic();
setupNavigation();
setupQuizzes();
setupAlbum();
setupVideoPlayer();
window.addEventListener("resize", resizeFireworksCanvas);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && activeScreen !== "opening") {
    music.pause();
    musicToggle.textContent = "Play Music";
  }
});
