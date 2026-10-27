import { audio } from '../audio.js';
import { distance, random } from './utils.js';
import { applyDamage, healEntity } from './combat.js';
import { damageCrate } from './props.js';

export function spawnParticles(game, x, y, color, count = 8, options = {}) {
  if (game.particles.length > 520) return;
  const {
    speedMin = 40,
    speedMax = 180,
    sizeMin = 1.5,
    sizeMax = 4,
    lifeMin = 0.2,
    lifeMax = 0.55,
    shape = 'circle',
    angle,
    cone = Math.PI * 2,
    gravity = 0,
  } = options;
  for (let index = 0; index < count; index += 1) {
    const direction =
      angle === undefined
        ? random(0, Math.PI * 2)
        : angle + random(-cone / 2, cone / 2);
    const speed = random(speedMin, speedMax);
    game.particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      color,
      size: random(sizeMin, sizeMax),
      life: random(lifeMin, lifeMax),
      maxLife: 0.001,
      shape,
      rotation: random(0, Math.PI * 2),
      spin: random(-8, 8),
      gravity,
      drag: 0.9,
      alpha: 1,
    });
    const particle = game.particles[game.particles.length - 1];
    particle.maxLife = particle.life;
  }
}

export function addFloatingText(game, x, y, text, color, size = 15) {
  game.floatingTexts.push({
    x,
    y,
    text,
    color,
    size,
    vy: -34,
    life: 0.8,
    maxLife: 0.8,
  });
  if (game.floatingTexts.length > 80) game.floatingTexts.shift();
}

export function dropGems(game, x, y, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(45, 150);
    game.gems.push({
      id: ++game.gemSequence,
      x: x + random(-7, 7),
      y: y + random(-7, 7),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      delay: 0.78,
      dropped: true,
      pickedBy: null,
    });
  }
}

export function spawnGem(game, x = game.arena.gemMine.x, y = game.arena.gemMine.y, fromMine = true) {
  const angle = random(0, Math.PI * 2);
  const radius = fromMine ? random(22, 53) : random(0, 16);
  const px = x + Math.cos(angle) * radius;
  const py = y + Math.sin(angle) * radius;
  game.gems.push({
    id: ++game.gemSequence,
    x: px,
    y: py,
    vx: fromMine ? Math.cos(angle) * random(8, 40) : random(-60, 60),
    vy: fromMine ? Math.sin(angle) * random(8, 40) : random(-60, 60),
    age: 0,
    delay: fromMine ? 0.28 : 0.7,
    dropped: !fromMine,
    pickedBy: null,
  });
  if (fromMine) {
    spawnParticles(game, px, py, '#7dffea', 8, {
      speedMin: 20,
      speedMax: 100,
      sizeMin: 1.2,
      sizeMax: 3,
      lifeMin: 0.2,
      lifeMax: 0.5,
      shape: 'diamond',
    });
  }
}

export function updateGems(game, dt) {
  for (const gem of game.gems) {
    gem.age += dt;
    gem.x += gem.vx * dt;
    gem.y += gem.vy * dt;
    gem.vx *= Math.exp(-4.2 * dt);
    gem.vy *= Math.exp(-4.2 * dt);
    if (gem.vx || gem.vy) {
      if (game.worldMap.collides(gem.x, gem.y, 8)) {
        gem.x -= gem.vx * dt;
        gem.y -= gem.vy * dt;
        gem.vx *= -0.45;
        gem.vy *= -0.45;
      }
    }
  }

  for (const gem of [...game.gems]) {
    if (gem.age < gem.delay) continue;
    let collector = null;
    let bestDistance = 32;
    for (const entity of game.entities) {
      if (!entity.alive) continue;
      const dist = distance(entity.x, entity.y, gem.x, gem.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        collector = entity;
      }
    }
    if (!collector) continue;
    collector.gems += 1;
    if (collector.isPlayer) {
      collector.gemsCollected += 1;
      audio.play('gem');
    }
    game.lastGemTeam = collector.team;
    game.effects.push({
      type: 'ring',
      x: gem.x,
      y: gem.y,
      startRadius: 3,
      endRadius: 28,
      width: 3,
      color: collector.team === 0 ? game.arena.palette.ally : game.arena.palette.enemy,
      life: 0.25,
      maxLife: 0.25,
    });
    spawnParticles(game, gem.x, gem.y, '#8affec', 8, {
      speedMin: 20,
      speedMax: 120,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.2,
      lifeMax: 0.45,
      shape: 'diamond',
    });
    game.gems = game.gems.filter((entry) => entry !== gem);
    game.emitEvent({ type: 'gem', team: collector.team, player: collector.isPlayer });
  }
  if (game.gems.length > 35) game.gems = game.gems.slice(-35);
}

export function updateProjectiles(game, dt) {
  for (const projectile of game.projectiles) {
    if (!projectile.alive) continue;
    const totalDistance = projectile.speed * dt;
    const steps = Math.max(1, Math.ceil(totalDistance / 14));
    const stepX = (projectile.vx * dt) / steps;
    const stepY = (projectile.vy * dt) / steps;
    for (let step = 0; step < steps && projectile.alive; step += 1) {
      projectile.x += stepX;
      projectile.y += stepY;
      projectile.travelled += totalDistance / steps;

      if (game.worldMap.pointInWall(projectile.x, projectile.y)) {
        projectile.alive = false;
        spawnParticles(game, projectile.x, projectile.y, projectile.color, 7, {
          speedMin: 25,
          speedMax: 130,
          sizeMin: 1,
          sizeMax: 2.7,
          lifeMin: 0.1,
          lifeMax: 0.3,
          shape: 'spark',
        });
        game.effects.push({
          type: 'ring',
          x: projectile.x,
          y: projectile.y,
          startRadius: 2,
          endRadius: 14,
          width: 2,
          color: projectile.color,
          life: 0.16,
          maxLife: 0.16,
        });
        break;
      }

      if (projectile.heal <= 0) {
        for (const crate of game.crates) {
          if (!crate.alive) continue;
          if (distance(crate.x, crate.y, projectile.x, projectile.y) > crate.radius + projectile.radius + 2) {
            continue;
          }
          damageCrate(game, crate, projectile.damage, projectile.owner);
          projectile.alive = false;
          spawnParticles(game, projectile.x, projectile.y, projectile.color, 8, {
            speedMin: 35,
            speedMax: 180,
            sizeMin: 1,
            sizeMax: 3,
            lifeMin: 0.1,
            lifeMax: 0.35,
            shape: 'spark',
          });
          break;
        }
      }
      if (!projectile.alive) break;

      for (const entity of game.entities) {
        if (!entity.alive) continue;
        if (entity === projectile.owner) continue;
        const dist = distance(entity.x, entity.y, projectile.x, projectile.y);
        if (dist > entity.radius + projectile.radius + 4) continue;

        if (projectile.team === entity.team) {
          if (projectile.heal > 0) {
            const missing = entity.maxHp - entity.hp;
            if (missing > 1) {
              healEntity(game, entity, projectile.heal, projectile.owner);
              projectile.alive = false;
              break;
            }
          }
          continue;
        }
        applyDamage(game, entity, projectile.damage, projectile.owner);
        projectile.alive = false;
        break;
      }

      if (projectile.travelled >= projectile.range) {
        projectile.alive = false;
      }
    }
  }
  game.projectiles = game.projectiles.filter((projectile) => projectile.alive);
}

export function updateParticles(game, dt) {
  for (const particle of game.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.exp(-(particle.drag || 0.8) * dt * 6);
    particle.vy = particle.vy * Math.exp(-(particle.drag || 0.8) * dt * 6) + particle.gravity * dt;
    particle.rotation += particle.spin * dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);

  for (const floating of game.floatingTexts) {
    floating.life -= dt;
    floating.y += floating.vy * dt;
    floating.vy += 24 * dt;
  }
  game.floatingTexts = game.floatingTexts.filter((floating) => floating.life > 0);

  for (const effect of game.effects) {
    effect.life -= dt;
  }
  game.effects = game.effects.filter((effect) => effect.life > 0);
  game.shake = Math.max(0, game.shake - dt * 32);
}
