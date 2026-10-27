import { audio } from '../audio.js';
import { distance, random, roundedRect } from './utils.js';

const CRATE_SIZE = 48;
const CRATE_RADIUS = 27;
const CRATE_HP = 1150;
const CRATE_RESPAWN = 15;

const TARGET_SPOTS = [
  { x: 372, y: 226 },
  { x: 908, y: 494 },
  { x: 372, y: 494 },
  { x: 908, y: 226 },
];

function canPlaceCrate(worldMap, arena, crates, x, y) {
  if (worldMap.collides(x, y, CRATE_RADIUS + 5)) return false;
  if (worldMap.pointInBush(x, y, 9)) return false;
  if (distance(x, y, arena.gemMine.x, arena.gemMine.y) < 145) return false;
  for (const spawn of [...arena.spawns.ally, ...arena.spawns.enemy]) {
    if (distance(x, y, spawn.x, spawn.y) < 145) return false;
  }
  for (const crate of crates) {
    if (distance(x, y, crate.x, crate.y) < 145) return false;
  }
  return true;
}

function findOpenSpot(worldMap, arena, crates, target) {
  for (let radius = 0; radius <= 150; radius += 18) {
    const steps = radius === 0 ? 1 : 16;
    for (let index = 0; index < steps; index += 1) {
      const angle = (index / steps) * Math.PI * 2;
      const x = target.x + Math.cos(angle) * radius;
      const y = target.y + Math.sin(angle) * radius;
      if (canPlaceCrate(worldMap, arena, crates, x, y)) return { x, y };
    }
  }
  return null;
}

export function createCrates(worldMap, arena) {
  const crates = [];
  for (const target of TARGET_SPOTS) {
    const spot = findOpenSpot(worldMap, arena, crates, target);
    if (!spot) continue;
    crates.push({
      id: `crate-${crates.length + 1}`,
      x: spot.x,
      y: spot.y,
      w: CRATE_SIZE,
      h: CRATE_SIZE,
      radius: CRATE_RADIUS,
      hp: CRATE_HP,
      maxHp: CRATE_HP,
      alive: true,
      hitFlash: 0,
      respawnTimer: 0,
      phase: random(0, Math.PI * 2),
    });
  }
  return crates;
}

export function damageCrate(game, crate, amount, source) {
  if (!crate?.alive || amount <= 0) return 0;
  const damage = Math.max(1, Math.round(amount));
  crate.hp = Math.max(0, crate.hp - damage);
  crate.hitFlash = 0.14;
  game.addFloatingText(
    crate.x + random(-8, 8),
    crate.y - 42,
    `${damage}`,
    '#ffe3a0',
    13,
  );
  game.spawnParticles(crate.x, crate.y, '#ffd166', 7, {
    speedMin: 30,
    speedMax: 150,
    sizeMin: 1.2,
    sizeMax: 3,
    lifeMin: 0.12,
    lifeMax: 0.34,
    shape: 'spark',
  });
  audio.play('crateHit');

  if (crate.hp <= 0) {
    crate.alive = false;
    crate.respawnTimer = CRATE_RESPAWN;
    crate.hitFlash = 0;
    game.shake = Math.max(game.shake, 6);
    game.effects.push(
      {
        type: 'ring',
        x: crate.x,
        y: crate.y,
        startRadius: 12,
        endRadius: 78,
        width: 7,
        color: '#ffd166',
        life: 0.42,
        maxLife: 0.42,
      },
      {
        type: 'ring',
        x: crate.x,
        y: crate.y,
        startRadius: 30,
        endRadius: 120,
        width: 3,
        color: '#ffffff',
        life: 0.28,
        maxLife: 0.28,
      },
    );
    game.spawnParticles(crate.x, crate.y, '#ffd166', 24, {
      speedMin: 80,
      speedMax: 340,
      sizeMin: 2,
      sizeMax: 5,
      lifeMin: 0.22,
      lifeMax: 0.72,
      shape: 'diamond',
    });
    game.spawnParticles(crate.x, crate.y, '#fff3c4', 12, {
      speedMin: 30,
      speedMax: 220,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.12,
      lifeMax: 0.36,
      shape: 'spark',
    });
    game.dropGems(crate.x, crate.y, 2);
    game.addFloatingText(crate.x, crate.y - 58, 'انفجار!', '#ffe8a8', 15);
    audio.play('crateBreak');
    if (source?.isPlayer) {
      game.emitEvent({ type: 'crate', player: true });
    }
  }
  return damage;
}

export function updateCrates(game, dt) {
  for (const crate of game.crates) {
    crate.hitFlash = Math.max(0, crate.hitFlash - dt);
    if (crate.alive) continue;
    crate.respawnTimer -= dt;
    if (crate.respawnTimer > 0 || game.phase !== 'playing') continue;
    crate.alive = true;
    crate.hp = crate.maxHp;
    crate.hitFlash = 0;
    crate.respawnTimer = 0;
    game.effects.push({
      type: 'ring',
      x: crate.x,
      y: crate.y,
      startRadius: 6,
      endRadius: 46,
      width: 4,
      color: '#ffd166',
      life: 0.4,
      maxLife: 0.4,
    });
    game.spawnParticles(crate.x, crate.y, '#ffd166', 12, {
      speedMin: 20,
      speedMax: 110,
      sizeMin: 1.4,
      sizeMax: 3.2,
      lifeMin: 0.2,
      lifeMax: 0.5,
      shape: 'diamond',
    });
  }
}

function drawCrack(ctx, x1, y1, x2, y2, alpha) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(18, 10, 4, .82)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo((x1 + x2) / 2 + 4, (y1 + y2) / 2 - 3);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawCrate(ctx, game, crate) {
  const palette = game.arena.palette;
  const time = game.elapsed;
  const left = crate.x - crate.w / 2;
  const top = crate.y - crate.h / 2;
  const hpRatio = Math.max(0, crate.hp / crate.maxHp);

  ctx.save();
  ctx.fillStyle = 'rgba(2, 10, 16, .42)';
  ctx.beginPath();
  ctx.ellipse(crate.x + 4, crate.y + 23, 27, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!crate.alive) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(crate.x, crate.y + 19, 18, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const pulse = 0.55 + Math.sin(time * 2.4 + crate.phase) * 0.16;
  ctx.globalAlpha = pulse * 0.28;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(crate.x, crate.y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Side face.
  ctx.fillStyle = palette.border;
  roundedRect(ctx, left + 3, top + 8, crate.w, crate.h, 9);
  ctx.fill();

  // Front face.
  const front = ctx.createLinearGradient(left, top, left + crate.w, top + crate.h);
  front.addColorStop(0, '#a85b22');
  front.addColorStop(0.5, '#7f3f17');
  front.addColorStop(1, '#54250d');
  ctx.fillStyle = front;
  roundedRect(ctx, left, top, crate.w, crate.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#2a1207';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Top lid.
  const lid = ctx.createLinearGradient(left, top, left, top + 14);
  lid.addColorStop(0, '#f0b34b');
  lid.addColorStop(1, '#b96924');
  ctx.fillStyle = lid;
  roundedRect(ctx, left + 2, top + 2, crate.w - 4, 14, 6);
  ctx.fill();
  ctx.strokeStyle = '#4b240b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Metal straps.
  ctx.fillStyle = '#4c3c32';
  ctx.fillRect(left + 7, top + 18, 5, crate.h - 22);
  ctx.fillRect(left + crate.w - 12, top + 18, 5, crate.h - 22);
  ctx.fillStyle = '#ffd166';
  for (const x of [left + 9.5, left + crate.w - 9.5]) {
    for (const y of [top + 22, top + crate.h - 8]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center rune.
  ctx.save();
  ctx.translate(crate.x, crate.y + 5);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = 'rgba(255, 221, 122, .85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-8, -8, 16, 16);
  ctx.fillStyle = 'rgba(255, 209, 102, .3)';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();

  if (hpRatio < 0.76) {
    drawCrack(ctx, left + 12, top + 18, left + 25, top + 34, 0.75);
    drawCrack(ctx, left + 35, top + 17, left + 29, top + 31, 0.6);
  }
  if (hpRatio < 0.42) {
    drawCrack(ctx, left + 6, top + 30, left + 20, top + 41, 0.8);
    drawCrack(ctx, left + 28, top + 26, left + 41, top + 38, 0.7);
  }

  if (crate.hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, crate.hitFlash / 0.14) * 0.55;
    ctx.fillStyle = '#fff';
    roundedRect(ctx, left, top, crate.w, crate.h, 8);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  if (hpRatio < 1) {
    const barWidth = 42;
    const barY = top - 9;
    ctx.fillStyle = 'rgba(5, 8, 15, .78)';
    roundedRect(ctx, crate.x - barWidth / 2, barY, barWidth, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = hpRatio > 0.5 ? '#ffd166' : '#ff8c5e';
    roundedRect(ctx, crate.x - barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpRatio, 3, 1.5);
    ctx.fill();
  }

  ctx.restore();
}
