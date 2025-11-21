console.log("🔥 chicken chucky");
window.addEventListener("load", () => {
    const canvas = document.getElementById("az-reveal-canvas");
    const ctx = canvas.getContext("2d");
    const newLogoImg = document.getElementById("az-new-logo");
  
    const oldLogoImg = new Image();
    oldLogoImg.src = "./assets/old-logo.jpg";
  
    // Lava-lamp trail settings - CHANGE HERE 
    const BRUSH_RADIUS = 110;   // base size of the blob head
    const STEP_DIVISOR = 3;     // the smaller the number the smoother/densers trail
    const MAX_BLOBS = 300;       // how long the tail is (in segments)
  
    let blobs = [];
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

// NOTE!!!: controls post-draw disappearance
let fadingOut = false;
const FADE_SPEED = 3; // blobs removed per frame (1 = ~1 second to fully vanish)

  
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
      
        // stop fading when user starts drawing again
        fadingOut = false;
      
        const pos = getCanvasPos(evt);
        lastX = pos.x;
        lastY = pos.y;
        addBlob(pos.x, pos.y);
      }
      
      function stopDraw(evt) {
        evt && evt.preventDefault();
        drawing = false;
      
        //  begin fading the whole trail when user stops
        fadingOut = true;
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
      
          // Head thick, tail thin – all pretty opaque
          const r = BRUSH_RADIUS * (0.25 + 0.75 * t); // tail ~25% size, head ~100%
          const alphaCenter = 0.95; // almost solid everywhere
      
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
      
        // Clear, redraw old logo, then apply our “ink erasing”
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFullOldLogo();
        drawBlobs();
      
        // After the user stops drawing, gradually remove blobs
        if (fadingOut && blobs.length > 0) {
          for (let i = 0; i < FADE_SPEED && blobs.length > 0; i++) {
            blobs.shift(); // remove from the tail
          }
        }
      
        // When trail is completely gone, stop fading
        if (fadingOut && blobs.length === 0) {
          fadingOut = false;
        }
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
  