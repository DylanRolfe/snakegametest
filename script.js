// ============================================================
// Retro Snake Game – Vanilla JS – 8 Game Modes
// ============================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Grid configuration (defaults for normal modes)
const NORMAL_GRID = 20;
const BOSS_GRID = 40;
let gridSize = NORMAL_GRID;
let tile = canvas.width / gridSize;
const BASE_TICK_MS = 100;

function setGrid(size) {
  gridSize = size;
  tile = canvas.width / gridSize;
}

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
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (occupied.some(seg => seg.x === pos.x && seg.y === pos.y));
    this.position = pos;
  }

  draw(color = '#ff0044') {
    const x = this.position.x * tile;
    const y = this.position.y * tile;
    const center = tile / 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + center, y + center, Math.max(center - 2, 2), 0, Math.PI * 2);
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
    const mid = Math.floor(gridSize / 2);
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
        x: (this.body[0].x + this.direction.x + gridSize) % gridSize,
        y: (this.body[0].y + this.direction.y + gridSize) % gridSize,
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
    return h.x < 0 || h.x >= gridSize || h.y < 0 || h.y >= gridSize;
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
      ctx.fillRect(seg.x * tile + 1, seg.y * tile + 1, tile - 2, tile - 2);
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
      x: (this.body[0].x + this.direction.x + gridSize) % gridSize,
      y: (this.body[0].y + this.direction.y + gridSize) % gridSize,
    };
    this.body.unshift(head);
    while (this.body.length > this.length) this.body.pop();
  }

  draw() {
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#ffaa00' : '#ff6600';
      ctx.fillRect(seg.x * tile + 1, seg.y * tile + 1, tile - 2, tile - 2);
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
      x: gridSize - 1 - seg.x,
      y: gridSize - 1 - seg.y,
    }));
  }

  draw() {
    ctx.shadowColor = '#cc00ff';
    ctx.shadowBlur = 8;
    this.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#dd66ff' : '#cc00ff';
      ctx.fillRect(seg.x * tile + 1, seg.y * tile + 1, tile - 2, tile - 2);
    });
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// Boss (uses dynamic gridSize for positioning)
// ============================================================
class Boss {
  constructor() {
    this.maxHp = 5;
    this.hp = this.maxHp;
    this.size = 6; // 6x6 on 40-grid (visually similar to 3x3 on 20-grid)
    this.x = 0;
    this.y = 0;
    this.flashTimer = 0;
    this.shakeOffset = 0;
  }

  reset() {
    this.hp = this.maxHp;
    this.size = 6;
    this.x = Math.floor((gridSize - this.size) / 2);
    this.y = 1;
    this.flashTimer = 0;
    this.shakeOffset = 0;
  }

  takeDamage() {
    this.hp--;
    this.flashTimer = 6;
  }

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
    const px = this.x * tile + this.shakeOffset;
    const py = this.y * tile;
    const pw = this.size * tile;
    const ph = this.size * tile;

    // Body
    const bodyColor = this.flashTimer > 0 ? '#ffffff' : '#ff2244';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 15;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    ctx.shadowBlur = 0;

    // Eyes (scaled to boss size)
    const eyeW = pw * 0.15;
    const eyeH = pw * 0.15;
    const eyeY = py + ph * 0.28;
    const leftEyeX = px + pw * 0.2;
    const rightEyeX = px + pw * 0.65;
    ctx.fillStyle = '#000';
    ctx.fillRect(leftEyeX, eyeY, eyeW, eyeH);
    ctx.fillRect(rightEyeX, eyeY, eyeW, eyeH);

    // Pupils
    const pupilW = eyeW * 0.5;
    const pupilH = eyeH * 0.5;
    ctx.fillStyle = '#ff0044';
    ctx.fillRect(leftEyeX + eyeW * 0.25, eyeY + eyeH * 0.35, pupilW, pupilH);
    ctx.fillRect(rightEyeX + eyeW * 0.25, eyeY + eyeH * 0.35, pupilW, pupilH);

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
// Projectile Manager (Boss attacks – Rain & Lasers only)
// ============================================================
class ProjectileManager {
  constructor() {
    this.bullets = [];
    this.lasers = [];
  }

  reset() {
    this.bullets = [];
    this.lasers = [];
  }

  // ── Attack A: Rain (widely spread) ────────────────────────
  spawnRain() {
    // On a 40-wide grid, spawn 4-6 bullets with enforced minimum spacing
    const count = 4 + Math.floor(Math.random() * 3);
    const positions = [];
    for (let i = 0; i < count; i++) {
      let x;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * gridSize);
        attempts++;
      } while (attempts < 20 && positions.some(px => Math.abs(px - x) < 5));
      positions.push(x);
      this.bullets.push({ x, y: 0 });
    }
  }

  updateBullets() {
    this.bullets.forEach(b => b.y += 1);
    this.bullets = this.bullets.filter(b => b.y < gridSize);
  }

  // ── Attack B: Laser Lines ──────────────────────────────────
  spawnLaser() {
    const isRow = Math.random() < 0.5;
    const index = Math.floor(Math.random() * gridSize);
    this.lasers.push({
      isRow,
      index,
      warningTicks: 10,
      fireTicks: 3,
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

  // ── Collision checks ──────────────────────────────────────
  snakeHitByBullet(snake) {
    return snake.body.some(seg =>
      this.bullets.some(b => b.x === seg.x && b.y === seg.y)
    );
  }

  snakeHitByLaser(snake) {
    return this.lasers.some(l => {
      if (l.warningTicks > 0) return false;
      return snake.body.some(seg =>
        l.isRow ? seg.y === l.index : seg.x === l.index
      );
    });
  }

  // ── Draw ──────────────────────────────────────────────────
  draw() {
    // Rain bullets
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    this.bullets.forEach(b => {
      const cx = b.x * tile + tile / 2;
      const cy = b.y * tile + tile / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(tile * 0.3, 2), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Lasers
    this.lasers.forEach(l => {
      if (l.warningTicks > 0) {
        const alpha = (l.warningTicks % 2 === 0) ? 0.15 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      } else {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.shadowColor = '#ff3232';
        ctx.shadowBlur = 15;
      }
      if (l.isRow) {
        ctx.fillRect(0, l.index * tile, canvas.width, tile);
      } else {
        ctx.fillRect(l.index * tile, 0, tile, canvas.height);
      }
      ctx.shadowBlur = 0;
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
      if (e.key === 'r' || e.key === 'R') {
        if (!startScreen.classList.contains('hidden')) return;
        this.startMode(this.currentMode);
        return;
      }

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

      if (!this.running) return;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': this.snake.setDirection(DIR.UP);    break;
        case 'ArrowDown':  case 's': case 'S': this.snake.setDirection(DIR.DOWN);  break;
        case 'ArrowLeft':  case 'a': case 'A': this.snake.setDirection(DIR.LEFT);  break;
        case 'ArrowRight': case 'd': case 'D': this.snake.setDirection(DIR.RIGHT); break;
      }
    });

    modeItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        this.menuIndex = idx;
        this.updateMenuHighlight();
        this.selectCurrentMenuItem();
      });
    });

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
    setGrid(NORMAL_GRID);
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

    // Set grid size: boss fight uses 40x40, everything else 20x20
    setGrid(mode === 'bossfight' ? BOSS_GRID : NORMAL_GRID);

    this.snake.reset();
    this.score = 0;
    this.currentTickMs = BASE_TICK_MS;
    this.walls = [];
    this.poisonActive = false;
    timerDisplay.classList.add('hidden');

    const occupied = [...this.snake.body];

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
        // Move snake to bottom-center of the 40x40 grid
        this.snake.body = [
          { x: 20, y: 35 },
          { x: 19, y: 35 },
          { x: 18, y: 35 },
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
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
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

    if (this.snake.collidesWall() || this.snake.collidesSelf()) {
      this.gameOver();
      return;
    }

    if (this.snake.collidesRect(this.boss.x, this.boss.y, this.boss.size, this.boss.size)) {
      this.gameOver();
      return;
    }

    // Update projectiles
    this.projectiles.updateBullets();
    this.projectiles.updateLasers();

    // Check projectile hits
    if (this.projectiles.snakeHitByBullet(this.snake) ||
        this.projectiles.snakeHitByLaser(this.snake)) {
      this.gameOver();
      return;
    }

    // Boss attack cycle – alternate rain and lasers every 15 ticks (~1.5s)
    if (this.bossTickCounter % 15 === 0) {
      const phase = this.bossAttackCycle % 2;
      switch (phase) {
        case 0: this.projectiles.spawnRain(); break;
        case 1: this.projectiles.spawnLaser(); break;
      }
      this.bossAttackCycle++;
    }

    // Intensify rain at low HP
    if (this.bossTickCounter % 10 === 0 && this.boss.hp <= 3) {
      this.projectiles.spawnRain();
    }

    // Eating orb = damage boss
    const head = this.snake.body[0];
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
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(canvas.width, i * tile); ctx.stroke();
    }

    if (this.currentMode === 'maze') {
      ctx.shadowColor = '#666'; ctx.shadowBlur = 4; ctx.fillStyle = '#555555';
      this.walls.forEach(w => ctx.fillRect(w.x * tile + 1, w.y * tile + 1, tile - 2, tile - 2));
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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(canvas.width, i * tile); ctx.stroke();
    }

    this.projectiles.draw();
    this.boss.draw();
    this.food.draw('#00ffff');
    this.snake.draw();
  }

  updateScoreUI() {
    scoreDisplay.textContent = `SCORE: ${this.score}`;
  }

  gameOver() {
    this.stop();
    setGrid(NORMAL_GRID);

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
    setGrid(NORMAL_GRID);

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
