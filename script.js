const canvas = document.getElementById("az-reveal-canvas");
const ctx = canvas.getContext("2d");
const newLogoImg = document.getElementById("az-new-logo");

const oldLogoImg = new Image();
oldLogoImg.src = "./assets/old-logo.jpg";

// This will resize canvas to match new logo size
function resizeCanvas() {
  const rect = newLogoImg.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  drawOldLogo();
}

function drawOldLogo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(oldLogoImg, 0, 0, canvas.width, canvas.height);
}

// This wil ensure images load before drawing
oldLogoImg.onload = () => {
  resizeCanvas();
};

window.addEventListener("resize", resizeCanvas);
