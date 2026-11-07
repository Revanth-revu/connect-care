// src/pages/rain-effect.ts

const canvas = document.getElementById('rain-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// --- Interaction Variables ---
let mouseX = width / 2;
let speedX = 0; // Wind speed factor
const maxSpeedX = 1;

// --- Raindrop Class ---
class Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;

  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * -height; // Start above screen
    this.length = Math.random() * 20 + 10;
    this.speed = Math.random() * 8 + 6;
    this.opacity = Math.random() * 0.5 + 0.2;
  }

  update() {
    // Move down
    this.y += this.speed;
    // Move horizontally based on mouse wind (speedX is between -1 and 1)
    this.x += speedX * this.speed * 0.5;

    // Reset if off screen
    if (this.y > height || this.x < 0 || this.x > width) {
      this.y = Math.random() * -100;
      this.x = Math.random() * width;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    // Draw the raindrop slightly angled based on wind
    ctx.lineTo(this.x + speedX * this.length, this.y + this.length);
    ctx.strokeStyle = `rgba(180, 220, 255, ${this.opacity})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// --- Splash Particle Class ---
class Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, baseVx: number) {
    this.x = x;
    this.y = y;
    // Spread particles outward
    this.vx = baseVx + (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = 1;
    this.maxLife = Math.random() * 0.5 + 0.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.life -= 0.02;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.random() * 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 200, 255, ${this.life})`;
    ctx.fill();
  }
}

const raindrops: Raindrop[] = [];
const splashes: Splash[] = [];
const RAIN_COUNT = 150; // Adjust for heavier/lighter rain

for (let i = 0; i < RAIN_COUNT; i++) {
  raindrops.push(new Raindrop());
}

// --- Mouse Interaction ---
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  // Calculate wind direction based on mouse position relative to screen center
  const targetSpeedX = (mouseX - width / 2) / (width / 2);
  // Smooth the transition
  speedX += (targetSpeedX - speedX) * 0.05;

  // Occasionally create a splash under the mouse to simulate interaction
  if (Math.random() > 0.7) {
    splashes.push(new Splash(mouseX, e.clientY, speedX * 5));
  }
});

// --- Animation Loop ---
function animateRain() {
  ctx.clearRect(0, 0, width, height);

  // Update and draw raindrops
  raindrops.forEach((drop) => {
    drop.update();
    drop.draw();

    // Randomly create splashes at the bottom
    if (drop.y > height - 5 && Math.random() > 0.9) {
      splashes.push(new Splash(drop.x, height, speedX * 5));
    }
  });

  // Update and draw splashes
  for (let i = splashes.length - 1; i >= 0; i--) {
    const splash = splashes[i];
    splash.update();
    splash.draw();

    // Remove dead splashes
    if (splash.life <= 0) {
      splashes.splice(i, 1);
    }
  }

  requestAnimationFrame(animateRain);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// Start the rain
animateRain();