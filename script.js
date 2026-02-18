// ============================================================
// Retro Snake Game – Vanilla JS – 8 Game Modes
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
const victoryScreen    = document.getElementById('victory-screen');
const finalScoreText   = document.getElementById('final-score');
const restartBtn       = document.getElementById('restart-btn');
const menuBtn          = document.getElementById('menu-btn');
const victoryRestartBtn = document.getElementById('victory-restart-btn');
const victoryMenuBtn   = document.getElementById('victory-menu-btn');
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

  /** Check if ANY segment of the snake overlaps a pixel-based rect (in grid coords). */
  collidesRect(rx, ry, rw, rh) {
    return this.body.some(seg =>
      seg.x >= rx && seg.x < rx + rw && seg.y >= ry && seg.y < ry + rh
    );
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
// Boss
// ============================================================
class Boss {
  constructor() {
    this.maxHp = 5;
    this.hp = this.maxHp;
    this.size = 4;                       // 4x4 grid tiles
    this.x = Math.floor((GRID_SIZE - this.size) / 2); // top-center
    this.y = 0;
    this.flashTimer = 0;                 // ticks remaining for damage flash
    this.shakeOffset = 0;
  }

  reset() {
    this.hp = this.maxHp;
    this.flashTimer = 0;
    this.shakeOffset = 0;
  }

  takeDamage() {
    this.hp--;
    this.flashTimer = 6; // flash for 6 ticks
  }

  /** Returns array of grid positions the boss occupies. */
  getOccupied() {
    const tiles = [];
    for (let dx = 0; dx < this.size; dx++) {
      for (let dy = 0; dy < this.size; dy++) {
        tiles.push({ x: this.x + dx, y: this.y + dy });
      }
    }
    return tiles;
  }

  update() {
    if (this.flashTimer > 0) {
      this.flashTimer--;
      this.shakeOffset = (this.flashTimer % 2 === 0) ? 2 : -2;
    } else {
      this.shakeOffset = 0;
    }
  }

  draw() {
    const px = this.x * TILE + this.shakeOffset;
    const py = this.y * TILE;
    const pw = this.size * TILE;
    const ph = this.size * TILE;

    // Body
    const bodyColor = this.flashTimer > 0 ? '#ffffff' : '#ff2244';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 15;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    ctx.shadowBlur = 0;

    // Eyes
    const eyeSize = TILE * 0.6;
    const eyeY = py + TILE * 1.2;
    ctx.fillStyle = '#000';
    ctx.fillRect(px + TILE * 0.8, eyeY, eyeSize, eyeSize);
    ctx.fillRect(px + TILE * 2.6, eyeY, eyeSize, eyeSize);

    // Pupils
    const pupilSize = TILE * 0.3;
    ctx.fillStyle = '#ff0044';
    ctx.fillRect(px + TILE * 0.95, eyeY + eyeSize * 0.35, pupilSize, pupilSize);
    ctx.fillRect(px + TILE * 2.75, eyeY + eyeSize * 0.35, pupilSize, pupilSize);

    // HP bar background
    const barX = px;
    const barY = py + ph + 4;
    const barW = pw;
    const barH = 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // HP bar fill
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? '#ff2244' : '#ff8800';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Projectile Manager (Boss attacks)
// ============================================================
class ProjectileManager {
  constructor() {
    this.bullets = [];     // Attack A: rain
    this.lasers = [];      // Attack B: laser lines
    this.chasers = [];     // Attack C: targeting reticles
  }

  reset() {
    this.bullets = [];
    this.lasers = [];
    this.chasers = [];
  }

  // ── Attack A: Rain ──────────────────────────────────────
  spawnRain() {
    // Spawn 3-5 bullets at random x across the top
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.bullets.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: 0,
      });
    }
  }

  updateBullets() {
    this.bullets.forEach(b => b.y += 1);
    this.bullets = this.bullets.filter(b => b.y < GRID_SIZE);
  }

  // ── Attack B: Laser Lines ──────────────────────────────
  spawnLaser() {
    // Pick a random row or column
    const isRow = Math.random() < 0.5;
    const index = Math.floor(Math.random() * GRID_SIZE);
    this.lasers.push({
      isRow,
      index,
      warningTicks: 10,  // 10 ticks (~1s) of warning
      fireTicks: 3,      // laser stays active 3 ticks
    });
  }

  updateLasers() {
    this.lasers.forEach(l => {
      if (l.warningTicks > 0) {
        l.warningTicks--;
      } else {
        l.fireTicks--;
      }
    });
    this.lasers = this.lasers.filter(l => l.fireTicks > 0);
  }

  // ── Attack C: Chaser ───────────────────────────────────
  spawnChaser(targetX, targetY) {
    this.chasers.push({
      x: targetX,
      y: targetY,
      trackingTicks: 30,  // follows head for 30 ticks (~3s)
      lockedIn: false,
      explosionTicks: 0,
    });
  }

  updateChasers(headX, headY) {
    this.chasers.forEach(c => {
      if (!c.lockedIn) {
        // Follow the head
        c.x = headX;
        c.y = headY;
        c.trackingTicks--;
        if (c.trackingTicks <= 0) {
          c.lockedIn = true;
          c.explosionTicks = 5; // explodes for 5 ticks
        }
      } else {
        c.explosionTicks--;
      }
    });
    this.chasers = this.chasers.filter(c => !c.lockedIn || c.explosionTicks > 0);
  }

  // ── Collision checks against snake ─────────────────────
  snakeHitByBullet(snake) {
    return snake.body.some(seg =>
      this.bullets.some(b => b.x === seg.x && b.y === seg.y)
    );
  }

  snakeHitByLaser(snake) {
    return this.lasers.some(l => {
      if (l.warningTicks > 0) return false; // still warning
      return snake.body.some(seg =>
        l.isRow ? seg.y === l.index : seg.x === l.index
      );
    });
  }

  snakeHitByChaser(snake) {
    return this.chasers.some(c => {
      if (!c.lockedIn) return false; // only hurts after explosion
      // 3x3 explosion zone centered on lock position
      return snake.body.some(seg =>
        seg.x >= c.x - 1 && seg.x <= c.x + 1 &&
        seg.y >= c.y - 1 && seg.y <= c.y + 1
      );
    });
  }

  // ── Draw ───────────────────────────────────────────────
  draw() {
    // Rain bullets (small white dots)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    this.bullets.forEach(b => {
      const cx = b.x * TILE + TILE / 2;
      const cy = b.y * TILE + TILE / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Lasers
    this.lasers.forEach(l => {
      if (l.warningTicks > 0) {
        // Warning: flashing yellow highlight
        const alpha = (l.warningTicks % 2 === 0) ? 0.15 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      } else {
        // Active: solid bright beam
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.shadowColor = '#ff3232';
        ctx.shadowBlur = 15;
      }
      if (l.isRow) {
        ctx.fillRect(0, l.index * TILE, canvas.width, TILE);
      } else {
        ctx.fillRect(l.index * TILE, 0, TILE, canvas.height);
      }
      ctx.shadowBlur = 0;
    });

    // Chasers
    this.chasers.forEach(c => {
      if (!c.lockedIn) {
        // Tracking reticle: crosshair around position
        const cx = c.x * TILE + TILE / 2;
        const cy = c.y * TILE + TILE / 2;
        ctx.strokeStyle = '#ffdd00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffdd00';
        ctx.shadowBlur = 8;
        // Circle
        ctx.beginPath();
        ctx.arc(cx, cy, TILE, 0, Math.PI * 2);
        ctx.stroke();
        // Crosshair lines
        ctx.beginPath();
        ctx.moveTo(cx - TILE * 1.3, cy);
        ctx.lineTo(cx + TILE * 1.3, cy);
        ctx.moveTo(cx, cy - TILE * 1.3);
        ctx.lineTo(cx, cy + TILE * 1.3);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      } else {
        // Explosion: 3x3 red zone
        ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 20;
        ctx.fillRect(
          (c.x - 1) * TILE, (c.y - 1) * TILE,
          3 * TILE, 3 * TILE
        );
        ctx.shadowBlur = 0;
      }
    });
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
    this.boss = new Boss();
    this.projectiles = new ProjectileManager();
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

    // Boss fight
    this.bossTickCounter = 0;
    this.bossAttackCycle = 0;

    highscoreDisplay.textContent = `HI: ${this.highScore}`;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      // R key – instant restart at any time
      if (e.key === 'r' || e.key === 'R') {
        if (!startScreen.classList.contains('hidden')) return;
        this.startMode(this.currentMode);
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
    victoryRestartBtn.addEventListener('click', () => this.startMode(this.currentMode));
    victoryMenuBtn.addEventListener('click', () => this.showMenu());
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
    victoryScreen.classList.add('hidden');
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
      case 'bossfight':
        this.boss.reset();
        this.projectiles.reset();
        this.bossTickCounter = 0;
        this.bossAttackCycle = 0;
        occupied.push(...this.boss.getOccupied());
        // Move snake to bottom-center for boss fight
        this.snake.body = [
          { x: 10, y: 17 },
          { x: 9,  y: 17 },
          { x: 8,  y: 17 },
        ];
        this.snake.direction = DIR.RIGHT;
        this.snake.nextDirection = DIR.RIGHT;
        break;
    }

    this.food.spawn(occupied);

    if (mode === 'poison') {
      this.spawnPoison();
    }

    this.updateScoreUI();
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');

    this.running = true;
    this.intervalId = setInterval(() => this.tick(), this.currentTickMs);
  }

  // ── Maze helpers ──────────────────────────────────────────
  generateMazeWalls() {
    const count = 5 + Math.floor(Math.random() * 6);
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

  // ── Boss fight: spawn orb avoiding boss area ──────────────
  spawnBossOrb() {
    const occupied = [...this.snake.body, ...this.boss.getOccupied()];
    this.food.spawn(occupied);
  }

  // ── Tick ──────────────────────────────────────────────────
  tick() {
    const mode = this.currentMode;

    if (mode === 'bossfight') {
      this.tickBoss();
      return;
    }

    const wrapAround = (mode === 'portal' || mode === 'twin');
    this.snake.update(wrapAround);

    if (mode === 'twin') this.shadow.mirror(this.snake.body);

    if (!wrapAround && this.snake.collidesWall()) { this.gameOver(); return; }
    if (this.snake.collidesSelf()) { this.gameOver(); return; }
    if (mode === 'maze' && this.walls.some(w => this.snake.collidesPoint(w))) { this.gameOver(); return; }
    if (mode === 'twin' && this.snake.collidesBody(this.shadow.body)) { this.gameOver(); return; }

    const head = this.snake.body[0];
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow();
      this.score += 10;

      if (mode === 'speedster') {
        this.currentTickMs *= 0.95;
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), this.currentTickMs);
      }
      if (mode === 'timeattack') this.timeLeft += 3;

      this.updateScoreUI();
      const occupied = [...this.snake.body, ...this.walls];
      if (mode === 'twin') occupied.push(...this.shadow.body);
      if (mode === 'poison' && this.poisonActive) occupied.push(this.poison.position);
      this.food.spawn(occupied);

      if (mode === 'poison' && (!this.poisonActive || Math.random() < 0.5)) {
        this.spawnPoison();
      }
    }

    if (mode === 'poison' && this.poisonActive &&
        head.x === this.poison.position.x && head.y === this.poison.position.y) {
      this.gameOver();
      return;
    }

    this.render();
  }

  // ── Boss Fight Tick ───────────────────────────────────────
  tickBoss() {
    this.snake.update(false);
    this.boss.update();
    this.bossTickCounter++;

    // Wall / self collision
    if (this.snake.collidesWall() || this.snake.collidesSelf()) {
      this.gameOver();
      return;
    }

    // Collision with boss body
    if (this.snake.collidesRect(this.boss.x, this.boss.y, this.boss.size, this.boss.size)) {
      this.gameOver();
      return;
    }

    // Update projectiles
    this.projectiles.updateBullets();
    this.projectiles.updateLasers();
    const head = this.snake.body[0];
    this.projectiles.updateChasers(head.x, head.y);

    // Check projectile hits
    if (this.projectiles.snakeHitByBullet(this.snake) ||
        this.projectiles.snakeHitByLaser(this.snake) ||
        this.projectiles.snakeHitByChaser(this.snake)) {
      this.gameOver();
      return;
    }

    // Boss attack cycle – fire attacks every 15 ticks (~1.5s)
    if (this.bossTickCounter % 15 === 0) {
      const phase = this.bossAttackCycle % 3;
      switch (phase) {
        case 0: this.projectiles.spawnRain(); break;
        case 1: this.projectiles.spawnLaser(); break;
        case 2: this.projectiles.spawnChaser(head.x, head.y); break;
      }
      this.bossAttackCycle++;
    }

    // Also spawn rain more frequently for variety
    if (this.bossTickCounter % 8 === 0 && this.boss.hp <= 3) {
      this.projectiles.spawnRain();
    }

    // Eating orb = damage boss
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow();
      this.boss.takeDamage();
      this.score += 10;
      this.updateScoreUI();

      if (this.boss.hp <= 0) {
        this.victory();
        return;
      }

      this.spawnBossOrb();
    }

    this.renderBoss();
  }

  // ── Render (normal modes) ─────────────────────────────────
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(canvas.width, i * TILE); ctx.stroke();
    }

    if (this.currentMode === 'maze') {
      ctx.shadowColor = '#666'; ctx.shadowBlur = 4; ctx.fillStyle = '#555555';
      this.walls.forEach(w => ctx.fillRect(w.x * TILE + 1, w.y * TILE + 1, TILE - 2, TILE - 2));
      ctx.shadowBlur = 0;
    }

    this.food.draw();

    if (this.currentMode === 'poison' && this.poisonActive) this.poison.draw('#aa00ff');
    if (this.currentMode === 'twin') this.shadow.draw();

    this.snake.draw();
  }

  // ── Render (boss fight) ───────────────────────────────────
  renderBoss() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(canvas.width, i * TILE); ctx.stroke();
    }

    // Projectiles (draw behind boss/snake)
    this.projectiles.draw();

    // Boss
    this.boss.draw();

    // Orb (cyan to distinguish from normal food)
    this.food.draw('#00ffff');

    // Player
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

  victory() {
    this.stop();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore);
      highscoreDisplay.textContent = `HI: ${this.highScore}`;
    }

    victoryScreen.classList.remove('hidden');
  }
}

// ── Boot ────────────────────────────────────────────────────
const game = new Game();
