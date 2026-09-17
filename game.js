const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const titleScreen = document.getElementById('title-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Resize canvas
function resize() {
  const container = document.getElementById('game-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Game state
let gameState = 'title'; // title | playing | gameover
let score = 0;
let highScore = localStorage.getItem('krishnacharya_high') || 0;
let frame = 0;
let speed = 5;

// Player
const player = {
  x: 100,
  y: 0,
  width: 40,
  height: 40,
  vy: 0,
  gravity: 0.7,
  jumpForce: -14,
  grounded: false
};

// Ground
const groundY = () => canvas.height - 60;

// Obstacles & Coins
let obstacles = [];
let coins = [];
let nextObstacle = 0;
let nextCoin = 0;

// Input
let jumpPressed = false;

function jump() {
  if (gameState === 'playing' && player.grounded) {
    player.vy = player.jumpForce;
    player.grounded = false;
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === 'title') startGame();
    else if (gameState === 'gameover') restartGame();
    else jump();
  }
});

canvas.addEventListener('click', () => {
  if (gameState === 'playing') jump();
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (gameState === 'playing') jump();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

function startGame() {
  gameState = 'playing';
  titleScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  resetGame();
  requestAnimationFrame(loop);
}

function restartGame() {
  startGame();
}

function resetGame() {
  score = 0;
  frame = 0;
  speed = 5;
  obstacles = [];
  coins = [];
  nextObstacle = 80;
  nextCoin = 120;
  player.y = groundY() - player.height;
  player.vy = 0;
  player.grounded = true;
  updateScore();
}

function updateScore() {
  scoreEl.textContent = `Score: ${Math.floor(score)}`;
}

function spawnObstacle() {
  const height = 40 + Math.random() * 50;
  obstacles.push({
    x: canvas.width + 20,
    y: groundY() - height,
    width: 35 + Math.random() * 20,
    height: height
  });
}

function spawnCoin() {
  coins.push({
    x: canvas.width + 20,
    y: groundY() - 80 - Math.random() * 100,
    radius: 12,
    collected: false
  });
}

function update() {
  if (gameState !== 'playing') return;

  frame++;
  score += 0.1;
  if (frame % 300 === 0) speed += 0.4;

  // Player physics
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.height >= groundY()) {
    player.y = groundY() - player.height;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  // Spawn
  nextObstacle--;
  if (nextObstacle <= 0) {
    spawnObstacle();
    nextObstacle = 70 + Math.random() * 90 - Math.min(speed * 3, 40);
  }

  nextCoin--;
  if (nextCoin <= 0) {
    spawnCoin();
    nextCoin = 100 + Math.random() * 80;
  }

  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      continue;
    }
    // Collision
    if (
      player.x < obstacles[i].x + obstacles[i].width &&
      player.x + player.width > obstacles[i].x &&
      player.y < obstacles[i].y + obstacles[i].height &&
      player.y + player.height > obstacles[i].y
    ) {
      gameOver();
      return;
    }
  }

  // Move & collect coins
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= speed;
    if (coins[i].x + coins[i].radius < 0) {
      coins.splice(i, 1);
      continue;
    }
    // Collect
    const dx = player.x + player.width / 2 - coins[i].x;
    const dy = player.y + player.height / 2 - coins[i].y;
    if (Math.sqrt(dx * dx + dy * dy) < player.width / 2 + coins[i].radius) {
      score += 25;
      coins.splice(i, 1);
    }
  }

  updateScore();
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = '#1a1a3e';
  ctx.fillRect(0, groundY(), canvas.width, canvas.height - groundY());
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(0, groundY(), canvas.width, 4);

  // Stars (background)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + frame * 0.3) % canvas.width;
    const y = (i * 53) % (groundY() - 20);
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  ctx.fillStyle = '#00f5ff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 15;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(player.x + 8, player.y + 10, 8, 8);
  ctx.fillRect(player.x + 24, player.y + 10, 8, 8);

  // Obstacles
  ctx.fillStyle = '#ff3366';
  ctx.shadowColor = '#ff3366';
  ctx.shadowBlur = 10;
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });
  ctx.shadowBlur = 0;

  // Coins
  coins.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8a0';
    ctx.beginPath();
    ctx.arc(c.x - 3, c.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function gameOver() {
  gameState = 'gameover';
  hud.classList.add('hidden');
  gameoverScreen.classList.remove('hidden');
  finalScoreEl.textContent = `Score: ${Math.floor(score)}`;
  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('krishnacharya_high', highScore);
  }
}

function loop() {
  update();
  draw();
  if (gameState === 'playing') {
    requestAnimationFrame(loop);
  }
}

// Initial draw for title screen background
draw();
