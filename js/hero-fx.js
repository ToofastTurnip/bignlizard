// Hero WebGL flourishes: two flowing crimson-and-gold banners flanking the
// title, and a lit wrought-iron torch sconce + real particle flame standing
// in for each flat SVG torch. Everything here is progressive enhancement —
// the hand-drawn SVG torch stays in the markup and stays fully functional
// (including the "catch the flare" easter egg in main.js, and the click/
// keyboard hitbox) whether or not this file runs at all. We only hide the
// SVG's visuals, and only after WebGL has actually started rendering their
// replacement.
(async function () {
  var MOBILE_BREAKPOINT = 720; // matches the .torch { display: none } breakpoint in styles.css

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth <= MOBILE_BREAKPOINT) return;

  var hero = document.querySelector(".hero");
  var torchLeftEl = document.querySelector(".torch--left");
  var torchRightEl = document.querySelector(".torch--right");
  var torchLeftSvg = torchLeftEl && torchLeftEl.querySelector(".torch-svg");
  var torchRightSvg = torchRightEl && torchRightEl.querySelector(".torch-svg");
  if (!hero || !torchLeftSvg || !torchRightSvg) return;

  // Deferred until we know we'll actually use it: this is a ~670KB/~165KB
  // gzipped library, not worth fetching for visitors the checks above
  // already ruled out (mobile, reduced-motion, or an unsupported browser).
  var THREE = await import("./vendor/three.module.min.js");

  var canvas = document.createElement("canvas");
  canvas.className = "hero-fx-canvas";

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power"
    });
  } catch (e) {
    return; // no WebGL: leave the SVG torches exactly as they were
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  hero.appendChild(canvas);

  var scene = new THREE.Scene();
  // Standard three.js orientation (+Y up) — a flipped-Y camera (top < bottom)
  // would let world coordinates read like CSS pixels directly, but it makes
  // THREE.Sprite disappear (a culling quirk with the reversed frustum), so
  // instead the one cssToWorldY() helper below does that conversion by hand
  // wherever a position is measured off the DOM.
  var camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);
  camera.position.z = 10;

  var heroW = 1, heroH = 1;
  function cssToWorldY(cssY) {
    return heroH - cssY;
  }
  function resize() {
    var rect = hero.getBoundingClientRect();
    heroW = Math.max(1, rect.width);
    heroH = Math.max(1, rect.height);
    renderer.setSize(heroW, heroH, false);
    camera.left = 0;
    camera.right = heroW;
    camera.top = heroH;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------------
  // Banners: a plane with a hand-drawn crimson/gold texture (swallow-tail
  // silhouette baked into the texture's alpha channel), rippled per-frame
  // by displacing its vertices — no amplitude at the top (it's "nailed" to
  // the wall) growing to full flutter at the free bottom edge.
  // ---------------------------------------------------------------------
  var BANNER_W = 74;
  var BANNER_H = 290;

  // Emblem art: hand-supplied SVGs (assets/emblem-*.svg), drawn onto the
  // gold diamond once each loads. Loading is async, but same-origin local
  // SVGs decode almost instantly, so in practice the diamond never shows
  // empty for more than a frame or two.
  var EMBLEM_SRC = {
    helmet: "assets/emblem-viking-hat.svg",
    coconut: "assets/emblem-coconut.svg"
  };

  function drawEmblemImage(src, cx, cy, maxDim, ctx, tex, xStretch) {
    var img = new Image();
    img.onload = function () {
      var scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
      var dw = img.naturalWidth * scale * xStretch;
      var dh = img.naturalHeight * scale;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      tex.needsUpdate = true;
    };
    img.src = src;
  }

  function makeBannerTexture(emblem) {
    var w = 256, h = 512;
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");

    var bodyBottom = h * 0.8;
    var tailDepth = h * 0.16;

    // This texture canvas isn't the same aspect ratio as the plane it gets
    // mapped onto (a deliberate choice for the swallow-tail proportions),
    // which quietly squishes everything drawn on it ~2x horizontally. A
    // border or stripe doesn't show that; a recognizable emblem does — so
    // the diamond and the emblem art are pre-widened by the inverse of it.
    var emblemXStretch = (w / h) / (BANNER_W / BANNER_H);

    var outline = function () {
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(w - 2, 2);
      ctx.lineTo(w - 2, bodyBottom);
      ctx.lineTo(w * 0.63, bodyBottom + tailDepth * 0.92);
      ctx.lineTo(w * 0.5, bodyBottom - tailDepth * 0.4);
      ctx.lineTo(w * 0.37, bodyBottom + tailDepth * 0.92);
      ctx.lineTo(2, bodyBottom);
      ctx.closePath();
    };

    outline();
    ctx.save();
    ctx.clip();

    // deep silk crimson, darker than the earlier brick-red, with a subtle
    // sheen band rather than a flat gradient
    var grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#5c0a0a");
    grad.addColorStop(0.32, "#7a1414");
    grad.addColorStop(0.55, "#4e0808");
    grad.addColorStop(1, "#340404");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // faint woven-fabric striping
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#000";
    for (var y = 0; y < h; y += 5) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;

    // antique-gold double trim (dark brassy shadow tone, not bright yellow-gold)
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 9;
    ctx.strokeRect(8, 8, w - 16, bodyBottom - 4);
    ctx.strokeStyle = "#8a6a1f";
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, w - 36, bodyBottom - 24);

    // gold diamond backing the emblem
    ctx.save();
    ctx.translate(w / 2, h * 0.32);
    ctx.scale(emblemXStretch, 1);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(-24, -24, 48, 48);
    ctx.restore();

    ctx.restore(); // drop the clip

    // gold edge trim along the swallow-tail silhouette itself
    outline();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#c9a227";
    ctx.stroke();

    var tex = new THREE.CanvasTexture(c);
    // Without this, three.js's color management treats the canvas's sRGB hex
    // values as already-linear and re-encodes them on output, which is why
    // the crimson/gold were washing out lighter than the hex codes above.
    tex.colorSpace = THREE.SRGBColorSpace;

    // the black emblem (a Viking helmet or a coconut, per-banner) sits on
    // top of the diamond once its SVG loads
    var src = EMBLEM_SRC[emblem];
    if (src) drawEmblemImage(src, w / 2, h * 0.32, 30, ctx, tex, emblemXStretch);

    return tex;
  }

  var bannerTextureLeft = makeBannerTexture("helmet");
  var bannerTextureRight = makeBannerTexture("coconut");

  function makeBanner(texture) {
    var geo = new THREE.PlaneGeometry(BANNER_W, BANNER_H, 6, 22);
    // Shift local Y from three.js's default [-h/2, h/2] to [-h, 0] so the
    // row at y=0 (top, the attachment edge) lines up with mesh.position,
    // and the free edge hangs toward -Y (down, in this +Y-up scene).
    geo.translate(0, -BANNER_H / 2, 0);
    var mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.base = mesh.geometry.attributes.position.array.slice();
    mesh.userData.seed = Math.random() * Math.PI * 2;
    return mesh;
  }

  var bannerLeft = makeBanner(bannerTextureLeft);
  var bannerRight = makeBanner(bannerTextureRight);
  scene.add(bannerLeft, bannerRight);

  function layoutBanners() {
    // Scale the whole banner (geometry + its wave amplitude, which is
    // authored in local units) up from its BANNER_H design size so it runs
    // from the very top of the hero to just above the bottom, whatever the
    // hero's actual height is.
    var topMargin = 0;
    var bottomMargin = Math.max(16, heroH * 0.05);
    var scale = (heroH - topMargin - bottomMargin) / BANNER_H;
    var topY = cssToWorldY(topMargin);
    bannerLeft.scale.setScalar(scale);
    bannerRight.scale.setScalar(scale);
    bannerLeft.position.set(heroW * 0.08, topY, -40);
    bannerRight.position.set(heroW * 0.92, topY, -40);
  }

  function updateBanner(mesh, t) {
    var pos = mesh.geometry.attributes.position;
    var arr = pos.array;
    var base = mesh.userData.base;
    var seed = mesh.userData.seed;
    for (var i = 0; i < pos.count; i++) {
      var bx = base[i * 3];
      var by = base[i * 3 + 1];
      var bz = base[i * 3 + 2];
      // 0 at the fixed top edge, 1 at the free bottom edge (by runs 0..-H)
      var fromTop = Math.min(1, Math.max(0, -by / BANNER_H));
      var amp = Math.pow(fromTop, 1.7) * 15;
      var wave = Math.sin(t * 1.7 + fromTop * 5.5 + seed) * amp;
      var wave2 = Math.sin(t * 0.85 + fromTop * 2.3 + seed * 1.6) * amp * 0.45;
      arr[i * 3] = bx + (wave + wave2) * 0.3;
      arr[i * 3 + 2] = bz + wave + wave2;
    }
    pos.needsUpdate = true;
  }

  // ---------------------------------------------------------------------
  // Torches: a wrought-iron lantern cage + tapered wood handle + angular
  // wall bracket, built from primitives and lit for real (unlike the flat
  // SVG shapes, these have actual geometry + a warm point light) — plus the
  // same particle flame as before. Reacts to the existing is-flaring/
  // is-caught classes that main.js's "catch the flare" easter egg toggles
  // on the torch element.
  // ---------------------------------------------------------------------
  function makeGlowTexture() {
    var s = 64;
    var c = document.createElement("canvas");
    c.width = c.height = s;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.65)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  var glowTex = makeGlowTexture();

  var HOT = new THREE.Color("#fff2c4");
  var MID = new THREE.Color("#f5a23c");
  var COOL = new THREE.Color("#b5392b");

  // Soft cool fill so the iron isn't pure black in shadow, like the ambient
  // light off a stone wall, plus one fixed "sun" so every part of the
  // sconce shares a consistent light/shadow direction (this is what makes
  // separate pieces read as one connected object instead of floating
  // silhouettes) — each torch additionally gets its own warm flickering
  // PointLight at the flame for the torchlit-metal highlight.
  scene.add(new THREE.HemisphereLight(0xb7c0cc, 0x3a2c1c, 1.6));
  var keyLight = new THREE.DirectionalLight(0xfff1d8, 1.3);
  keyLight.position.set(0, 120, 200);
  scene.add(keyLight, keyLight.target);

  // Lower metalness than a mirror-polished metal would use: at this small
  // an on-screen size, a highly metallic + low-roughness material only
  // shows anything where a light hits it exactly right and reads as flat
  // black everywhere else. This is duller, worn-iron territory, which
  // stays visibly "metal-grey" under plain ambient light too.
  var IRON_MAT = new THREE.MeshStandardMaterial({ color: 0x46424a, metalness: 0.35, roughness: 0.55 });
  var WOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x4a2c18, metalness: 0.0, roughness: 0.85 });

  // All of a sconce's parts are authored in the SAME 100-wide viewBox units
  // the original SVG used (see the .cup/.handle/.bracket-* paths in
  // index.html) so proportions stay consistent, positioned relative to the
  // flame anchor (viewBox y≈74) since the whole group is anchored there.
  function designY(svgY) {
    return 74 - svgY; // +Y (up) for svgY above the anchor, -Y for below it
  }

  function addSconce(group) {
    var cageTop = 28, cageBottom = 76, cageR = 15;
    var cupBottom = 108;
    var shaftBottom = 205;

    // cage: vertical bars + spiked finials, closed off at the bottom by
    // the cup's rim (added below) rather than a second free-floating ring
    var bars = 6;
    for (var i = 0; i < bars; i++) {
      var a = (i / bars) * Math.PI * 2;
      var bx = Math.cos(a) * cageR, bz = Math.sin(a) * cageR;
      var bar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, cageBottom - cageTop, 6), IRON_MAT);
      bar.position.set(bx, designY((cageTop + cageBottom) / 2), bz);
      group.add(bar);

      var spike = new THREE.Mesh(new THREE.ConeGeometry(1.8, 10, 6), IRON_MAT);
      spike.position.set(bx, designY(cageTop) + 5, bz);
      group.add(spike);
    }
    var topRing = new THREE.Mesh(new THREE.TorusGeometry(cageR, 1.3, 6, 16), IRON_MAT);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, designY(cageTop), 0);
    group.add(topRing);

    // solid funnel cup, tapering from the cage's OWN radius (so the bars
    // actually land on its rim instead of hanging past its edge) down to
    // the shaft's — this is the piece that actually holds the cage and
    // feeds into the handle; without it the cage has nothing to rest on
    var cup = new THREE.Mesh(new THREE.CylinderGeometry(cageR, 4.4, cupBottom - cageBottom, 12), IRON_MAT);
    cup.position.set(0, designY((cageBottom + cupBottom) / 2), 0);
    group.add(cup);
    var cupRim = new THREE.Mesh(new THREE.TorusGeometry(cageR, 1.4, 6, 16), IRON_MAT);
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.set(0, designY(cageBottom), 0);
    group.add(cupRim);

    // one continuous tapered wood shaft (no bulge partway down) running
    // from the cup straight to the ferrule, so it reads as a single piece
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 2.6, shaftBottom - cupBottom, 10), WOOD_MAT);
    shaft.position.set(0, designY((cupBottom + shaftBottom) / 2), 0);
    group.add(shaft);

    // a couple of thin iron bands wrapped around the shaft
    [cupBottom + 18, cupBottom + 55].forEach(function (bandY) {
      var band = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.7, 6, 14), IRON_MAT);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, designY(bandY), 0);
      group.add(band);
    });

    // iron ferrule capping the bottom: it bulges out wider than the shaft
    // (a shoulder, then a point below) rather than just continuing the
    // shaft's own taper straight into a spike
    var ferruleR = 6.2;
    var shoulder = new THREE.Mesh(new THREE.CylinderGeometry(2.6, ferruleR, 9, 10), IRON_MAT);
    shoulder.position.set(0, designY(shaftBottom + 4.5), 0);
    group.add(shoulder);
    var point = new THREE.Mesh(new THREE.CylinderGeometry(ferruleR, 0, 15, 10), IRON_MAT);
    point.position.set(0, designY(shaftBottom + 9 + 7.5), 0);
    group.add(point);

    // angular wall-mount bracket plate — a small backing shield peeking out
    // from behind the shaft, not a shape that competes with it
    var pcy = cupBottom + 25;
    var shape = new THREE.Shape();
    shape.moveTo(-9, designY(pcy - 12));
    shape.lineTo(9, designY(pcy - 12));
    shape.lineTo(12, designY(pcy + 4));
    shape.lineTo(0, designY(pcy + 25));
    shape.lineTo(-12, designY(pcy + 4));
    shape.closePath();
    var plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false }), IRON_MAT);
    plate.position.z = -11;
    group.add(plate);

    // a couple of rivets for detail
    [[-7, designY(pcy - 6)], [7, designY(pcy - 6)]].forEach(function (p) {
      var rivet = new THREE.Mesh(new THREE.SphereGeometry(1.3, 6, 6), IRON_MAT);
      rivet.position.set(p[0], p[1], -9);
      group.add(rivet);
    });
  }

  function resetParticle(p, initial) {
    p.age = 0;
    p.life = 0.55 + Math.random() * 0.5;
    p.baseX = (Math.random() - 0.5) * 6;
    p.rise = 30 + Math.random() * 22;
    p.sway = 4 + Math.random() * 6;
    p.seed = Math.random() * Math.PI * 2;
    p.size = 10 + Math.random() * 10;
    if (initial) p.age = Math.random() * p.life;
  }

  function makeTorch(torchEl, svgEl) {
    var group = new THREE.Group();
    addSconce(group);

    var particles = [];
    var count = 32;
    for (var i = 0; i < count; i++) {
      var mat = new THREE.SpriteMaterial({
        map: glowTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
      });
      var sprite = new THREE.Sprite(mat);
      var p = { sprite: sprite };
      resetParticle(p, true);
      particles.push(p);
      group.add(sprite);
    }

    var haloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xff8a3d,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.5
    });
    var halo = new THREE.Sprite(haloMat);
    halo.scale.set(90, 90, 1);
    // The cage (viewBox y 28-76) sits above the flame anchor (y=74, the
    // cup's mouth) — center the glow on the cage's midpoint, not the anchor.
    halo.position.set(0, 22, 0);
    group.add(halo);

    var light = new THREE.PointLight(0xff9648, 1.8, 260, 2);
    light.position.set(0, 6, 40); // toward the camera so it lights the sconce's front faces
    group.add(light);

    group.userData = {
      torchEl: torchEl,
      svgEl: svgEl,
      particles: particles,
      halo: halo,
      light: light,
      flicker: Math.random() * Math.PI * 2,
      flaring: false,
      caughtAt: -1
    };
    return group;
  }

  var torchLeft = makeTorch(torchLeftEl, torchLeftSvg);
  var torchRight = makeTorch(torchRightEl, torchRightSvg);
  scene.add(torchLeft, torchRight);

  // The flame anchor (viewBox y≈74, see designY() above) sits at the mouth
  // of the torch's cup — read straight off the live layout so the whole
  // group tracks the responsive clamp() sizing.
  function anchorTorch(group) {
    var r = group.userData.svgEl.getBoundingClientRect();
    var heroRect = hero.getBoundingClientRect();
    group.position.set(
      r.left - heroRect.left + r.width * 0.5,
      cssToWorldY(r.top - heroRect.top + r.height * 0.336),
      0
    );
    group.scale.setScalar(r.width / 100); // 100 = the viewBox's own width
  }

  function watchTorch(group) {
    var obs = new MutationObserver(function () {
      var ud = group.userData;
      ud.flaring = ud.torchEl.classList.contains("is-flaring");
      var caught = ud.torchEl.classList.contains("is-caught");
      if (caught && ud.caughtAt < 0) ud.caughtAt = performance.now();
      if (!caught) ud.caughtAt = -1;
    });
    obs.observe(group.userData.torchEl, { attributes: true, attributeFilter: ["class"] });
  }
  watchTorch(torchLeft);
  watchTorch(torchRight);

  function updateTorch(group, dt, t) {
    var ud = group.userData;
    anchorTorch(group);

    var flareBoost = ud.flaring ? 1.8 : 1;
    var sinceCaught = ud.caughtAt >= 0 ? (performance.now() - ud.caughtAt) / 1000 : 999;
    var catchBoost = sinceCaught < 0.7 ? 1 + (0.7 - sinceCaught) * 2.6 : 1;
    var intensity = flareBoost * catchBoost;

    ud.halo.material.opacity = 0.42 * intensity;
    ud.halo.scale.setScalar(88 * (0.92 + 0.08 * Math.sin(t * 2)) * Math.min(intensity, 1.6));
    ud.light.intensity = 1.8 * intensity * (0.85 + 0.15 * Math.sin(t * 9 + ud.flicker));

    for (var i = 0; i < ud.particles.length; i++) {
      var p = ud.particles[i];
      p.age += dt * (0.8 + 0.45 * flareBoost);
      if (p.age >= p.life) resetParticle(p, false);
      var f = p.age / p.life;
      var y = p.rise * f; // +Y = upward, this scene is standard three.js orientation
      var x = p.baseX + Math.sin(t * 2 + p.seed) * p.sway * f;
      p.sprite.position.set(x, y, (i % 2 === 0 ? 1 : -1) * (i * 0.01));
      var scale = p.size * (0.5 + 0.5 * Math.sin(Math.min(f, 1) * Math.PI)) * intensity;
      p.sprite.scale.set(scale, scale, 1);
      var col = f < 0.4 ? HOT.clone().lerp(MID, f / 0.4) : MID.clone().lerp(COOL, (f - 0.4) / 0.6);
      p.sprite.material.color.copy(col);
      p.sprite.material.opacity = (1 - f) * 0.9;
    }
  }

  // ---------------------------------------------------------------------
  // Loop lifecycle: only render while the hero is on-screen and the tab is
  // visible — this is a decorative flourish, not worth a background WebGL
  // context burning battery once the visitor has scrolled past it.
  // ---------------------------------------------------------------------
  var clock = new THREE.Clock();
  var running = false;
  var rafId = null;

  function frame() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    updateBanner(bannerLeft, t);
    updateBanner(bannerRight, t);
    updateTorch(torchLeft, dt, t);
    updateTorch(torchRight, dt, t);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    clock.start();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();
  layoutBanners();

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      layoutBanners();
    }, 120);
  });

  // requestAnimationFrame is already throttled by the browser while the tab
  // is in the background, so the only case worth handling ourselves is
  // scrolling the hero out of view.
  var heroIntersecting = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        heroIntersecting = entries[0].isIntersecting;
        if (heroIntersecting) start();
        else stop();
      },
      { threshold: 0.01 }
    ).observe(hero);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stop();
    else if (heroIntersecting) start();
  });

  // We only get here once the WebGLRenderer above was created successfully,
  // so it's safe to hide the flat SVG flame/glow/embers/smoke now in favor
  // of their WebGL replacement (which starts rendering within a frame or
  // two, via the IntersectionObserver above).
  hero.classList.add("hero--fx");
})();
