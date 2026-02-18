// ============================================================
// Retro Snake Game – Vanilla JS – 7 Game Modes
// ============================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Grid configuration
const GRID_SIZE = 20;
const TILE = canvas.width / GRID_SIZE;
const BASE_TICK_MS = 100;

// Direction vectors
const DIR = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};
const DIR_LIST = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

// ── UI references ──────────────────────────────────────────
const scoreDisplay     = document.getElementById('score-display');
const highscoreDisplay = document.getElementById('highscore-display');
const timerDisplay     = document.getElementById('timer-display');
const startScreen      = document.getElementById('start-screen');
const gameoverScreen   = document.getElementById('gameover-screen');
const finalScoreText   = document.getElementById('final-score');
const restartBtn       = document.getElementById('restart-btn');
const menuBtn          = document.getElementById('menu-btn');
const modeMenu         = document.getElementById('mode-menu');
const modeItems        = Array.from(modeMenu.querySelectorAll('.mode-item'));

// ============================================================
// Food
// ============================================================
class Food {
  constructor() {
    this.position = { x: 0, y: 0 };
  }

  spawn(occupied) {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (occupied.some(seg => seg.x === pos.x && seg.y === pos.y));
    this.position = pos;
  }

  draw(color = '#ff0044') {
    const x = this.position.x * TILE;
    const y = this.position.y * TILE;
    const center = TILE / 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
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

  setDirection(newDir) {
    if (newDir.x + this.direction.x === 0 &&
        newDir.y + this.direction.y === 0) return;
    this.nextDirection = newDir;
  }

  update(wrapAround = false) {
    this.direction = this.nextDirection;
    let head;
    if (wrapAround) {
      head = {
        x: (this.body[0].x + this.direction.x + GRID_SIZE) % GRID_SIZE,
        y: (this.body[0].y + this.direction.y + GRID_SIZE) % GRID_SIZE,
      };
    } else {
      head = {
        x: this.body[0].x + this.direction.x,
        y: this.body[0].y + this.direction.y,
      };
    }
    this.body.unshift(head);
    if (!this.growing) this.body.pop();
    this.growing = false;
  }

  grow() { this.growing = true; }

  shrink() {
    if (this.body.length > 1) this.body.pop();
  }

  collidesWall() {
    const h = this.body[0];
    return h.x < 0 || h.x >= GRID_SIZE || h.y < 0 || h.y >= GRID_SIZE;
  }

  collidesSelf() {
    const h = this.body[0];
    return this.body.slice(1).some(seg => seg.x === h.x && seg.y === h.y);
  }

  collidesPoint(p) {
    const h = this.body[0];
    return h.x === p.x && h.y === p.y;
  }

  collidesBody(otherBody) {
    const h = this.body[0];
    return otherBody.some(seg => seg.x === h.x && seg.y === h.y);
  }

  draw(headColor = '#73ff5e', bodyColor = '#39ff14', glowColor = '#39ff14') {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? headColor : bodyColor;
      ctx.fillRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
    });
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Enemy Snake (AI-controlled, wraps around)
// ============================================================
class EnemySnake {
  constructor() {
    this.body = [];
    this.direction = DIR.RIGHT;
    this.length = 5;
  }

  reset() {
    const start = { x: 3, y: 3 };
    this.direction = DIR.RIGHT;
    this.body = [];
    for (let i = 0; i < this.length; i++) {
      this.body.push({ x: start.x - i, y: start.y });
    }
  }

  update() {
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
      ctx.fillRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
    });
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Shadow Snake (mirrors player, 180° rotation)
// ============================================================
class ShadowSnake {
  constructor() {
    this.body = [];
  }

  mirror(playerBody) {
    this.body = playerBody.map(seg => ({
      x: GRID_SIZE - 1 - seg.x,
      y: GRID_SIZE - 1 - seg.y,
    }));
  }

  draw() {
    ctx.shadowColor = '#cc00ff';
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#dd66ff' : '#cc00ff';
      ctx.fillRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
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
    this.shadow = new ShadowSnake();
    this.food = new Food();
    this.poison = new Food();
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    this.running = false;
    this.intervalId = null;
    this.currentMode = 'classic';
    this.menuIndex = 0;

    // Speedster
    this.currentTickMs = BASE_TICK_MS;

    // Time Attack
    this.timeLeft = 0;
    this.timerIntervalId = null;

    // Maze
    this.walls = [];

    // Poison
    this.poisonActive = false;

    highscoreDisplay.textContent = `HI: ${this.highScore}`;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      // R key – instant restart at any time
      if (e.key === 'r' || e.key === 'R') {
        if (this.running || !startScreen.classList.contains('hidden')) {
          // Only restart if a game has been started before or is running
          if (!startScreen.classList.contains('hidden')) return;
          this.startMode(this.currentMode);
        } else {
          // On game-over screen
          this.startMode(this.currentMode);
        }
        return;
      }

      // Menu navigation when start screen is visible
      if (!startScreen.classList.contains('hidden')) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          this.navigateMenu(-1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.navigateMenu(1);
        } else if (e.key === 'Enter') {
          this.selectCurrentMenuItem();
        }
        return;
      }

      // In-game direction controls
      if (!this.running) return;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': this.snake.setDirection(DIR.UP);    break;
        case 'ArrowDown':  case 's': case 'S': this.snake.setDirection(DIR.DOWN);  break;
        case 'ArrowLeft':  case 'a': case 'A': this.snake.setDirection(DIR.LEFT);  break;
        case 'ArrowRight': case 'd': case 'D': this.snake.setDirection(DIR.RIGHT); break;
      }
    });

    // Menu click selection
    modeItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        this.menuIndex = idx;
        this.updateMenuHighlight();
        this.selectCurrentMenuItem();
      });
    });

    // Buttons
    restartBtn.addEventListener('click', () => this.startMode(this.currentMode));
    menuBtn.addEventListener('click', () => this.showMenu());
  }

  // ── Menu ───────────────────────────────────────────────────
  navigateMenu(delta) {
    this.menuIndex = (this.menuIndex + delta + modeItems.length) % modeItems.length;
    this.updateMenuHighlight();
  }

  updateMenuHighlight() {
    modeItems.forEach((el, i) => el.classList.toggle('selected', i === this.menuIndex));
  }

  selectCurrentMenuItem() {
    const mode = modeItems[this.menuIndex].dataset.mode;
    this.startMode(mode);
  }

  showMenu() {
    this.stop();
    timerDisplay.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameoverScreen.classList.add('hidden');
  }

  // ── Start / Stop ──────────────────────────────────────────
  stop() {
    this.running = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.timerIntervalId) { clearInterval(this.timerIntervalId); this.timerIntervalId = null; }
  }

  startMode(mode) {
    this.stop();
    this.currentMode = mode;
    this.snake.reset();
    this.score = 0;
    this.currentTickMs = BASE_TICK_MS;
    this.walls = [];
    this.poisonActive = false;
    timerDisplay.classList.add('hidden');

    const occupied = [...this.snake.body];

    // Mode-specific setup
    switch (mode) {
      case 'maze':
        this.generateMazeWalls();
        occupied.push(...this.walls);
        break;
      case 'timeattack':
        this.timeLeft = 10;
        timerDisplay.classList.remove('hidden');
        timerDisplay.textContent = `TIME: ${this.timeLeft.toFixed(1)}`;
        this.timerIntervalId = setInterval(() => {
          this.timeLeft -= 0.1;
          timerDisplay.textContent = `TIME: ${Math.max(0, this.timeLeft).toFixed(1)}`;
          if (this.timeLeft <= 0) this.gameOver();
        }, 100);
        break;
      case 'twin':
        this.shadow.mirror(this.snake.body);
        occupied.push(...this.shadow.body);
        break;
    }

    this.food.spawn(occupied);

    if (mode === 'poison') {
      this.spawnPoison();
    }

    this.updateScoreUI();
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');

    this.running = true;
    this.intervalId = setInterval(() => this.tick(), this.currentTickMs);
  }

  // ── Maze helpers ──────────────────────────────────────────
  generateMazeWalls() {
    const count = 5 + Math.floor(Math.random() * 6); // 5-10 walls
    const snakeOccupied = this.snake.body;
    this.walls = [];
    for (let i = 0; i < count; i++) {
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (
        snakeOccupied.some(s => s.x === pos.x && s.y === pos.y) ||
        this.walls.some(w => w.x === pos.x && w.y === pos.y) ||
        // Keep a 2-tile buffer around the snake head
        (Math.abs(pos.x - snakeOccupied[0].x) <= 2 && Math.abs(pos.y - snakeOccupied[0].y) <= 2)
      );
      this.walls.push(pos);
    }
  }

  // ── Poison helper ─────────────────────────────────────────
  spawnPoison() {
    const occupied = [...this.snake.body, this.food.position, ...this.walls];
    this.poison.spawn(occupied);
    this.poisonActive = true;
  }

  // ── Tick ──────────────────────────────────────────────────
  tick() {
    const mode = this.currentMode;
    const wrapAround = (mode === 'portal' || mode === 'twin');

    this.snake.update(wrapAround);

    // Twin mode: update shadow
    if (mode === 'twin') {
      this.shadow.mirror(this.snake.body);
    }

    // Wall collision (skip for wrap-around modes)
    if (!wrapAround && this.snake.collidesWall()) {
      this.gameOver();
      return;
    }

    // Self collision
    if (this.snake.collidesSelf()) {
      this.gameOver();
      return;
    }

    // Maze wall collision
    if (mode === 'maze' && this.walls.some(w => this.snake.collidesPoint(w))) {
      this.gameOver();
      return;
    }

    // Twin mode: collision with shadow
    if (mode === 'twin' && this.snake.collidesBody(this.shadow.body)) {
      this.gameOver();
      return;
    }

    // Food eating
    const head = this.snake.body[0];
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow();
      this.score += 10;

      // Speedster: increase speed by 5%
      if (mode === 'speedster') {
        this.currentTickMs *= 0.95;
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), this.currentTickMs);
      }

      // Time Attack: add 3 seconds
      if (mode === 'timeattack') {
        this.timeLeft += 3;
      }

      this.updateScoreUI();
      const occupied = [...this.snake.body, ...this.walls];
      if (mode === 'twin') occupied.push(...this.shadow.body);
      if (mode === 'poison' && this.poisonActive) occupied.push(this.poison.position);
      this.food.spawn(occupied);

      // Poison mode: re-spawn poison sometimes
      if (mode === 'poison' && (!this.poisonActive || Math.random() < 0.5)) {
        this.spawnPoison();
      }
    }

    // Poison eating
    if (mode === 'poison' && this.poisonActive &&
        head.x === this.poison.position.x && head.y === this.poison.position.y) {
      this.gameOver();
      return;
    }

    this.render();
  }

  // ── Render ────────────────────────────────────────────────
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
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

    // Maze walls
    if (this.currentMode === 'maze') {
      ctx.shadowColor = '#666';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#555555';
      this.walls.forEach(w => {
        ctx.fillRect(w.x * TILE + 1, w.y * TILE + 1, TILE - 2, TILE - 2);
      });
      ctx.shadowBlur = 0;
    }

    // Food
    this.food.draw();

    // Poison
    if (this.currentMode === 'poison' && this.poisonActive) {
      this.poison.draw('#aa00ff');
    }

    // Shadow snake (twin mode)
    if (this.currentMode === 'twin') {
      this.shadow.draw();
    }

    // Player snake
    this.snake.draw();
  }

  updateScoreUI() {
    scoreDisplay.textContent = `SCORE: ${this.score}`;
  }

  gameOver() {
    this.stop();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore);
      highscoreDisplay.textContent = `HI: ${this.highScore}`;
    }

    finalScoreText.textContent = `SCORE: ${this.score}`;
    gameoverScreen.classList.remove('hidden');
  }
}

// ── Boot ────────────────────────────────────────────────────
const game = new Game();
