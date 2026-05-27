const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const siteHeader = document.querySelector("[data-site-header]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const updateHeader = () => {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const node = entry.target;
    const target = Number(node.dataset.count);
    if (!Number.isFinite(target)) return;
    const duration = 1100;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    observer.unobserve(node);
  });
}, { threshold: 0.35 });

document.querySelectorAll("[data-count]").forEach((node) => counterObserver.observe(node));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (navLinks) {
      navLinks.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

const gameShell = document.querySelector("[data-vendor-game]");

if (gameShell) {
  const canvas = gameShell.querySelector("[data-game-canvas]");
  const startButton = gameShell.querySelector("[data-game-start]");
  const scoreNode = gameShell.querySelector("[data-game-score]");
  const streakNode = gameShell.querySelector("[data-game-streak]");
  const bestNode = gameShell.querySelector("[data-game-best]");
  const ctx = canvas.getContext("2d");
  const goodLabels = ["Tokenization", "KYC", "Custody", "Legal", "Payments", "AI", "Audits", "Identity"];
  const badLabels = ["Hype", "Spam", "Noise", "Shill"];
  const getBestScore = () => {
    try {
      return Number(localStorage.getItem("fluidrwaGameBest") || 0);
    } catch (error) {
      return 0;
    }
  };

  const saveBestScore = (value) => {
    try {
      localStorage.setItem("fluidrwaGameBest", String(value));
    } catch (error) {
      // Best score persistence is nice to have; the game should still run without storage.
    }
  };

  const state = {
    running: false,
    score: 0,
    streak: 0,
    best: getBestScore(),
    trayX: 0.5,
    targetX: 0.5,
    items: [],
    lastSpawn: 0,
    lastTime: 0,
    speed: 96,
  };

  bestNode.textContent = state.best.toLocaleString();

  const resizeGame = () => {
    const rect = gameShell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(260, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawRoundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const spawnItem = (width) => {
    const isGood = Math.random() > 0.22;
    const labels = isGood ? goodLabels : badLabels;
    const label = labels[Math.floor(Math.random() * labels.length)];
    state.items.push({
      x: 24 + Math.random() * Math.max(60, width - 118),
      y: -42,
      w: Math.max(76, Math.min(116, label.length * 8 + 34)),
      h: 34,
      vy: state.speed + Math.random() * 48 + Math.min(state.score * 0.7, 120),
      label,
      good: isGood,
      tilt: (Math.random() - 0.5) * 0.08,
    });
  };

  const setScore = (delta, good) => {
    if (good) {
      state.score += delta;
      state.streak += 1;
    } else {
      state.score = Math.max(0, state.score - 20);
      state.streak = 0;
    }
    if (state.score > state.best) {
      state.best = state.score;
      saveBestScore(state.best);
    }
    scoreNode.textContent = state.score.toLocaleString();
    streakNode.textContent = state.streak.toLocaleString();
    bestNode.textContent = state.best.toLocaleString();
  };

  const renderGame = (now) => {
    const rect = gameShell.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dt = Math.min(32, now - (state.lastTime || now)) / 1000;
    state.lastTime = now;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "rgba(15, 95, 168, 0.10)";
    for (let x = 20; x < width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    if (state.running && now - state.lastSpawn > Math.max(430, 1050 - state.score * 2.1)) {
      spawnItem(width);
      state.lastSpawn = now;
    }

    state.trayX += (state.targetX - state.trayX) * Math.min(1, dt * 8);
    const trayW = Math.min(168, width * 0.36);
    const trayH = 28;
    const trayX = Math.max(16, Math.min(width - trayW - 16, state.trayX * width - trayW / 2));
    const trayY = height - 92;

    state.items.forEach((item) => {
      if (state.running) item.y += item.vy * dt;
      ctx.save();
      ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
      ctx.rotate(item.tilt);
      ctx.fillStyle = item.good ? "rgba(255, 253, 242, 0.94)" : "rgba(255, 238, 238, 0.94)";
      ctx.strokeStyle = item.good ? "rgba(15, 95, 168, 0.18)" : "rgba(170, 38, 38, 0.24)";
      ctx.lineWidth = 1;
      drawRoundRect(-item.w / 2, -item.h / 2, item.w, item.h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = item.good ? "#0f5fa8" : "#9a2b2b";
      ctx.font = "800 13px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, 0, 1);
      ctx.restore();
    });

    for (let i = state.items.length - 1; i >= 0; i -= 1) {
      const item = state.items[i];
      const caught = item.y + item.h > trayY && item.y < trayY + trayH && item.x + item.w > trayX && item.x < trayX + trayW;
      if (caught) {
        setScore(item.good ? 10 + Math.min(state.streak, 10) : 0, item.good);
        state.items.splice(i, 1);
      } else if (item.y > height + 60) {
        if (item.good) state.streak = 0;
        streakNode.textContent = state.streak.toLocaleString();
        state.items.splice(i, 1);
      }
    }

    ctx.save();
    ctx.shadowColor = "rgba(15, 95, 168, 0.24)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#0f5fa8";
    drawRoundRect(trayX, trayY, trayW, trayH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff7d1";
    ctx.font = "900 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FluidRWA Directory", trayX + trayW / 2, trayY + trayH / 2 + 1);
    ctx.restore();

    requestAnimationFrame(renderGame);
  };

  const updateTarget = (clientX) => {
    const rect = gameShell.getBoundingClientRect();
    state.targetX = (clientX - rect.left) / rect.width;
  };

  gameShell.addEventListener("pointermove", (event) => updateTarget(event.clientX));
  gameShell.addEventListener("pointerdown", (event) => {
    updateTarget(event.clientX);
    if (!state.running) startButton.click();
  });
  window.addEventListener("keydown", (event) => {
    if (!gameShell.matches(":hover") && document.activeElement !== startButton) return;
    if (event.key === "ArrowLeft") state.targetX = Math.max(0.08, state.targetX - 0.08);
    if (event.key === "ArrowRight") state.targetX = Math.min(0.92, state.targetX + 0.08);
  });
  startButton.addEventListener("click", () => {
    state.running = true;
    state.score = 0;
    state.streak = 0;
    state.items = [];
    state.lastSpawn = 0;
    state.speed = 96;
    scoreNode.textContent = "0";
    streakNode.textContent = "0";
    gameShell.classList.add("is-playing");
  });
  window.addEventListener("resize", resizeGame);
  resizeGame();
  requestAnimationFrame(renderGame);
}

const vendorSearch = document.querySelector("[data-vendor-search]");

if (vendorSearch) {
  const vendorCards = Array.from(document.querySelectorAll(".vendor-card"));
  const categoryLinks = Array.from(document.querySelectorAll("[data-filter]"));
  const categorySections = Array.from(document.querySelectorAll("[data-category-section]"));
  const countNode = document.querySelector("[data-vendor-count]");
  let activeFilter = "all";

  const updateVendorDirectory = () => {
    const query = vendorSearch.value.trim().toLowerCase();
    let visibleCount = 0;

    vendorCards.forEach((card) => {
      const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesSearch = !query || (card.dataset.search || "").includes(query);
      const isVisible = matchesCategory && matchesSearch;
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    categorySections.forEach((section) => {
      const hasVisibleCards = Boolean(section.querySelector(".vendor-card:not(.is-hidden)"));
      const matchesActiveCategory = activeFilter === "all" || section.dataset.categorySection === activeFilter;
      section.classList.toggle("is-hidden", !hasVisibleCards || !matchesActiveCategory);
    });

    if (countNode) countNode.textContent = visibleCount.toLocaleString();
  };

  vendorSearch.addEventListener("input", updateVendorDirectory);

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      activeFilter = link.dataset.filter || "all";
      categoryLinks.forEach((item) => item.classList.toggle("is-active", item === link));
      updateVendorDirectory();
      document.querySelector("#vendor-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll('a[href="#vendor-search"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const controls = vendorSearch.closest(".vendor-controls") || vendorSearch;
      const top = controls.getBoundingClientRect().top + window.scrollY - 120;
      window.history.pushState(null, "", "#vendor-search");
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.setTimeout(() => vendorSearch.focus({ preventScroll: true }), 500);
    });
  });

  updateVendorDirectory();
}
