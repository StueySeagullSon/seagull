// Version with Detailed Obstacles: June 18, 2025
// Stuey's Seagull Son

// Game objects
let player;
let obstacles = [];

// Game state & score
let score = 0;
let highScore = 0;
let gameState = 'start';
let gameOverSoundPlayed = false;
let gameSpeed; 

// Assets
let bgMusic, jumpSound, squawkSound; // pointSound removed
let bgLayers = [];

function preload() {
  soundFormats('mp3');
  bgMusic = loadSound('background.mp3');
  jumpSound = loadSound('jump.mp3');
  squawkSound = loadSound('squawk.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  highScore = getItem('seagullHighScore') || 0;
  resetGame(); 
  player = new Player(); 
  
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
  gameSpeed += 0.0015;

  player.update();
  player.display();

  // Handle obstacles (now only pipes)
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
  
  // Power-up logic has been removed
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
  gameSpeed = 3.5; 

  if (bgMusic.isLoaded() && !bgMusic.isPlaying()) { bgMusic.loop(); }
  obstacles = [];
  score = 0;
  gameOverSoundPlayed = false;
  player.y = height / 2;
  player.velocity = 0;
  gameState = 'playing';
}

// --- Drawing UI ---
function drawStartScreen() { textAlign(CENTER, CENTER); fill(0); textSize(40); text("Stuey's Seagull Son", width / 2, height / 3); textSize(20); text("Tap screen to Start", width / 2, height / 2); textSize(16); text(`High Score: ${highScore}`, width / 2, height / 2 + 40); }
function drawGameOverScreen() { textAlign(CENTER, CENTER); fill(255, 0, 0); textSize(50); text('GAME OVER', width / 2, height / 3); fill(0); textSize(24); text(`Score: ${score}`, width / 2, height / 2); textSize(20); text(`High Score: ${highScore}`, width / 2, height / 2 + 40); textSize(16); text('Tap screen to play again', width / 2, height / 2 + 80); }
function drawScore() { textAlign(LEFT, TOP); fill(0); textSize(24); text(`Score: ${score}`, 20, 20); textAlign(RIGHT, TOP); text(`High Score: ${highScore}`, width - 20, 20); }

// --- Direct-drawing functions ---
function drawSeagull(x, y, size) {
  push();
  translate(x, y - size / 2);
  noStroke();
  fill(220); rect(10, 10, 20, 10); rect(30, 5, 10, 10);
  fill(255, 200, 0); rect(40, 8, 5, 4);
  fill(0); rect(32, 7, 2, 2);
  fill(200);
  if (floor(frameCount / 10) % 2 === 0) { rect(5, 0, 15, 8); } else { rect(5, 12, 15, 8); }
  pop();
}

// New detailed drawing function for the pipe obstacles
function drawPipe(x, y, w, h, isTopPipe) {
  push();
  noStroke();
  
  // Main pipe body
  fill(10, 140, 60); // Dark Green
  rect(x, y, w, h);
  
  // Shading and highlight for 3D effect
  fill(0, 80, 20, 80); // Darker shadow
  rect(x, y, w / 2, h);
  fill(120, 220, 150, 80); // Lighter highlight
  rect(x, y, w / 4, h);

  // Pipe rim
  const rimHeight = 20;
  const rimWidth = w + 10;
  const rimX = x - 5;
  
  fill(0, 100, 40); // Dark Green for the rim
  if (isTopPipe) {
    // Rim at the bottom of the top pipe
    let rimY = y + h - rimHeight;
    rect(rimX, rimY, rimWidth, rimHeight);
    fill(0, 80, 20, 120);
    rect(rimX, rimY, rimWidth/2, rimHeight);
  } else {
    // Rim at the top of the bottom pipe
    let rimY = y;
    rect(rimX, rimY, rimWidth, rimHeight);
    fill(0, 80, 20, 120);
    rect(rimX, rimY, rimWidth/2, rimHeight);
  }
  pop();
}

// --- Classes ---
class Player {
  constructor() {
    this.x = width / 4; this.y = height / 2;
    this.gravity = 0.55; 
    this.lift = -14;
    this.velocity = 0; this.size = 30;
  }
  jump() { this.velocity += this.lift; if (jumpSound.isLoaded()) { jumpSound.play(); } }
  update() { this.velocity += this.gravity; this.y += this.velocity; this.y = constrain(this.y, 0, height); }
  display() { drawSeagull(this.x, this.y, this.size); }
}

class Obstacle {
  constructor() {
    this.x = width; this.w = 80; // Made pipes wider
    this.speed = gameSpeed;
    let gap = height / 3; // Made gap slightly larger
    this.top = random(50, height - 50 - gap);
    this.bottom = height - this.top - gap;
  }
  
  hits(player) {
    const playerX = player.x;
    const playerY = player.y - player.size / 2;
    const playerW = player.size;
    const playerH = player.size;

    // Check collision with top pipe
    if (playerX + playerW > this.x && playerX < this.x + this.w && playerY < this.top) {
      return true;
    }
    // Check collision with bottom pipe
    if (playerX + playerW > this.x && playerX < this.x + this.w && playerY + playerH > height - this.bottom) {
      return true;
    }
    return false;
  }
  
  update() { this.x -= this.speed; }
  
  display() {
    // Calls the new detailed drawing function
    drawPipe(this.x, 0, this.w, this.top, true); // Top pipe
    drawPipe(this.x, height - this.bottom, this.w, this.bottom, false); // Bottom pipe
  }
  
  offscreen() { return this.x < -this.w; }
}

// PowerUp class has been removed

class BackgroundLayer {
  constructor(speed, y, size, alpha, col, numElements) {
    this.baseSpeed = speed; this.y = y; this.elements = [];
    for (let i = 0; i < numElements; i++) { this.elements.push({x: random(width * 2), y: this.y + random(-40, 40), size: random(size * 0.8, size * 1.2), color: color(col, alpha)}); }
  }
  update() { for (let el of this.elements) { el.x -= this.baseSpeed * gameSpeed; if (el.x < -el.size) { el.x = width + random(el.size); } } }
  display() { noStroke(); for (let el of this.elements) { fill(el.color); ellipse(el.x, el.y, el.size * 2, el.size * 1.4); } }
}