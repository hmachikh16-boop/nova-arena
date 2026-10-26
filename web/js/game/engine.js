import { arenaById, BOT_NAMES, DIFFICULTY, HERO_ORDER, HEROES, WORLD } from '../data.js';
import { audio } from '../audio.js';
import { createWorldMap } from './map.js';
import { ArenaRenderer } from './renderer.js';
import { updateBot } from './ai.js';
import {
  tryAttack,
  useSuper,
  matchResult,
  awardMatch,
  applyDamage,
} from './combat.js';
import {
  spawnGem,
  dropGems,
  updateGems,
  updateProjectiles,
  updateParticles,
  spawnParticles,
  addFloatingText,
} from './items.js';
import { clamp, distance, normalize, random, shuffle } from './utils.js';

const RESPAWN_SECONDS = 3.3;
const COUNTDOWN_SECONDS = 3;

export class ArenaGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.heroId = HEROES[options.heroId] ? options.heroId : 'nova';
    this.playerName = options.playerName || 'قائد نوفا';
    this.onHud = options.onHud || (() => {});
    this.onEvent = options.onEvent || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.arena = arenaById(options.arenaId || options.arena);
    this.arenaId = this.arena.id;
    this.worldMap = createWorldMap(this.arena);
    this.renderer = new ArenaRenderer();

    this.phase = 'countdown';
    this.countdown = COUNTDOWN_SECONDS;
    this.countdownDuration = COUNTDOWN_SECONDS;
    this.lastCountdownValue = COUNTDOWN_SECONDS + 1;
    this.matchTime = WORLD.matchSeconds;
    this.elapsed = 0;
    this.gemSpawnTimer = 0.85;
    this.gemsOnMine = 0;
    this.lastGemTeam = 0;
    this.overtimeTeam = null;
    this.overtimeTimer = 0;
    this.paused = false;
    this.running = true;
    this.result = null;
    this.resultSent = false;
    this.endTimer = 0;
    this.shake = 0;
    this.destroyed = false;

    this.entities = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.effects = [];
    this.floatingTexts = [];
    this.projectileSequence = 0;
    this.gemSequence = 0;

    this.keys = new Set();
    this.mouse = { x: 0, y: 0, active: false };
    this.touchMove = { x: 0, y: 0, active: false };
    this.touchAim = { x: 0, y: 0, active: false };
    this.shooting = false;

    this.setupTeams();
    this.setupCanvas();
    this.bindInput();
    this.lastFrame = performance.now();
    this.lastHudAt = 0;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);

    this.emitHud(true);
    this.emitEvent({ type: 'start' });
  }

  setupTeams() {
    const otherHeroes = shuffle(HERO_ORDER.filter((id) => id !== this.heroId));
    const allyHeroes = [this.heroId, ...otherHeroes.slice(0, 2)];
    const enemyHeroes = shuffle(HERO_ORDER).slice(0, 3);
    const names = shuffle(BOT_NAMES);

    for (let slot = 0; slot < 3; slot += 1) {
      this.entities.push(
        this.createEntity({
          team: 0,
          slot,
          heroId: allyHeroes[slot],
          isPlayer: slot === 0,
          name: slot === 0 ? this.playerName : names[slot],
        }),
      );
    }
    for (let slot = 0; slot < 3; slot += 1) {
      this.entities.push(
        this.createEntity({
          team: 1,
          slot,
          heroId: enemyHeroes[slot],
          isPlayer: false,
          name: names[slot + 3],
        }),
      );
    }
    this.player = this.entities.find((entity) => entity.isPlayer);
    this.player.superCharge = 0.42;
    this.player.aim = Math.atan2(
      this.arena.gemMine.y - this.player.y,
      this.arena.gemMine.x - this.player.x,
    );
    this.player.aimSource = 'center';
  }

  createEntity({ team, slot, heroId, isPlayer, name }) {
    const hero = HEROES[heroId];
    const spawnList = team === 0 ? this.arena.spawns.ally : this.arena.spawns.enemy;
    const spawn = spawnList[slot] || spawnList[0];
    const targetAngle = Math.atan2(this.arena.gemMine.y - spawn.y, this.arena.gemMine.x - spawn.x);
    return {
      id: this.entities.length + 1 + Math.floor(Math.random() * 1000),
      team,
      slot,
      heroId,
      hero,
      isPlayer,
      name,
      x: spawn.x,
      y: spawn.y,
      spawn: { x: spawn.x, y: spawn.y },
      radius: hero.radius,
      hp: hero.hp,
      maxHp: hero.hp,
      alive: true,
      aim: targetAngle,
      aimSource: 'center',
      moving: false,
      walkPhase: random(0, 7),
      velocityX: 0,
      velocityY: 0,
      ammo: hero.attack.ammo,
      attackCooldown: 0,
      reloadTimer: 0,
      recoil: 0,
      lastAttackAt: -99,
      lastDamageAt: -99,
      flashUntil: 0,
      invulnerableUntil: 0.9,
      shieldHp: 0,
      shieldUntil: 0,
      slowUntil: 0,
      speedBoostUntil: 0,
      knockback: null,
      gems: 0,
      gemsCollected: 0,
      kills: 0,
      deaths: 0,
      damage: 0,
      playerDamage: 0,
      damageTaken: 0,
      superCharge: team === 0 ? 0.18 : 0.1 + Math.random() * 0.1,
      inBush: false,
      hidden: false,
      respawnTimer: 0,
      stepTimer: random(0, 0.3),
      ai: null,
    };
  }

  setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(WORLD.width * dpr);
    const height = Math.round(WORLD.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  bindInput() {
    this.handleKeyDown = (event) => {
      if (this.paused || this.phase === 'ended') return;
      const movementKeys = [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ];
      if (movementKeys.includes(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
      }
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) this.triggerSuper();
      }
    };
    this.handleKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this.handleBlur = () => {
      this.keys.clear();
      this.shooting = false;
    };
    this.handleResize = () => {
      this.setupCanvas();
      this.emitHud(true);
    };
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  setTouchMove(x, y, active = true) {
    const vector = normalize(x, y);
    this.touchMove.x = vector.x * Math.min(1, vector.length);
    this.touchMove.y = vector.y * Math.min(1, vector.length);
    this.touchMove.active = active;
  }

  setTouchAim(x, y, active = true) {
    const vector = normalize(x, y);
    this.touchAim.x = vector.x;
    this.touchAim.y = vector.y;
    this.touchAim.active = active;
    if (active && vector.length > 0.08) {
      this.player.aim = Math.atan2(vector.y, vector.x);
      this.player.aimSource = 'touch';
    }
  }

  setAimWorld(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;
    if (this.player) this.player.aimSource = 'mouse';
  }

  setShooting(value) {
    this.shooting = Boolean(value);
  }

  aimNearestEnemy() {
    if (!this.player?.alive) return false;
    let target = null;
    let best = Number.POSITIVE_INFINITY;
    for (const entity of this.entities) {
      if (!entity.alive || entity.team === this.player.team) continue;
      if (!this.canSee(this.player, entity)) continue;
      const dist = distance(this.player.x, this.player.y, entity.x, entity.y);
      if (dist < best) {
        best = dist;
        target = entity;
      }
    }
    if (!target) return false;
    this.player.aim = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    this.player.aimSource = 'touch';
    return true;
  }

  triggerSuper() {
    if (!this.player?.alive) return { ok: false, reason: 'dead' };
    if (this.player.superCharge < 1) return { ok: false, reason: 'charge' };
    const activated = this.useSuper(this.player, this.player.aim);
    if (activated) this.emitHud(true);
    return { ok: activated, reason: activated ? null : 'unavailable' };
  }

  tryAttack(entity, angle) {
    return tryAttack(this, entity, angle);
  }

  useSuper(entity, angle) {
    return useSuper(this, entity, angle ?? entity.aim);
  }

  spawnParticles(x, y, color, count, options) {
    spawnParticles(this, x, y, color, count, options);
  }

  addFloatingText(x, y, text, color, size = 15) {
    addFloatingText(this, x, y, text, color, size);
  }

  dropGems(x, y, count) {
    dropGems(this, x, y, count);
  }

  emitEvent(payload) {
    try {
      this.onEvent(payload);
    } catch {
      // Presentation errors should never stop the match.
    }
  }

  emitHud(force = false) {
    if (!this.onHud || this.destroyed) return;
    const now = performance.now();
    if (!force && now - this.lastHudAt < 80) return;
    this.lastHudAt = now;
    const player = this.player;
    const roster = (team) =>
      this.entities
        .filter((entity) => entity.team === team)
        .map((entity) => ({
          heroId: entity.heroId,
          name: entity.name,
          isPlayer: entity.isPlayer,
          alive: entity.alive,
          gems: entity.gems,
          hp: Math.round(entity.hp),
          maxHp: entity.maxHp,
          superReady: entity.superCharge >= 1,
          respawn: Math.max(0, entity.respawnTimer),
          kills: entity.kills,
        }));
    try {
      this.onHud({
        phase: this.phase,
        countdown: Math.ceil(Math.max(0, this.countdown)),
        timeLeft: Math.max(0, this.matchTime),
        elapsed: this.elapsed,
        scores: { ally: this.getTeamScore(0), enemy: this.getTeamScore(1) },
        overtimeTeam: this.overtimeTeam,
        overtimeTimer: Math.max(0, this.overtimeTimer),
        gemGoal: WORLD.gemGoal,
        player: {
          alive: player.alive,
          hp: Math.max(0, player.hp),
          maxHp: player.maxHp,
          shieldHp: player.shieldHp,
          ammo: player.ammo,
          maxAmmo: player.hero.attack.ammo,
          reloadProgress: player.reloadTimer / player.hero.attack.reload,
          superCharge: player.superCharge,
          superReady: player.superCharge >= 1,
          gems: player.gems,
          kills: player.kills,
          deaths: player.deaths,
          respawn: Math.max(0, player.respawnTimer),
          hidden: player.hidden,
          inBush: player.inBush,
          heroId: player.heroId,
          heroName: player.hero.name,
          heroColor: player.hero.color,
          speedBoost: this.elapsed < player.speedBoostUntil,
          slowed: this.elapsed < player.slowUntil,
        },
        allyTeam: roster(0),
        enemyTeam: roster(1),
      });
    } catch {
      // Ignore HUD rendering failures.
    }
  }

  getTeamScore(team) {
    return this.entities.reduce(
      (total, entity) => total + (entity.team === team ? entity.gems : 0),
      0,
    );
  }

  canSee(viewer, target) {
    if (!viewer.alive || !target.alive) return false;
    const dist = distance(viewer.x, viewer.y, target.x, target.y);
    if (dist > DIFFICULTY.detection) return false;
    if (target.hidden && dist > 215) return false;
    return this.worldMap.lineOfSight(viewer.x, viewer.y, target.x, target.y, 3);
  }

  getSpeedMultiplier(entity) {
    let multiplier = 1;
    if (this.elapsed < entity.slowUntil) multiplier *= 0.62;
    if (this.elapsed < entity.speedBoostUntil) multiplier *= 1.24;
    return multiplier;
  }

  tryMove(entity, deltaX, deltaY) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / 7));
    const stepX = deltaX / steps;
    const stepY = deltaY / steps;
    const startX = entity.x;
    const startY = entity.y;
    for (let step = 0; step < steps; step += 1) {
      if (!this.worldMap.collides(entity.x + stepX, entity.y, entity.radius)) {
        entity.x += stepX;
      }
      if (!this.worldMap.collides(entity.x, entity.y + stepY, entity.radius)) {
        entity.y += stepY;
      }
    }
    return { x: entity.x - startX, y: entity.y - startY };
  }

  moveActor(entity, directionX, directionY, dt, speedScale = 1) {
    if (!entity.alive) return;
    const direction = normalize(directionX, directionY);
    if (direction.length < 0.02) return;
    const speed = entity.hero.speed * this.getSpeedMultiplier(entity) * speedScale;
    this.tryMove(entity, direction.x * speed * dt, direction.y * speed * dt);
  }

  loop(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = clamp((now - this.lastFrame) / 1000, 0.001, 0.034);
    this.lastFrame = now;
    if (!this.paused) this.update(dt);
    this.draw();
  }

  update(dt) {
    this.elapsed += dt;

    if (this.phase === 'countdown') {
      updateParticles(this, dt);
      this.updateCountdown(dt);
      this.emitHud();
      return;
    }

    if (this.phase === 'ended') {
      updateParticles(this, dt);
      this.endTimer -= dt;
      if (this.endTimer <= 0 && !this.resultSent && this.result) {
        this.resultSent = true;
        try {
          this.onEnd(this.result);
        } catch {
          // The host screen is still usable if results fail to render.
        }
      }
      this.emitHud();
      return;
    }

    if (this.phase !== 'playing') return;

    this.matchTime -= dt;
    this.updateSpawner(dt);
    this.updateEntities(dt);
    updateProjectiles(this, dt);
    updateGems(this, dt);
    updateParticles(this, dt);
    this.checkOvertime(dt);

    // A live overtime objective takes priority over the regular timer.
    if (this.matchTime <= 0 && this.phase === 'playing' && this.overtimeTeam === null) {
      this.finishByTime();
    }
    this.emitHud();
  }

  updateCountdown(dt) {
    this.countdown = Math.max(0, this.countdown - dt);
    const value = Math.ceil(this.countdown);
    if (value !== this.lastCountdownValue && value >= 1) {
      this.lastCountdownValue = value;
      this.emitEvent({ type: 'countdown', value });
      audio.play('countdown');
    }
    if (this.countdown <= 0) {
      this.phase = 'playing';
      this.lastCountdownValue = 0;
      this.gemSpawnTimer = 0.8;
      this.emitEvent({ type: 'go' });
      audio.play('go');
      this.emitHud(true);
    }
  }

  updateSpawner(dt) {
    this.gemSpawnTimer -= dt;
    if (this.gemSpawnTimer > 0) return;
    this.gemSpawnTimer = 1.65;
    if (this.gems.length >= 10) return;
    spawnGem(this);
    this.gemsOnMine += 1;
  }

  updateEntities(dt) {
    for (const entity of this.entities) {
      entity.attackCooldown = Math.max(0, entity.attackCooldown - dt);
      entity.recoil = Math.max(0, entity.recoil - dt * 5.5);

      if (!entity.alive) {
        entity.respawnTimer -= dt;
        if (entity.respawnTimer <= 0) this.respawnEntity(entity);
        continue;
      }

      if (entity.ammo < entity.hero.attack.ammo) {
        entity.reloadTimer += dt;
        if (entity.reloadTimer >= entity.hero.attack.reload) {
          entity.ammo += 1;
          entity.reloadTimer = 0;
        }
      } else {
        entity.reloadTimer = 0;
      }

      if (
        this.elapsed - entity.lastDamageAt > 3.1 &&
        entity.hp < entity.maxHp &&
        entity.hp > 0
      ) {
        entity.hp = Math.min(entity.maxHp, entity.hp + entity.maxHp * 0.085 * dt);
      }
      if (entity.shieldHp > 0 && this.elapsed > entity.shieldUntil) entity.shieldHp = 0;

      if (entity.knockback) {
        entity.knockback.time -= dt;
        if (entity.knockback.time <= 0) {
          entity.knockback = null;
        } else {
          const ratio = entity.knockback.time / entity.knockback.maxTime;
          this.tryMove(
            entity,
            entity.knockback.x * ratio * dt,
            entity.knockback.y * ratio * dt,
          );
        }
      }

      const beforeX = entity.x;
      const beforeY = entity.y;
      if (entity.isPlayer) {
        this.updatePlayer(entity, dt);
      } else {
        updateBot(this, entity, dt);
      }
      const moved = distance(beforeX, beforeY, entity.x, entity.y);
      entity.moving = moved > 0.15;
      entity.velocityX = dt > 0 ? (entity.x - beforeX) / dt : 0;
      entity.velocityY = dt > 0 ? (entity.y - beforeY) / dt : 0;
      if (entity.moving) {
        entity.walkPhase += dt * (8 + entity.hero.speed * 0.02);
        entity.stepTimer -= dt;
        if (entity.stepTimer <= 0) {
          entity.stepTimer = 0.3;
          this.spawnParticles(entity.x, entity.y + 10, 'rgba(163,255,222,.24)', 2, {
            speedMin: 4,
            speedMax: 22,
            sizeMin: 2,
            sizeMax: 4,
            lifeMin: 0.2,
            lifeMax: 0.45,
            shape: 'circle',
          });
        }
      } else {
        entity.walkPhase += dt * 2;
      }

      entity.inBush = this.worldMap.pointInBush(entity.x, entity.y);
      entity.hidden =
        entity.inBush &&
        this.elapsed - entity.lastAttackAt > 0.7 &&
        this.elapsed - entity.lastDamageAt > 1;
    }

    this.resolveOverlaps();
    for (const entity of this.entities) {
      if (!entity.alive) continue;
      entity.inBush = this.worldMap.pointInBush(entity.x, entity.y);
      entity.hidden =
        entity.inBush &&
        this.elapsed - entity.lastAttackAt > 0.7 &&
        this.elapsed - entity.lastDamageAt > 1;
    }
  }

  updatePlayer(player, dt) {
    let moveX = 0;
    let moveY = 0;
    if (this.touchMove.active) {
      moveX = this.touchMove.x;
      moveY = this.touchMove.y;
    } else {
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveY -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveY += 1;
    }
    if (moveX || moveY) this.moveActor(player, moveX, moveY, dt);

    if (player.aimSource === 'touch' && this.touchAim.active) {
      player.aim = Math.atan2(this.touchAim.y, this.touchAim.x);
    } else if (player.aimSource === 'mouse' && this.mouse.active) {
      player.aim = Math.atan2(this.mouse.y - player.y, this.mouse.x - player.x);
    }

    if (this.shooting) this.tryAttack(player, player.aim);
  }

  resolveOverlaps() {
    const active = this.entities.filter((entity) => entity.alive);
    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minimum = a.radius + b.radius - 3;
        if (dist <= 0 || dist >= minimum) continue;
        const push = (minimum - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        this.tryMove(a, -nx * push, -ny * push);
        this.tryMove(b, nx * push, ny * push);
      }
    }
  }

  respawnEntity(entity) {
    if (this.phase === 'ended') return;
    entity.x = entity.spawn.x + random(-7, 7);
    entity.y = entity.spawn.y + random(-7, 7);
    entity.hp = entity.maxHp;
    entity.alive = true;
    entity.ammo = entity.hero.attack.ammo;
    entity.reloadTimer = 0;
    entity.attackCooldown = 0.35;
    entity.invulnerableUntil = this.elapsed + 1.45;
    entity.lastDamageAt = -99;
    entity.lastAttackAt = -99;
    entity.hidden = false;
    entity.inBush = false;
    entity.moving = false;
    entity.knockback = null;
    entity.shieldHp = 0;
    entity.speedBoostUntil = 0;
    entity.slowUntil = 0;
    entity.respawnTimer = 0;
    entity.aim = Math.atan2(
      this.arena.gemMine.y - entity.y,
      this.arena.gemMine.x - entity.x,
    );
    this.effects.push({
      type: 'ring',
      x: entity.x,
      y: entity.y,
      startRadius: 10,
      endRadius: 62,
      width: 6,
      color: entity.team === 0 ? this.arena.palette.ally : this.arena.palette.enemy,
      life: 0.55,
      maxLife: 0.55,
    });
    this.spawnParticles(entity.x, entity.y, entity.hero.color, 18, {
      speedMin: 30,
      speedMax: 190,
      sizeMin: 1.5,
      sizeMax: 4,
      lifeMin: 0.25,
      lifeMax: 0.65,
      shape: 'diamond',
    });
    if (entity.isPlayer) {
      audio.play('spawn');
      this.emitEvent({ type: 'respawn' });
    }
  }

  checkOvertime(dt = 0) {
    if (this.phase !== 'playing') return;
    const ally = this.getTeamScore(0);
    const enemy = this.getTeamScore(1);

    if (this.overtimeTeam !== null) {
      const score = this.overtimeTeam === 0 ? ally : enemy;
      if (score < WORLD.gemGoal) {
        this.overtimeTeam = null;
        this.overtimeTimer = 0;
        this.emitEvent({ type: 'overtime-cancel' });
        this.emitHud(true);
        return;
      }
      this.overtimeTimer -= dt;
      if (this.overtimeTimer <= 0) {
        this.finish(this.overtimeTeam, 'overtime');
      }
      return;
    }

    if (ally >= WORLD.gemGoal || enemy >= WORLD.gemGoal) {
      let team;
      if (ally >= WORLD.gemGoal && enemy >= WORLD.gemGoal) {
        team = this.lastGemTeam === 1 ? 1 : 0;
      } else {
        team = ally >= WORLD.gemGoal ? 0 : 1;
      }
      this.overtimeTeam = team;
      this.overtimeTimer = WORLD.overtimeSeconds;
      this.emitEvent({
        type: 'overtime',
        team,
        seconds: WORLD.overtimeSeconds,
      });
      audio.play('overtime');
      this.emitHud(true);
    }
  }

  finishByTime() {
    const ally = this.getTeamScore(0);
    const enemy = this.getTeamScore(1);
    if (ally === enemy) {
      this.finish(null, 'time-draw');
      return;
    }
    this.finish(ally > enemy ? 0 : 1, 'time');
  }

  finish(winnerTeam, reason) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.shooting = false;
    this.touchMove.active = false;
    this.touchAim.active = false;
    this.keys.clear();
    this.result = matchResult(this, winnerTeam, reason);
    this.endTimer = 1.35;
    this.resultSent = false;
    this.shake = Math.max(this.shake, 8);
    awardMatch(this, winnerTeam);
    this.emitHud(true);
  }

  pause() {
    if (this.phase === 'ended') return;
    this.paused = true;
    this.shooting = false;
    this.keys.clear();
    this.emitHud(true);
  }

  resume() {
    if (this.phase === 'ended') return;
    this.paused = false;
    this.lastFrame = performance.now();
  }

  draw() {
    if (!this.ctx || this.destroyed) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    this.renderer.draw(this);
  }

  destroy() {
    this.destroyed = true;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
  }

  forceResult(team = 0) {
    this.finish(team, 'debug');
  }
}
