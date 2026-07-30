(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Mobile nav */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("is-open"));
    });
  }

  /* Scroll reveal */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && !reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Story beat accent follow */
  const beats = document.querySelectorAll(".story-beat[data-tone]");
  if (beats.length && "IntersectionObserver" in window) {
    const toneMap = {
      slate: "#64748b",
      teal: "#0f766e",
      amber: "#b45309",
      blue: "#1d4ed8",
      build: "#4f46e5",
      green: "#15803d",
    };
    const toneIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const tone = entry.target.getAttribute("data-tone");
          const color = toneMap[tone];
          if (color) {
            document.documentElement.style.setProperty("--accent", color);
            document.documentElement.style.setProperty(
              "--accent-glow",
              `color-mix(in srgb, ${color} 28%, transparent)`
            );
          }
        });
      },
      { threshold: 0.55 }
    );
    beats.forEach((b) => toneIo.observe(b));
  }

  /* Soft parallax on orbs */
  const orbs = document.querySelectorAll(".hero-orb");
  if (orbs.length && !reduceMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY * 0.08;
        orbs.forEach((orb, i) => {
          orb.style.translate = `0 ${y * (i ? -0.6 : 0.4)}px`;
        });
      },
      { passive: true }
    );
  }

  /* Case filter */
  const chips = document.querySelectorAll(".filter-chip");
  const cases = document.querySelectorAll(".case-item");
  if (chips.length && cases.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.getAttribute("data-filter") || "all";
        chips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");

        cases.forEach((item) => {
          const tags = (item.getAttribute("data-areas") || "")
            .split(/\s+/)
            .filter(Boolean);
          const match = filter === "all" || tags.includes(filter);
          item.classList.toggle("is-dimmed", !match);
          item.classList.toggle("is-hidden", false);
        });

        document.body.style.setProperty(
          "--filter-flash",
          filter === "all" ? "var(--ink)" : "currentColor"
        );
      });
    });
  }

  /* Pointer wash on hero (subtle) */
  const hero = document.querySelector(".hero");
  const atmosphere = document.querySelector(".hero-atmosphere");
  if (hero && atmosphere && !reduceMotion) {
    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      atmosphere.style.backgroundPosition = `${x}% ${y}%`;
    });
  }

  /* View Transitions for internal area links */
  document.querySelectorAll('a[href^="areas/"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (!document.startViewTransition) return;
      const href = a.getAttribute("href");
      if (!href || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.startViewTransition(() => {
        window.location.href = href;
      });
    });
  });
})();
