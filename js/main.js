(function () {
  "use strict";

  // Shared across every animated/game-like feature below: skip motion, and
  // provide instant/static fallbacks, when the user has asked for less of it.
  var stillPlease = window.matchMedia("(prefers-reduced-motion: reduce)");

  // For the nosy: a warning from Hugh for anyone who opens devtools.
  console.log(
    "%cYOU NO POKE AROUND IN CONSOLE OR HUGH KILL YOU!",
    "font: bold 20px Georgia, serif; color: #f0c464; background: #1a120c; padding: 10px 14px; border: 2px solid #b5392b; border-radius: 4px; text-shadow: 0 0 8px rgba(255, 106, 44, 0.6);"
  );

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

  // Logo mashing: click the header toaster 5 times fast and it overheats.
  // It rattles red-hot, then blows apart into shards in a puff of smoke;
  // two seconds later the pieces fly back together and it cools off. (On
  // pages where the logo links elsewhere, the first click navigates away,
  // so this lives on the home page, where it links to #top.)
  var headerBrand = document.querySelector(".site-header .brand");
  var headerCrest = headerBrand && headerBrand.querySelector(".brand-crest");
  var overheating = false;
  var OVERHEAT_MS = 700;  // red-hot rattle before it blows (matches styles.css)
  var SCATTERED_MS = 2000; // how long the pieces stay apart
  var REFORM_MS = 450;

  var puffSmoke = function (x, y) {
    for (var i = 0; i < 6; i++) {
      var puff = document.createElement("span");
      puff.className = "toaster-smoke";
      puff.style.left = x + "px";
      puff.style.top = y + "px";
      document.body.appendChild(puff);
      var dx = (i % 2 ? 1 : -1) * (20 + Math.random() * 50);
      var anim = puff.animate([
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
        { transform: "translate(-50%, -80%) scale(0.8)", opacity: 0.85, offset: 0.2 },
        { transform: "translate(calc(-50% + " + dx + "px), -170%) scale(2.4)", opacity: 0 }
      ], { duration: 1400 + Math.random() * 500, delay: i * 140, easing: "ease-out", fill: "both" });
      anim.onfinish = puff.remove.bind(puff);
    }
  };

  // Shatter the crest: lay copies of it over the original, each clipped to
  // one wedge of a jittered pinwheel around the toaster's middle, and fling
  // the wedges outward. They tumble, drift down a little, then reverse back
  // into place, cooling from red-hot to gold on the way.
  var explodeCrest = function (onDone) {
    var r = headerCrest.getBoundingClientRect();
    var hot = "#ff6a2c"; // the red-hot end of crest-overheat in styles.css
    var gold = getComputedStyle(headerBrand).color;
    var SHARDS = 9;
    var cx = 50, cy = 58; // % of the crest box: roughly the toaster's center
    var angles = [];
    for (var i = 0; i < SHARDS; i++) {
      angles.push((i + 0.25 + Math.random() * 0.5) / SHARDS * Math.PI * 2);
    }
    // a point on (well past) the crest box's edge in a given direction, so
    // each wedge reaches all the way out to the corners
    var rim = function (a) {
      return (cx + Math.cos(a) * 90).toFixed(1) + "% " + (cy + Math.sin(a) * 90).toFixed(1) + "%";
    };
    var total = SCATTERED_MS + REFORM_MS;
    var out = 300 / total;
    var hold = SCATTERED_MS / total;
    var shards = [];
    for (var j = 0; j < SHARDS; j++) {
      var a0 = angles[j];
      var a1 = angles[(j + 1) % SHARDS] + (j === SHARDS - 1 ? Math.PI * 2 : 0);
      var mid = (a0 + a1) / 2;
      var shard = document.createElement("span");
      shard.className = "crest-shard";
      shard.style.left = r.left + "px";
      shard.style.top = r.top + "px";
      shard.style.width = r.width + "px";
      shard.style.height = r.height + "px";
      shard.style.clipPath = "polygon(" + cx + "% " + cy + "%, " + rim(a0) + ", " + rim(mid) + ", " + rim(a1) + ")";
      var copy = headerCrest.cloneNode(true);
      copy.setAttribute("class", "brand-crest"); // drop the overheating state
      shard.appendChild(copy);
      document.body.appendChild(shard);
      shards.push(shard);

      var dist = 34 + Math.random() * 46;
      var dx = Math.cos(mid) * dist;
      var dy = Math.sin(mid) * dist * 0.8 - 6; // a little lift, the header's short
      var spin = (Math.random() - 0.5) * 540;
      shard.animate([
        { transform: "translate(0, 0) rotate(0deg) scale(1)", color: hot, easing: "cubic-bezier(0.1, 0.8, 0.3, 1)" },
        { transform: "translate(" + dx + "px, " + dy + "px) rotate(" + spin + "deg) scale(1.35)", color: hot, offset: out, easing: "ease-in-out" },
        { transform: "translate(" + dx * 1.08 + "px, " + (dy + 10) + "px) rotate(" + spin * 1.15 + "deg) scale(1.35)", color: hot, offset: hold, easing: "cubic-bezier(0.6, 0, 0.4, 1)" },
        { transform: "translate(0, 0) rotate(0deg) scale(1)", color: gold }
      ], { duration: total, fill: "both" });
    }
    // cleanup on a timer rather than the animation's finish event, which
    // only fires once the page next renders (so never in a background tab)
    setTimeout(function () {
      shards.forEach(function (s) { s.remove(); });
      onDone();
    }, total);
    // a bright flash where it blew
    var flash = document.createElement("span");
    flash.className = "crest-flash";
    flash.style.left = r.left + r.width / 2 + "px";
    flash.style.top = r.top + r.height * 0.55 + "px";
    document.body.appendChild(flash);
    flash.animate([
      { transform: "translate(-50%, -50%) scale(0.2)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(1.6)", opacity: 0 }
    ], { duration: 450, easing: "ease-out", fill: "both" }).onfinish = flash.remove.bind(flash);
    puffSmoke(r.left + r.width / 2, r.top + r.height * 0.5);
  };

  var overheat = function () {
    overheating = true;
    headerCrest.classList.add("is-overheating");
    setTimeout(function () {
      headerCrest.classList.add("is-exploded"); // hide the real one while it's in pieces
      explodeCrest(function () {
        headerCrest.classList.remove("is-overheating", "is-exploded");
        // a little shake as it snaps back together
        headerCrest.classList.remove("is-celebrating");
        void headerCrest.getBoundingClientRect();
        headerCrest.classList.add("is-celebrating");
        overheating = false;
      });
    }, OVERHEAT_MS);
  };

  if (headerBrand && headerCrest && !stillPlease.matches) {
    var mashTimes = [];
    headerBrand.addEventListener("click", function () {
      if (overheating) return;
      var now = performance.now();
      mashTimes.push(now);
      mashTimes = mashTimes.filter(function (t) { return now - t < 1500; });
      if (mashTimes.length >= 5) {
        mashTimes = [];
        overheat();
      }
    });
  }

  // Type "lizard" anywhere (outside a text field) for a little celebration:
  // a burst of confetti from the header toaster as its cards hop.
  if (headerCrest && !stillPlease.matches) {
    var typed = "";
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      var el = e.target;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      typed = (typed + e.key.toLowerCase()).slice(-6);
      if (typed !== "lizard") return;
      typed = "";
      confettiBurst(headerCrest);
      headerCrest.classList.remove("is-celebrating");
      void headerCrest.getBoundingClientRect(); // restart the hop if typed twice in a row
      headerCrest.classList.add("is-celebrating");
    });
    headerCrest.addEventListener("animationend", function (e) {
      if (e.animationName === "crest-jolt") headerCrest.classList.remove("is-celebrating");
    });
  }

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
  var revealTargets = document.querySelectorAll(".game-row, .about-text");
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

  // Corkboard arrow quiver: the first time the news board scrolls into view,
  // the arrow wobbles like it just thunked into the wood. Once per visit.
  var boardArrow = document.querySelector(".board-arrow");
  if (boardArrow && !stillPlease.matches && "IntersectionObserver" in window) {
    var arrowObserver = new IntersectionObserver(
      function (entries) {
        if (!entries[0].isIntersecting) return;
        arrowObserver.disconnect();
        // a beat after it appears, so the eye has landed on it first
        setTimeout(function () { boardArrow.classList.add("is-thunked"); }, 250);
      },
      { threshold: 0.9 }
    );
    arrowObserver.observe(boardArrow);
  }

  // Game boxes lift their lids: click a box and its lid swings open with a
  // card peeking out; it shuts itself again after a few seconds. Desktop
  // only, since phones flatten the box to its front face (see styles.css).
  var boxWide = window.matchMedia("(min-width: 721px)");
  document.querySelectorAll(".game-box-wrap").forEach(function (wrap) {
    var box = wrap.querySelector(".game-box");
    if (!box) return;
    var shutTimer = null;
    wrap.addEventListener("click", function () {
      if (!boxWide.matches) return;
      clearTimeout(shutTimer);
      var open = box.classList.toggle("is-open");
      if (open) {
        shutTimer = setTimeout(function () { box.classList.remove("is-open"); }, 4000);
      }
    });
  });

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
        d20Live.textContent = "Rolled a " + n + (n === 20 ? ", critical hit!" : "");
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

  // "Hugh wuz here": clicking the note rattles the whole tavern
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

  // Napkin Games page: "Roll for it" picks a random napkin, scrolls to it,
  // and lights it up. Never picks the same one twice in a row.
  var napkinRoll = document.getElementById("napkinRoll");
  var napkins = document.querySelectorAll(".napkin");
  if (napkinRoll && napkins.length) {
    var napkinDieNum = document.getElementById("napkinDieNum");
    var napkinLive = document.getElementById("napkin-live");
    var lastNapkin = -1;

    napkinRoll.addEventListener("click", function () {
      var idx;
      do {
        idx = Math.floor(Math.random() * napkins.length);
      } while (napkins.length > 1 && idx === lastNapkin);
      lastNapkin = idx;

      var picked = napkins[idx];
      var title = picked.querySelector(".napkin-title");
      if (napkinDieNum) napkinDieNum.textContent = String(idx + 1);
      if (napkinLive && title) napkinLive.textContent = "Rolled a " + (idx + 1) + ": " + title.textContent;

      napkinRoll.classList.remove("is-rolling");
      void napkinRoll.offsetWidth; // restart the tumble on rapid re-clicks
      napkinRoll.classList.add("is-rolling");

      napkins.forEach(function (n) {
        n.classList.remove("is-picked");
      });
      void picked.offsetWidth;
      picked.classList.add("is-picked");
      picked.scrollIntoView({ behavior: stillPlease.matches ? "auto" : "smooth", block: "center" });
      picked.focus({ preventScroll: true });
    });
    napkinRoll.addEventListener("animationend", function (e) {
      if (e.animationName === "napkin-die-tumble") napkinRoll.classList.remove("is-rolling");
    });
    napkins.forEach(function (n) {
      n.addEventListener("animationend", function (e) {
        if (e.animationName === "napkin-picked") n.classList.remove("is-picked");
      });
      // reduced motion has no animation, so its outline highlight is cleared on blur
      n.addEventListener("blur", function () {
        if (stillPlease.matches) n.classList.remove("is-picked");
      });
    });
  }

  // Hidden easter egg: torches rarely flare; catching one with a well-timed
  // click/tap/Enter is a "critical hit". No visible hint while idle.
  var torches = document.querySelectorAll(".torch");
  if (torches.length) {
    var torchLive = document.getElementById("torch-live");
    var activeTorch = null;

    var catchFlare = function (torch) {
      if (torch.classList.contains("is-snuffed")) return;
      if (torch !== activeTorch) {
        if (torchLive) torchLive.textContent = "Nothing happens. Yet.";
        return;
      }
      activeTorch = null;
      torch.classList.remove("is-flaring");
      torch.classList.add("is-caught");
      if (torchLive) torchLive.textContent = "The flame roars up around your touch, a flicker of luck!";
      confettiBurst(torch);
    };

    // Snuff the torch: press and hold one for a couple of seconds and it
    // gutters out (the flame shrinks while you hold, so there's feedback),
    // darkening that side of the hero until it sputters back to life. A
    // short press is still an ordinary click, so flare-catching is untouched.
    // hero-fx.js reads these same classes to drive the WebGL flame.
    var SNUFF_HOLD_MS = 2000;
    var SNUFFED_MS = 6000;
    var RELIGHT_MS = 1600;
    var heroEl = document.querySelector(".hero");

    var snuff = function (torch) {
      torch.classList.remove("is-snuffing", "is-flaring", "is-caught");
      torch.classList.add("is-snuffed");
      if (activeTorch === torch) activeTorch = null;
      var side = torch.classList.contains("torch--left") ? "left" : "right";
      if (heroEl) heroEl.classList.add("is-dim-" + side);
      if (torchLive) torchLive.textContent = "The torch gutters out. It's suddenly a lot darker in here.";
      setTimeout(function () {
        torch.classList.remove("is-snuffed");
        torch.classList.add("is-relighting");
        if (heroEl) heroEl.classList.remove("is-dim-" + side);
        if (torchLive) torchLive.textContent = "The torch sputters back to life.";
        setTimeout(function () { torch.classList.remove("is-relighting"); }, RELIGHT_MS);
      }, SNUFFED_MS);
    };

    torches.forEach(function (torch) {
      var holdTimer = null;
      var swallowClick = false;
      var cancelHold = function () {
        clearTimeout(holdTimer);
        holdTimer = null;
        torch.classList.remove("is-snuffing");
      };
      torch.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        swallowClick = false; // in case the last snuff's release landed off the torch
        if (torch.classList.contains("is-snuffed") || torch.classList.contains("is-relighting")) return;
        torch.classList.add("is-snuffing");
        holdTimer = setTimeout(function () {
          holdTimer = null;
          swallowClick = true; // the release that follows isn't a flare catch
          snuff(torch);
        }, SNUFF_HOLD_MS);
      });
      torch.addEventListener("pointerup", cancelHold);
      torch.addEventListener("pointerleave", cancelHold);
      torch.addEventListener("pointercancel", cancelHold);
      // long-presses on touchscreens would otherwise pop the context menu
      torch.addEventListener("contextmenu", function (e) {
        if (holdTimer || torch.classList.contains("is-snuffed")) e.preventDefault();
      });

      torch.addEventListener("click", function () {
        if (swallowClick) {
          swallowClick = false;
          return;
        }
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
        // torches are display:none under ~720px; skip flaring one nobody can
        // see, or one that's currently snuffed out
        if (torch.offsetParent === null || torch.classList.contains("is-snuffed") || torch.classList.contains("is-relighting")) {
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

  // Parallax hero: the wall (stonework, window light, torches, and the WebGL
  // banners/flames hung on it) scrolls slower than the title block, for a
  // bit of depth. CSS reads --wall-shift; the sticky header always covers
  // the gap this opens at the hero's top edge. Desktop only, matching where
  // the torches and banners exist at all (hero-fx.js, the 720px breakpoint).
  if (hero && !stillPlease.matches) {
    var WALL_LAG = 0.3; // fraction of scroll distance the wall hangs back
    var wide = window.matchMedia("(min-width: 721px)");
    var wallTicking = false;
    var lastShift = null;
    var updateWall = function () {
      wallTicking = false;
      var shift = wide.matches ? Math.round(Math.min(window.scrollY, hero.offsetHeight) * WALL_LAG) : 0;
      if (shift === lastShift) return;
      lastShift = shift;
      hero.style.setProperty("--wall-shift", shift + "px");
    };
    var queueWall = function () {
      if (wallTicking) return;
      wallTicking = true;
      requestAnimationFrame(updateWall);
    };
    window.addEventListener("scroll", queueWall, { passive: true });
    window.addEventListener("resize", queueWall);
    updateWall();
  }

  // Sticky header shadow on scroll. The shadow itself lives in CSS
  // (.site-header.is-scrolled); this only flips the class, and only when the
  // state actually changes -- writing to the header's style on every scroll
  // tick re-rasterizes its compositing layer (and its backdrop-filter
  // snapshot) dozens of times a second for no reason.
  var header = document.getElementById("site-header");
  if (header) {
    var scrolled = null;
    var onScroll = function () {
      // Split on/off thresholds so trackpad micro-scrolls and momentum
      // settling near the boundary can't strobe the shadow on and off.
      var next = scrolled ? window.scrollY > 4 : window.scrollY > 12;
      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle("is-scrolled", next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
