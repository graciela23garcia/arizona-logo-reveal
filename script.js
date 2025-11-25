console.log("🔥 chicken chucky");
window.addEventListener("load", () => {
  const canvas = document.getElementById("az-reveal-canvas");
  // Optimize canvas context for performance (especially Safari)
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  const newLogoImg = document.getElementById("az-new-logo");

  const oldLogoImg = new Image();
  oldLogoImg.src = "./assets/old-logo.jpg";

  // Detect Safari for performance optimizations
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Lava-lamp trail settings - optimized for performance
  const STEP_DIVISOR =3;      // the smaller the number the smoother/denser trail
  // Safari-specific optimizations (more aggressive for better performance)
  const MAX_BLOBS = isSafari ? 200 : 400;       // Increased for longer tail, Safari still optimized
  const BLOB_LIFETIME = isSafari ? 130 : 180;   // Increased for longer tail, Safari still optimized
  
  // Cache for old logo to avoid redrawing every frame
  let oldLogoCache = null;
  let oldLogoCacheRect = null;

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
3
  window.addEventListener("resize", () => {
    BRUSH_RADIUS = getBrushRadius();
    resizeCanvas();
  });

  function resizeCanvas() {
    // Canvas now covers entire viewport - use window dimensions to match 100vw/100vh
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    // Invalidate cache on resize
    oldLogoCache = null;
    oldLogoCacheRect = null;
  }

  function drawFullOldLogo() {
    if (!oldLogoImg.complete || !canvas.width || !canvas.height) return;
    
    // Get the image's position on screen
    const rect = newLogoImg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;
    const x = rect.left * scaleX;
    const y = rect.top * scaleY;
    const w = rect.width * scaleX;
    const h = rect.height * scaleY;
    
    // Cache the old logo - only redraw if position/size changed
    const currentRect = { x, y, w, h };
    const rectChanged = !oldLogoCacheRect || 
      oldLogoCacheRect.x !== x || oldLogoCacheRect.y !== y || 
      oldLogoCacheRect.w !== w || oldLogoCacheRect.h !== h;
    
    if (rectChanged || !oldLogoCache) {
      // Create or update cache
      if (!oldLogoCache || rectChanged) {
        oldLogoCache = document.createElement('canvas');
        oldLogoCache.width = w;
        oldLogoCache.height = h;
        const cacheCtx = oldLogoCache.getContext('2d');
        cacheCtx.drawImage(oldLogoImg, 0, 0, w, h);
        oldLogoCacheRect = currentRect;
      }
    }
    
    // Draw from cache instead of redrawing image every frame
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(oldLogoCache, x, y, w, h);
  }

  function getCanvasPos(evt) {
    let clientX, clientY;

    if (evt.touches && evt.touches.length > 0) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    // Canvas is fullscreen, so coordinates map directly to canvas pixels
    const x = (clientX / window.innerWidth) * canvas.width;
    const y = (clientY / window.innerHeight) * canvas.height;
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
    
    // Clear all blobs when drawing stops so they disappear
    blobs = [];
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

    // Get image bounds to check if blob overlaps image
    const rect = newLogoImg.getBoundingClientRect();
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;
    const imgX = rect.left * scaleX;
    const imgY = rect.top * scaleY;
    const imgW = rect.width * scaleX;
    const imgH = rect.height * scaleY;

    ctx.save();

    blobs.forEach((blob, index) => {
      // Age 0 → fresh (t = 1), age near BLOB_LIFETIME → old (t ~ 0)
      let t = 1 - blob.age / BLOB_LIFETIME;
      if (t < 0) t = 0;
      if (t > 1) t = 1;

      const alphaCenter = 0.95;

      // Progressive effect: fresh blobs are circles, older blobs extend horizontally
      // Calculate horizontal extension - older blobs become longer horizontal strokes
      const horizontalLength = (1 - t) * BRUSH_RADIUS * 4; // Extends horizontally as it ages
      const verticalWidth = BRUSH_RADIUS * (0.3 + 0.7 * t); // Gets thinner as it extends
      
      // For fresh blobs, use circular shape
      const r = BRUSH_RADIUS * (0.2 + 0.8 * t);
      
      // Determine if blob should be circle or elongated stroke
      const isElongated = t < 0.6; // When t < 0.6, blob becomes elongated

      // Calculate bounds for overlap check
      let blobLeft, blobRight, blobTop, blobBottom;
      if (isElongated) {
        blobLeft = blob.x - horizontalLength / 2;
        blobRight = blob.x + horizontalLength / 2;
        blobTop = blob.y - verticalWidth / 2;
        blobBottom = blob.y + verticalWidth / 2;
      } else {
        blobLeft = blob.x - r;
        blobRight = blob.x + r;
        blobTop = blob.y - r;
        blobBottom = blob.y + r;
      }
      
      const overlapsImage = !(blobRight < imgX || blobLeft > imgX + imgW || 
                             blobBottom < imgY || blobTop > imgY + imgH);

      // Always draw black blob first
      ctx.globalCompositeOperation = "source-over";
      
      if (isElongated) {
        // Draw as horizontal elongated stroke (ink spreading effect)
        const gradient = ctx.createLinearGradient(
          blob.x - horizontalLength / 2, blob.y,
          blob.x + horizontalLength / 2, blob.y
        );
        
        gradient.addColorStop(0.0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.2, `rgba(0,0,0,${alphaCenter})`);
        gradient.addColorStop(0.8, `rgba(0,0,0,${alphaCenter})`);
        gradient.addColorStop(1.0, "rgba(0,0,0,0)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(blob.x - horizontalLength / 2, blob.y - verticalWidth / 2, horizontalLength, verticalWidth);
      } else {
        // Draw as circle for fresh blobs
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, r
        );

        gradient.addColorStop(0.0, `rgba(0,0,0,${alphaCenter})`);
        gradient.addColorStop(0.5, `rgba(0,0,0,${alphaCenter * 0.9})`);
        gradient.addColorStop(1.0, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // If blob overlaps image, also erase the part over the image to reveal new logo
      if (overlapsImage) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1; // Ensure full opacity for complete erase
        
        // Create a clipping path for just the image area
        ctx.beginPath();
        ctx.rect(imgX, imgY, imgW, imgH);
        ctx.clip();
        
        if (isElongated) {
          // Erase elongated stroke - draw solid center first for complete erase
          const solidLength = horizontalLength * 0.85; // 85% solid center
          ctx.fillStyle = "rgba(0,0,0,1)";
          ctx.fillRect(blob.x - solidLength / 2, blob.y - verticalWidth / 2, solidLength, verticalWidth);
          
          // Then gradient edges for smooth transition
          const eraseGradient = ctx.createLinearGradient(
            blob.x - horizontalLength / 2, blob.y,
            blob.x + horizontalLength / 2, blob.y
          );
          
          eraseGradient.addColorStop(0.0, "rgba(0,0,0,0)");
          eraseGradient.addColorStop(0.1, "rgba(0,0,0,1)");
          eraseGradient.addColorStop(0.9, "rgba(0,0,0,1)");
          eraseGradient.addColorStop(1.0, "rgba(0,0,0,0)");
          
          ctx.fillStyle = eraseGradient;
          ctx.fillRect(blob.x - horizontalLength / 2, blob.y - verticalWidth / 2, horizontalLength, verticalWidth);
        } else {
          // Erase circle - draw solid center first for complete erase
          const solidRadius = r * 0.9; // 90% solid center
          ctx.fillStyle = "rgba(0,0,0,1)";
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, solidRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Then gradient edge for smooth transition
          const eraseGradient = ctx.createRadialGradient(
            blob.x, blob.y, solidRadius,
            blob.x, blob.y, r
          );
          
          eraseGradient.addColorStop(0.0, "rgba(0,0,0,1)");
          eraseGradient.addColorStop(1.0, "rgba(0,0,0,0)");
          
          ctx.fillStyle = eraseGradient;
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
    });

    ctx.restore();
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!canvas.width || !canvas.height || !oldLogoImg.complete) return;

    // Update ages + remove "dead" blobs
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i];
      b.age += 1;
      if (b.age > BLOB_LIFETIME) {
        blobs.splice(i, 1);
      }
    }

    // Always clear and redraw to prevent Safari glitches
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFullOldLogo();
    if (blobs.length > 0) {
      drawBlobs();
    }
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