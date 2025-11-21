console.log("🔥 chicken chucky");
window.addEventListener("load", () => {
  const canvas = document.getElementById("az-reveal-canvas");
  const ctx = canvas.getContext("2d");
  const newLogoImg = document.getElementById("az-new-logo");

  const oldLogoImg = new Image();
  oldLogoImg.src = "./assets/old-logo.jpg";

  // Lava-lamp trail settings
  const STEP_DIVISOR = 3;      // the smaller the number the smoother/denser trail
  const MAX_BLOBS = 300;       // how long the tail is (in segments)
  const BLOB_LIFETIME = 150;    // frames (~1 second at 60fps)

  let blobs = [];
  let drawing = false;         // for mouse: "have we started a stroke?"
  let lastX = 0;
  let lastY = 0;

  let fadingOut = false;       // currently unused, but harmless
  const FADE_SPEED = 3;        // currently unused

  // Responsive brush radius based on screen width
  function getBrushRadius() {
    // Blob size = 8% of screen width, but never smaller than 50px
    return Math.max(50, window.innerWidth * 0.08);
  }

  let BRUSH_RADIUS = getBrushRadius();

  window.addEventListener("resize", () => {
    BRUSH_RADIUS = getBrushRadius();
    resizeCanvas();
  });

  function resizeCanvas() {
    const rect = newLogoImg.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
  }

  function drawFullOldLogo() {
    if (!oldLogoImg.complete || !canvas.width || !canvas.height) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(oldLogoImg, 0, 0, canvas.width, canvas.height);
  }

  function getCanvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (evt.touches && evt.touches.length > 0) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  function addBlob(x, y) {
    blobs.push({ x, y, age: 0 }); // track age for lifetime-based thinning

    // Safety cap so array never explodes
    if (blobs.length > MAX_BLOBS) {
      blobs.shift();
    }
  }

  // TOUCH: still uses start/stop
  function startDraw(evt) {
    evt.preventDefault();
    drawing = true;

    // stop fading when user starts drawing again (if you ever re-use fadingOut)
    fadingOut = false;

    const pos = getCanvasPos(evt);
    lastX = pos.x;
    lastY = pos.y;
    addBlob(pos.x, pos.y);
  }

  function stopDraw(evt) {
    evt && evt.preventDefault();
    drawing = false;

    // if you ever re-use fade logic, this is where you'd flip it on
    // fadingOut = true;
  }

  // MOUSE + TOUCH MOVE: hover for mouse, drag for touch
  function moveDraw(evt) {
    evt.preventDefault();

    const pos = getCanvasPos(evt);

    // For mouse hover: if we haven't "started" yet, start on first move
    if (evt.type === "mousemove" && !drawing) {
      drawing = true;
      lastX = pos.x;
      lastY = pos.y;
      addBlob(pos.x, pos.y);
      return;
    }

    // For touch, respect startDraw/stopDraw
    if (!drawing) return;

    const dx = pos.x - lastX;
    const dy = pos.y - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(distance / STEP_DIVISOR));

    for (let i = 0; i <= steps; i++) {
      const t = i / (steps || 1);
      const x = lastX + dx * t;
      const y = lastY + dy * t;
      addBlob(x, y);
    }

    lastX = pos.x;
    lastY = pos.y;
  }

  function drawBlobs() {
    if (blobs.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    blobs.forEach((blob) => {
      // Age 0 → fresh (t = 1), age near BLOB_LIFETIME → old (t ~ 0)
      let t = 1 - blob.age / BLOB_LIFETIME;
      if (t < 0) t = 0;
      if (t > 1) t = 1;

      // Head (young) is thick, old segments are thin
      const r = BRUSH_RADIUS * (0.2 + 0.8 * t); // tweak 0.2 for how skinny old bits get
      const alphaCenter = 0.95; // keep pretty solid

      const gradient = ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, r
      );

      gradient.addColorStop(0.0, `rgba(0,0,0,${alphaCenter})`);
      gradient.addColorStop(0.5, `rgba(0,0,0,${alphaCenter})`);
      gradient.addColorStop(1.0, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!canvas.width || !canvas.height || !oldLogoImg.complete) return;

    // Update ages + remove “dead” blobs
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i];
      b.age += 1;
      if (b.age > BLOB_LIFETIME) {
        blobs.splice(i, 1);
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFullOldLogo();
    drawBlobs();
  }

  function attachEvents() {
    // ✨ HOVER ON DESKTOP
    canvas.addEventListener("mousemove", moveDraw);
    canvas.addEventListener("mouseleave", () => {
      drawing = false; // reset between hovers
    });

    // ✨ TOUCH ON MOBILE
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    window.addEventListener("touchend", stopDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });

    window.addEventListener("resize", resizeCanvas);
  }

  function init() {
    resizeCanvas();
    attachEvents();
    requestAnimationFrame(animate);
  }

  if (oldLogoImg.complete) {
    init();
  } else {
    oldLogoImg.onload = init;
  }
});
