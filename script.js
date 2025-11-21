window.addEventListener("load", () => {
    const canvas = document.getElementById("az-reveal-canvas");
    const ctx = canvas.getContext("2d");
    const newLogoImg = document.getElementById("az-new-logo");
  
    const oldLogoImg = new Image();
    oldLogoImg.src = "./assets/old-logo.jpg";
  
    // Lava-lamp trail settings
    const BRUSH_RADIUS = 160;   // base size of the head
    const STEP_DIVISOR = 6;     // smaller = smoother/densers trail
    const MAX_BLOBS = 40;       // how long the tail is (in segments)
  
    let blobs = [];
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
  
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
      blobs.push({ x, y });
      if (blobs.length > MAX_BLOBS) {
        blobs.shift(); // drop the oldest -> tail disappears
      }
    }
  
    function startDraw(evt) {
      evt.preventDefault();
      drawing = true;
      const pos = getCanvasPos(evt);
      lastX = pos.x;
      lastY = pos.y;
      addBlob(pos.x, pos.y);
    }
  
    function stopDraw(evt) {
      evt && evt.preventDefault();
      drawing = false;
    }
  
    function moveDraw(evt) {
      if (!drawing) return;
      evt.preventDefault();
  
      const pos = getCanvasPos(evt);
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
  
      const total = blobs.length;
  
      blobs.forEach((blob, index) => {
        // t: 0 (tail) → 1 (head)
        const t = (index + 1) / total;
  
        // Head is thick & strong, tail is thin & faint
        const r = BRUSH_RADIUS * (0.3 + 0.7 * t);
        const alphaCenter = t; // tail low alpha, head high alpha
  
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, r
        );
  
        gradient.addColorStop(0.0, `rgba(0,0,0,${alphaCenter})`);
        gradient.addColorStop(0.4, `rgba(0,0,0,${alphaCenter * 0.9})`);
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
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFullOldLogo();
      drawBlobs();
    }
  
    function attachEvents() {
      // Mouse
      canvas.addEventListener("mousedown", startDraw);
      window.addEventListener("mouseup", stopDraw);
      canvas.addEventListener("mousemove", moveDraw);
  
      // Touch
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
  