(function () {
  "use strict";

  // Shared across every animated/game-like feature below: skip motion, and
  // provide instant/static fallbacks, when the user has asked for less of it.
  var stillPlease = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Shared confetti burst, fired from an origin element's bounding rect.
  // Used by the d20 crit and the torch-flare catch.
  var confettiBurst = function (originEl) {
    var rect = originEl.getBoundingClientRect();
    var ox = rect.left + rect.width / 2;
    var oy = rect.top + rect.height / 2;
    var dpr = window.devicePixelRatio || 1;
    var canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    var colors = ["#f0c464", "#e2523e", "#6f9a68", "#f5ead1", "#d8a13a"];
    var bits = [];
    for (var i = 0; i < 160; i++) {
      var ang = Math.random() * Math.PI * 2;
      var speed = 7 + Math.random() * 13;
      bits.push({
        x: ox,
        y: oy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 7,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length]
      });
    }
    var start = performance.now();
    var frame = function (now) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var alive = false;
      bits.forEach(function (p) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < window.innerHeight + 40) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        var flutter = 0.4 + 0.6 * Math.abs(Math.sin((now - start) / 130 + p.rot));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * flutter);
        ctx.restore();
      });
      if (alive && now - start < 4000) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    };
    requestAnimationFrame(frame);
  };

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Tab-away title: nudge people back when they wander off
  var homeTitle = document.title;
  var awayTitles = [
    "Are you gonna finish this beer?",
    "You come back or Hugh kill you!",
    "Lizard Man is judging your absence."
  ];
  document.addEventListener("visibilitychange", function () {
    document.title = document.hidden
      ? awayTitles[Math.floor(Math.random() * awayTitles.length)]
      : homeTitle;
  });

  // Scroll-reveal for cards (progressive enhancement; content is visible without JS/if IO unsupported)
  var revealTargets = document.querySelectorAll(".game-row, .news-item, .about-text");
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // --- d20 in Upcoming Games ---
  // Rolls in from the right when the section scrolls into view; clicking
  // launches it in a random direction and rerolls it. A natural 20 rains
  // confetti. Flight paths are sampled parabolas fed to the Web Animations
  // API so every throw can be random.
  var d20 = document.getElementById("d20");
  var gamesSection = document.getElementById("games");
  if (d20 && gamesSection && typeof d20.animate === "function") {
    var d20Svg = d20.querySelector("svg");
    var d20Num = d20.querySelector(".d20-num");
    var d20Live = document.getElementById("d20-live");
    var d20X = 0;
    var d20Y = 0;
    var d20Busy = false;

    var d20Roll = function () {
      return 1 + Math.floor(Math.random() * 20);
    };

    var d20Face = function (n) {
      d20Num.textContent = String(n);
    };

    var d20Land = function (n) {
      d20Face(n);
      if (d20Live) {
        d20Live.textContent = "Rolled a " + n + (n === 20 ? " — critical hit!" : "");
      }
      if (n === 20) {
        d20.classList.add("is-crit");
        setTimeout(function () {
          d20.classList.remove("is-crit");
        }, 1600);
        if (!stillPlease.matches) confettiBurst(d20);
      }
      d20Busy = false;
    };

    // Flick through faces mid-flight so the number visibly rerolls
    var d20Tumble = function (duration) {
      for (var i = 1; i <= 5; i++) {
        setTimeout(function () {
          d20Face(d20Roll());
        }, (duration * i) / 6);
      }
    };

    // Fly from the current offset to (tx, ty) along a decelerating arc
    var d20Fly = function (tx, ty, spin, duration) {
      var fx = d20X;
      var fy = d20Y;
      var lift = 60 + Math.random() * 60;
      var frames = [];
      for (var s = 0; s <= 12; s++) {
        var t = s / 12;
        var p = 1 - Math.pow(1 - t, 1.8);
        var x = fx + (tx - fx) * p;
        var y = fy + (ty - fy) * p - lift * Math.sin(Math.PI * p);
        frames.push({ transform: "translate(" + x + "px," + y + "px)" });
      }
      var anim = d20.animate(frames, { duration: duration, easing: "linear", fill: "both" });
      d20Svg.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(" + spin + "deg)" }],
        { duration: duration, easing: "cubic-bezier(0.2, 0.65, 0.3, 1)" }
      );
      anim.onfinish = function () {
        anim.cancel();
        d20X = tx;
        d20Y = ty;
        d20.style.transform = "translate(" + tx + "px," + ty + "px)";
        d20Land(d20Roll());
      };
    };

    var d20Enter = function () {
      d20.classList.add("is-in");
      if (stillPlease.matches) {
        d20Land(d20Roll());
        return;
      }
      d20Busy = true;
      var rect = d20.getBoundingClientRect();
      var fromX = window.innerWidth - rect.left + 40;
      var duration = 1300;
      var frames = [];
      for (var s = 0; s <= 14; s++) {
        var t = s / 14;
        var p = 1 - Math.pow(1 - t, 2.2);
        // decaying hops as it rolls in along the floor
        var hop = Math.abs(Math.sin(p * Math.PI * 2.5)) * 34 * (1 - p);
        frames.push({ transform: "translate(" + fromX * (1 - p) + "px," + -hop + "px)" });
      }
      var anim = d20.animate(frames, { duration: duration, easing: "linear", fill: "both" });
      d20Svg.animate([{ transform: "rotate(900deg)" }, { transform: "rotate(0deg)" }], {
        duration: duration,
        easing: "cubic-bezier(0.2, 0.65, 0.3, 1)"
      });
      d20Tumble(duration);
      anim.onfinish = function () {
        anim.cancel();
        d20.style.transform = "";
        d20Land(d20Roll());
      };
    };

    d20.addEventListener("click", function () {
      if (d20Busy || !d20.classList.contains("is-in")) return;
      d20Busy = true;
      if (stillPlease.matches) {
        d20Land(d20Roll());
        return;
      }
      // launch in a random direction, kept inside the section
      var rect = d20.getBoundingClientRect();
      var sec = gamesSection.getBoundingClientRect();
      var baseL = rect.left - d20X;
      var baseT = rect.top - d20Y;
      var minX = sec.left + 10 - baseL;
      var maxX = sec.right - rect.width - 10 - baseL;
      var minY = sec.top + 10 - baseT;
      var maxY = sec.bottom - rect.height - 10 - baseT;
      var ang = Math.random() * Math.PI * 2;
      var dist = 160 + Math.random() * 280;
      var tx = Math.min(maxX, Math.max(minX, d20X + Math.cos(ang) * dist));
      var ty = Math.min(maxY, Math.max(minY, d20Y + Math.sin(ang) * dist));
      if (Math.abs(tx - d20X) + Math.abs(ty - d20Y) < 60) {
        tx = Math.min(maxX, Math.max(minX, d20X + (tx > d20X ? -160 : 160)));
      }
      var duration = 700 + dist * 0.8;
      var spin = (tx >= d20X ? 1 : -1) * 360 * (1 + Math.round(Math.random() * 2));
      d20Tumble(duration);
      d20Fly(tx, ty, spin, duration);
    });

    if ("IntersectionObserver" in window) {
      var d20Obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              d20Obs.disconnect();
              d20Enter();
            }
          });
        },
        { threshold: 0.2 }
      );
      d20Obs.observe(gamesSection);
    } else {
      d20Enter();
    }
  }

  // "Hugh wuz here" — clicking the note rattles the whole tavern
  var hughNote = document.querySelector(".board-note");
  if (hughNote) {
    var rumbleTimer = null;
    var endRumble = function () {
      clearTimeout(rumbleTimer);
      rumbleTimer = null;
      document.body.classList.remove("is-rumbling");
    };
    hughNote.addEventListener("click", function () {
      if (rumbleTimer) return;
      if (stillPlease.matches) return;
      document.body.classList.add("is-rumbling");
      // animationend is the real cleanup; the timer is a fallback in case
      // the animation never runs (e.g. display:none mid-rumble)
      rumbleTimer = setTimeout(endRumble, 1500);
    });
    document.addEventListener("animationend", function (e) {
      if (e.animationName === "tavern-rumble" && rumbleTimer) endRumble();
    });
  }

  // Hidden easter egg: crack the wax seal beside "Get in Touch" for a fortune
  var fortuneSeal = document.getElementById("fortuneSeal");
  var fortuneScrap = document.getElementById("fortuneScrap");
  var fortuneLive = document.getElementById("fortune-live");
  if (fortuneSeal && fortuneScrap) {
    var fortunes = [
      "The next round's on the house. (Terms, conditions, and the house do not exist.)",
      "You will roll exactly what you need. Eventually. Maybe next campaign.",
      "A stranger at the bar owes you a favor. Collect wisely.",
      "Tonight's stew is best not investigated too closely.",
      "The dice remember every insult you've ever hurled at them.",
      "Fortune favors the bold. Also the mildly stubborn.",
      "Someone at this table is bluffing. Statistically, it's you.",
      "No lizards were harmed in the making of this fortune. Several tankards were."
    ];
    var fortuneHideTimer = null;
    var lastFortune = -1;

    fortuneSeal.addEventListener("click", function () {
      clearTimeout(fortuneHideTimer);

      var idx;
      do {
        idx = Math.floor(Math.random() * fortunes.length);
      } while (fortunes.length > 1 && idx === lastFortune);
      lastFortune = idx;

      fortuneScrap.textContent = fortunes[idx];
      fortuneScrap.classList.add("is-open");
      if (fortuneLive) fortuneLive.textContent = "Fortune: " + fortunes[idx];

      if (!stillPlease.matches) {
        fortuneSeal.classList.remove("is-cracking");
        void fortuneSeal.offsetWidth; // restart the keyframe on rapid re-clicks
        fortuneSeal.classList.add("is-cracking");
      }

      fortuneHideTimer = setTimeout(function () {
        fortuneScrap.classList.remove("is-open");
      }, 6000);
    });
    fortuneSeal.addEventListener("animationend", function (e) {
      if (e.animationName === "seal-crack") fortuneSeal.classList.remove("is-cracking");
    });
  }

  // Hidden easter egg: torches rarely flare; catching one with a well-timed
  // click/tap/Enter is a "critical hit". No visible hint while idle.
  var torches = document.querySelectorAll(".torch");
  if (torches.length) {
    var torchLive = document.getElementById("torch-live");
    var activeTorch = null;

    var catchFlare = function (torch) {
      if (torch !== activeTorch) {
        if (torchLive) torchLive.textContent = "Nothing happens. Yet.";
        return;
      }
      activeTorch = null;
      torch.classList.remove("is-flaring");
      torch.classList.add("is-caught");
      if (torchLive) torchLive.textContent = "The flame roars up around your touch — a flicker of luck!";
      confettiBurst(torch);
    };

    torches.forEach(function (torch) {
      torch.addEventListener("click", function () {
        catchFlare(torch);
      });
      torch.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          catchFlare(torch);
        }
      });
      torch.addEventListener("animationend", function (e) {
        if (e.animationName === "torch-catch-flash") torch.classList.remove("is-caught");
      });
    });

    var scheduleFlare = function () {
      setTimeout(function () {
        if (stillPlease.matches) {
          scheduleFlare();
          return;
        }
        var torch = torches[Math.floor(Math.random() * torches.length)];
        // torches are display:none under ~720px; skip flaring one nobody can see
        if (torch.offsetParent === null) {
          scheduleFlare();
          return;
        }
        activeTorch = torch;
        torch.classList.add("is-flaring");
        setTimeout(function () {
          if (activeTorch === torch) {
            activeTorch = null;
            torch.classList.remove("is-flaring");
          }
          scheduleFlare();
        }, 900);
      }, 40000 + Math.random() * 50000);
    };

    if (!stillPlease.matches) scheduleFlare();
  }

  // Time-of-day hero lighting: window light by day, orange and lower in the
  // evening, gone at night (torches take over). CSS defaults to the day look.
  var hero = document.querySelector(".hero");
  if (hero) {
    var updateHeroDaypart = function () {
      var h = new Date().getHours();
      var part = h >= 7 && h < 17 ? "day" : h >= 17 && h < 21 ? "evening" : "night";
      hero.classList.remove("hero--day", "hero--evening", "hero--night");
      hero.classList.add("hero--" + part);
    };
    updateHeroDaypart();
    setInterval(updateHeroDaypart, 60 * 1000);
  }

  // Sticky header shadow on scroll
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8 ? "0 8px 20px rgba(0,0,0,0.35)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
