// ============================================================
// Retro Snake Game – Vanilla JS
// ============================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Grid configuration
const GRID_SIZE = 20;                        // 20×20 grid
const TILE = canvas.width / GRID_SIZE;       // pixel size of each tile
const TICK_MS = 100;                         // game speed (ms per step)

// Direction vectors
const DIR = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

// ── UI references ──────────────────────────────────────────
const scoreDisplay    = document.getElementById('score-display');
const highscoreDisplay = document.getElementById('highscore-display');
const startScreen     = document.getElementById('start-screen');
const gameoverScreen  = document.getElementById('gameover-screen');
const finalScoreText  = document.getElementById('final-score');
const startBtn        = document.getElementById('start-btn');
const restartBtn      = document.getElementById('restart-btn');

// ============================================================
// Food
// ============================================================
class Food {
  constructor() {
    this.position = { x: 0, y: 0 };
  }

  /** Spawn at a random tile that isn't occupied by the snake. */
  spawn(snakeBody) {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(seg => seg.x === pos.x && seg.y === pos.y));
    this.position = pos;
  }

  draw() {
    const x = this.position.x * TILE;
    const y = this.position.y * TILE;
    const center = TILE / 2;

    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff0044';
    ctx.beginPath();
    ctx.arc(x + center, y + center, center - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Snake
// ============================================================
class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    const mid = Math.floor(GRID_SIZE / 2);
    this.body = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    this.direction = DIR.RIGHT;
    this.nextDirection = DIR.RIGHT;
    this.growing = false;
  }

  /** Queue a direction change (prevents 180° reversal). */
  setDirection(newDir) {
    if (newDir.x + this.direction.x === 0 &&
        newDir.y + this.direction.y === 0) return;   // ignore reversal
    this.nextDirection = newDir;
  }

  update() {
    this.direction = this.nextDirection;
    const head = {
      x: this.body[0].x + this.direction.x,
      y: this.body[0].y + this.direction.y,
    };
    this.body.unshift(head);
    if (!this.growing) {
      this.body.pop();
    }
    this.growing = false;
  }

  grow() {
    this.growing = true;
  }

  /** Check if head hit a wall. */
  collidesWall() {
    const h = this.body[0];
    return h.x < 0 || h.x >= GRID_SIZE || h.y < 0 || h.y >= GRID_SIZE;
  }

  /** Check if head hit its own body. */
  collidesSelf() {
    const h = this.body[0];
    return this.body.slice(1).some(seg => seg.x === h.x && seg.y === h.y);
  }

  draw() {
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#73ff5e' : '#39ff14';
      ctx.fillRect(
        seg.x * TILE + 1,
        seg.y * TILE + 1,
        TILE - 2,
        TILE - 2
      );
    });
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Enemy Snake (AI-controlled, random movement, wraps around)
// ============================================================
const DIR_LIST = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

class EnemySnake {
  constructor() {
    this.body = [];
    this.direction = DIR.RIGHT;
    this.length = 5;
  }

  /** Spawn in a corner away from the player snake. */
  reset() {
    const start = { x: 3, y: 3 };
    this.direction = DIR.RIGHT;
    this.body = [];
    for (let i = 0; i < this.length; i++) {
      this.body.push({ x: start.x - i, y: start.y });
    }
  }

  update() {
    // Randomly change direction ~25% of the time (no 180° turns)
    if (Math.random() < 0.25) {
      const candidates = DIR_LIST.filter(
        d => !(d.x + this.direction.x === 0 && d.y + this.direction.y === 0)
      );
      this.direction = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const head = {
      x: (this.body[0].x + this.direction.x + GRID_SIZE) % GRID_SIZE,
      y: (this.body[0].y + this.direction.y + GRID_SIZE) % GRID_SIZE,
    };
    this.body.unshift(head);
    while (this.body.length > this.length) this.body.pop();
  }

  draw() {
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#ffaa00' : '#ff6600';
      ctx.fillRect(
        seg.x * TILE + 1,
        seg.y * TILE + 1,
        TILE - 2,
        TILE - 2
      );
    });
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Game
// ============================================================
class Game {
  constructor() {
    this.snake = new Snake();
    this.enemy = new EnemySnake();
    this.food  = new Food();
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    this.running = false;
    this.intervalId = null;

    highscoreDisplay.textContent = `HI: ${this.highScore}`;
    this.bindEvents();
  }

  bindEvents() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
      if (!this.running) return;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': this.snake.setDirection(DIR.UP);    break;
        case 'ArrowDown':  case 's': case 'S': this.snake.setDirection(DIR.DOWN);  break;
        case 'ArrowLeft':  case 'a': case 'A': this.snake.setDirection(DIR.LEFT);  break;
        case 'ArrowRight': case 'd': case 'D': this.snake.setDirection(DIR.RIGHT); break;
      }
    });

    // Buttons
    startBtn.addEventListener('click', () => this.start());
    restartBtn.addEventListener('click', () => this.start());
  }

  start() {
    // Reset state
    this.snake.reset();
    this.enemy.reset();
    this.score = 0;
    this.updateScoreUI();
    this.food.spawn([...this.snake.body, ...this.enemy.body]);

    // Hide overlays
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');

    // Start the loop
    if (this.intervalId) clearInterval(this.intervalId);
    this.running = true;
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    this.snake.update();
    this.enemy.update();

    // Collision checks
    if (this.snake.collidesWall() || this.snake.collidesSelf()) {
      this.gameOver();
      return;
    }

    // Check if player hit the enemy snake
    const head = this.snake.body[0];
    if (this.enemy.body.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.gameOver();
      return;
    }

    // Eating food
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow();
      this.score += 10;
      this.updateScoreUI();
      this.food.spawn([...this.snake.body, ...this.enemy.body]);
    }

    this.render();
  }

  render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE, 0);
      ctx.lineTo(i * TILE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * TILE);
      ctx.lineTo(canvas.width, i * TILE);
      ctx.stroke();
    }

    this.food.draw();
    this.enemy.draw();
    this.snake.draw();
  }

  updateScoreUI() {
    scoreDisplay.textContent = `SCORE: ${this.score}`;
  }

  gameOver() {
    this.running = false;
    clearInterval(this.intervalId);

    // Persist high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore);
      highscoreDisplay.textContent = `HI: ${this.highScore}`;
    }

    // Show game-over overlay
    finalScoreText.textContent = `SCORE: ${this.score}`;
    gameoverScreen.classList.remove('hidden');
  }
}

// ── Boot ────────────────────────────────────────────────────
const game = new Game();
