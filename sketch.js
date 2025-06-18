// Version with Progressive Difficulty: June 18, 2025
// Stuey's Seagull Son

// Game objects
let player;
let obstacles = [];
let powerups = [];

// Game state & score
let score = 0;
let highScore = 0;
let gameState = 'start';
let gameOverSoundPlayed = false;
let gameSpeed; // New variable to control the overall speed

// Assets
let bgMusic, jumpSound, squawkSound, pointSound;
let bgLayers = [];

function preload() {
  soundFormats('mp3');
  bgMusic = loadSound('background.mp3');
  jumpSound = loadSound('jump.mp3');
  pointSound = loadSound('point.mp3');
  squawkSound = loadSound('squawk.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  highScore = getItem('seagullHighScore') || 0;
  resetGame(); // Call resetGame to initialize all variables
  player = new Player(); // Player is created once
  
  bgLayers.push(new BackgroundLayer(0.2, height / 2, 5, 20, 200, 7));
  bgLayers.push(new BackgroundLayer(0.5, height / 2 - 50, 10, 30, 150, 5));
}

function draw() {
  background(135, 206, 250);
  for (let layer of bgLayers) {
    layer.update();
    layer.display();
  }

  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    runGame();
  } else if (gameState === 'gameOver') {
    if (!gameOverSoundPlayed) {
      if (squawkSound.isLoaded()) { squawkSound.play(); }
      bgMusic.stop();
      gameOverSoundPlayed = true;
    }
    drawGameOverScreen();
  }
}

function runGame() {
  // --- This is the new progressive difficulty logic ---
  gameSpeed += 0.0015; // Slowly increase the speed each frame

  player.update();
  player.display();

  if (frameCount % 100 === 0) {
    obstacles.push(new Obstacle());
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();
    if (obstacles[i].hits(player)) {
      endGame();
    }
    if (obstacles[i].offscreen()) {
      obstacles.splice(i, 1);
      score++;
    }
  }

  if (frameCount % 180 === 0) {
    powerups.push(new PowerUp());
  }
  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].update();
    powerups[i].display();
    if (powerups[i].hits(player)) {
      score += 5;
      if (pointSound.isLoaded()) { pointSound.play(); }
      powerups.splice(i, 1);
    } else if (powerups[i].offscreen()) {
      powerups.splice(i, 1);
    }
  }
  drawScore();
}

function endGame() {
  gameState = 'gameOver';
  if (score > highScore) {
    highScore = score;
    storeItem('seagullHighScore', highScore);
  }
}

function handleInput() {
  if (getAudioContext().state !== 'running') { getAudioContext().resume(); }
  if (gameState === 'playing') {
    player.jump();
  } else if (gameState === 'start' || gameState === 'gameOver') {
    resetGame();
  }
}

function keyPressed() { if (key === ' ') { handleInput(); } }
function touchStarted() { handleInput(); return false; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function resetGame() {
  // --- This is where the initial speed is set ---
  gameSpeed = 3.5; // Starts slower than the previous '5'

  if (bgMusic.isLoaded() && !bgMusic.isPlaying()) { bgMusic.loop(); }
  obstacles = [];
  powerups = [];
  score = 0;
  gameOverSoundPlayed = false;
  player.y = height / 2; // Reset player position
  player.velocity = 0;
  gameState = 'playing';
}

function drawStartScreen() { textAlign(CENTER, CENTER); fill(0); textSize(40); text("Stuey's Seagull Son", width / 2, height / 3); textSize(20); text("Tap screen to Start", width / 2, height / 2); textSize(16); text(`High Score: ${highScore}`, width / 2, height / 2 + 40); }
function drawGameOverScreen() { textAlign(CENTER, CENTER); fill(255, 0, 0); textSize(50); text('GAME OVER', width / 2, height / 3); fill(0); textSize(24); text(`Score: ${score}`, width / 2, height / 2); textSize(20); text(`High Score: ${highScore}`, width / 2, height / 2 + 40); textSize(16); text('Tap screen to play again', width / 2, height / 2 + 80); }
function drawScore() { textAlign(LEFT, TOP); fill(0); textSize(24); text(`Score: ${score}`, 20, 20); textAlign(RIGHT, TOP); text(`High Score: ${highScore}`, width - 20, 20); }

function drawSeagull(x, y, size) { push(); translate(x, y - size / 2); noStroke(); fill(220); rect(10, 10, 20, 10); rect(30, 5, 10, 10); fill(255, 200, 0); rect(40, 8, 5, 4); fill(0); rect(32, 7, 2, 2); fill(200); if (floor(frameCount / 10) % 2 === 0) { rect(5, 0, 15, 8); } else { rect(5, 12, 15, 8); } pop(); }
function drawChimney(x, y, w, h) { push(); fill(139, 69, 19); rect(x, y, w, h); fill(105, 105, 105); rect(x, y, w, 10); pop(); }
function drawCrab(x, y, w, h) { push(); translate(x, y); noStroke(); fill(255, 69, 0); ellipse(w / 2, h * 0.6, w * 0.8, h * 0.7); fill(0); ellipse(w * 0.4, h * 0.4, 5, 5); ellipse(w * 0.6, h * 0.4, 5, 5); fill(255, 69, 0); rect(w * 0.1, h * 0.3, 5, 10); rect(w * 0.8, h * 0.3, 5, 10); pop(); }
function drawFry(x, y, w, h) { push(); translate(x, y); noStroke(); fill(255, 223, 0); for (let i = 0; i < 5; i++) { rect(i * 5, 5 + sin(frameCount * 0.1 + i) * 3, 4, h - 10); } pop(); }

class Player {
  constructor() {
    this.x = width / 4; this.y = height / 2;
    this.gravity = 0.55; // Slightly reduced gravity for more 'floaty' control
    this.lift = -14;
    this.velocity = 0; this.size = 30;
  }
  jump() { this.velocity += this.lift; if (jumpSound.isLoaded()) { jumpSound.play(); } }
  update() { this.velocity += this.gravity; this.y += this.velocity; this.y = constrain(this.y, 0, height); }
  display() { drawSeagull(this.x, this.y, this.size); }
}

class Obstacle {
  constructor() {
    this.x = width; this.w = 60;
    this.speed = gameSpeed; // Uses the global gameSpeed
    this.type = random() > 0.4 ? 'chimney' : 'crab';
    if (this.type === 'chimney') { let gap = height / 3.5; this.top = random(50, height - 50 - gap); this.bottom = height - this.top - gap; } else { this.h = 30; this.w = 40; this.y = random() > 0.5 ? 0 : height - this.h; }
  }
  hits(player) {
    const playerX = player.x; const playerY = player.y - player.size / 2; const playerW = player.size; const playerH = player.size;
    if (this.type === 'chimney') {
      if (playerX + playerW > this.x && playerX < this.x + this.w && playerY < this.top) return true;
      if (playerX + playerW > this.x && playerX < this.x + this.w && playerY + playerH > height - this.bottom) return true;
    } else {
      if (playerX + playerW > this.x && playerX < this.x + this.w && playerY + playerH > this.y && playerY < this.y + this.h) return true;
    }
    return false;
  }
  update() { this.x -= this.speed; }
  display() {
    if (this.type === 'chimney') {
      drawChimney(this.x, 0, this.w, this.top);
      drawChimney(this.x, height - this.bottom, this.w, this.bottom);
    } else {
      drawCrab(this.x, this.y, this.w, this.h);
    }
  }
  offscreen() { return this.x < -this.w; }
}

class PowerUp {
  constructor() {
    this.x = width; this.w = 25; this.h = 35;
    this.speed = gameSpeed; // Uses the global gameSpeed
    this.y = random(height * 0.2, height * 0.8);
  }
  hits(player) {
    let playerX = player.x; let playerY = player.y - player.size / 2; let playerSize = player.size;
    if (playerX < this.x + this.w && playerX + playerSize > this.x && playerY < this.y + this.h && playerY + playerSize > this.y) return true;
    return false;
  }
  update() { this.x -= this.speed; }
  display() { drawFry(this.x, this.y, this.w, this.h); }
  offscreen() { return this.x < -this.w; }
}

class BackgroundLayer {
  constructor(speed, y, size, alpha, col, numElements) {
    this.baseSpeed = speed; this.y = y; this.elements = [];
    for (let i = 0; i < numElements; i++) { this.elements.push({x: random(width * 2), y: this.y + random(-40, 40), size: random(size * 0.8, size * 1.2), color: color(col, alpha)}); }
  }
  update() { for (let el of this.elements) { el.x -= this.baseSpeed * gameSpeed; if (el.x < -el.size) { el.x = width + random(el.size); } } }
  display() { noStroke(); for (let el of this.elements) { fill(el.color); ellipse(el.x, el.y, el.size * 2, el.size * 1.4); } }
}