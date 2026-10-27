import { WORLD } from '../data.js';
import { audio } from '../audio.js';
import { damageCrate } from './props.js';
import { distance, pointSegmentDistance, random } from './utils.js';

function playCombatSound(game, name, parameter, x, y) {
  if (!game.player) return;
  const nearPlayer = distance(game.player.x, game.player.y, x, y) < 780;
  if (nearPlayer || game.player.alive === false) audio.play(name, parameter);
}

export function tryAttack(game, entity, angle) {
  if (!entity.alive || game.phase !== 'playing') return false;
  if (entity.attackCooldown > 0 || entity.ammo < 1) return false;
  const attack = entity.hero.attack;
  const startX = entity.x + Math.cos(angle) * (entity.radius + 8);
  const startY = entity.y + Math.sin(angle) * (entity.radius + 8);

  for (let index = 0; index < attack.count; index += 1) {
    const centerOffset = index - (attack.count - 1) / 2;
    const spreadOffset = centerOffset * attack.spread + (Math.random() - 0.5) * 0.018;
    const shotAngle = angle + spreadOffset;
    game.projectiles.push({
      id: ++game.projectileSequence,
      type: attack.type,
      x: startX,
      y: startY,
      vx: Math.cos(shotAngle) * attack.speed,
      vy: Math.sin(shotAngle) * attack.speed,
      angle: shotAngle,
      speed: attack.speed,
      damage: attack.damage,
      heal: attack.heal || 0,
      team: entity.team,
      owner: entity,
      range: attack.range,
      travelled: 0,
      radius: attack.projectileRadius,
      color: attack.color,
      trail: attack.trail,
      alive: true,
    });
  }

  entity.ammo -= 1;
  entity.attackCooldown = attack.cooldown;
  entity.recoil = Math.min(1, (entity.recoil || 0) + 1.2);
  entity.lastAttackAt = game.elapsed;
  entity.attackAnim = 1;
  entity.attackAngle = angle;
  entity.aim = angle;
  if (entity.ammo < attack.ammo) entity.reloadTimer = 0;

  const muzzleX = entity.x + Math.cos(angle) * (entity.radius + attack.muzzle);
  const muzzleY = entity.y + Math.sin(angle) * (entity.radius + attack.muzzle);
  game.effects.push({
    type: 'muzzle',
    x: muzzleX,
    y: muzzleY,
    angle,
    color: attack.color,
    size: attack.type === 'shotgun' ? 22 : 15,
    life: 0.09,
    maxLife: 0.09,
  });
  game.spawnParticles(muzzleX, muzzleY, attack.color, 6, {
    speedMin: 40,
    speedMax: 210,
    sizeMin: 1.2,
    sizeMax: 3.2,
    lifeMin: 0.08,
    lifeMax: 0.22,
    shape: 'spark',
    angle,
    cone: 0.7,
  });
  if (attack.type === 'shotgun') game.shake = Math.max(game.shake, entity.isPlayer ? 3.5 : 2.5);
  else if (entity.isPlayer) game.shake = Math.max(game.shake, 1.2);
  playCombatSound(game, 'shoot', attack.type, entity.x, entity.y);
  return true;
}

function hitEnemiesInRadius(game, source, x, y, radius, damage, options = {}) {
  for (const enemy of game.entities) {
    if (!enemy.alive || enemy.team === source.team) continue;
    if (distance(enemy.x, enemy.y, x, y) > radius + enemy.radius) continue;
    applyDamage(game, enemy, damage, source, options);
    if (options.slow) enemy.slowUntil = Math.max(enemy.slowUntil, game.elapsed + options.slow);
    if (options.knockback) {
      const angle = Math.atan2(enemy.y - y, enemy.x - x);
      const force = options.knockback;
      enemy.knockback = {
        x: Math.cos(angle) * force,
        y: Math.sin(angle) * force,
        time: 0.24,
        maxTime: 0.24,
      };
    }
  }
}

export function useSuper(game, entity, angle = entity.aim) {
  if (!entity.alive || game.phase !== 'playing' || entity.superCharge < 1) return false;
  const superData = entity.hero.super;
  const team = entity.team;
  entity.superCharge = 0;
  entity.lastAttackAt = game.elapsed;
  entity.recoil = 1.4;
  entity.attackAnim = 1;
  entity.attackAngle = angle;
  entity.aim = angle;
  game.emitEvent({
    type: 'super',
    heroId: entity.heroId,
    team,
    text: superData.name,
    player: entity.isPlayer,
  });
  audio.play('super', superData.type);

  if (superData.type === 'quake') {
    game.shake = Math.max(game.shake, entity.isPlayer ? 14 : 9);
    game.effects.push(
      {
        type: 'ring',
        x: entity.x,
        y: entity.y,
        startRadius: 18,
        endRadius: superData.radius,
        width: 14,
        color: entity.hero.color,
        life: 0.55,
        maxLife: 0.55,
      },
      {
        type: 'ring',
        x: entity.x,
        y: entity.y,
        startRadius: 36,
        endRadius: superData.radius * 1.14,
        width: 4,
        color: '#ffe49a',
        life: 0.72,
        maxLife: 0.72,
      },
    );
    game.spawnParticles(entity.x, entity.y, entity.hero.color, 34, {
      speedMin: 80,
      speedMax: 420,
      sizeMin: 2,
      sizeMax: 6,
      lifeMin: 0.25,
      lifeMax: 0.74,
      shape: 'circle',
    });
    hitEnemiesInRadius(game, entity, entity.x, entity.y, superData.radius, superData.damage, {
      slow: superData.slow,
      knockback: 300,
    });
    for (const crate of game.crates) {
      if (crate.alive && distance(crate.x, crate.y, entity.x, entity.y) <= superData.radius + crate.radius) {
        damageCrate(game, crate, superData.damage, entity);
      }
    }
    entity.shieldHp = Math.max(entity.shieldHp, 900);
    entity.shieldUntil = Math.max(entity.shieldUntil, game.elapsed + superData.shield);
    game.addFloatingText(entity.x, entity.y - 58, 'درع!', '#9dfcff', 16);
    return true;
  }

  if (superData.type === 'beam') {
    const wallDistance = game.worldMap.raycast(entity.x, entity.y, angle, superData.length, 5);
    const length = Math.min(superData.length, wallDistance);
    const endX = entity.x + Math.cos(angle) * length;
    const endY = entity.y + Math.sin(angle) * length;
    game.effects.push({
      type: 'beam',
      x: entity.x,
      y: entity.y,
      angle,
      length,
      width: superData.width,
      color: entity.hero.color,
      life: 0.34,
      maxLife: 0.34,
    });
    game.spawnParticles(endX, endY, '#e9ffff', 22, {
      speedMin: 60,
      speedMax: 360,
      sizeMin: 1.3,
      sizeMax: 4,
      lifeMin: 0.15,
      lifeMax: 0.55,
      shape: 'spark',
    });
    game.shake = Math.max(game.shake, entity.isPlayer ? 10 : 7);
    for (const enemy of game.entities) {
      if (!enemy.alive || enemy.team === team) continue;
      const projection =
        (enemy.x - entity.x) * Math.cos(angle) + (enemy.y - entity.y) * Math.sin(angle);
      if (projection < 0 || projection > length) continue;
      const perpendicular = Math.abs(
        (enemy.x - entity.x) * Math.sin(angle) - (enemy.y - entity.y) * Math.cos(angle),
      );
      if (perpendicular > superData.width / 2 + enemy.radius) continue;
      applyDamage(game, enemy, superData.damage, entity, { beam: true });
    }
    for (const crate of game.crates) {
      if (!crate.alive) continue;
      const projection =
        (crate.x - entity.x) * Math.cos(angle) + (crate.y - entity.y) * Math.sin(angle);
      if (projection < 0 || projection > length) continue;
      const perpendicular = Math.abs(
        (crate.x - entity.x) * Math.sin(angle) - (crate.y - entity.y) * Math.cos(angle),
      );
      if (perpendicular <= superData.width / 2 + crate.radius) {
        damageCrate(game, crate, superData.damage, entity);
      }
    }
    return true;
  }

  if (superData.type === 'heal') {
    game.effects.push(
      {
        type: 'ring',
        x: entity.x,
        y: entity.y,
        startRadius: 20,
        endRadius: superData.radius,
        width: 12,
        color: '#39ffcb',
        life: 0.8,
        maxLife: 0.8,
      },
      {
        type: 'ring',
        x: entity.x,
        y: entity.y,
        startRadius: 38,
        endRadius: superData.radius * 0.84,
        width: 5,
        color: '#ff9add',
        life: 1.05,
        maxLife: 1.05,
      },
    );
    game.spawnParticles(entity.x, entity.y, '#7ffff0', 38, {
      speedMin: 70,
      speedMax: 300,
      sizeMin: 2,
      sizeMax: 5,
      lifeMin: 0.35,
      lifeMax: 0.9,
      shape: 'diamond',
    });
    for (const ally of game.entities) {
      if (!ally.alive || ally.team !== team) continue;
      if (distance(ally.x, ally.y, entity.x, entity.y) > superData.radius) continue;
      healEntity(game, ally, superData.heal, entity);
      ally.shieldHp = Math.max(ally.shieldHp, superData.shield);
      ally.shieldUntil = Math.max(ally.shieldUntil, game.elapsed + superData.duration);
      ally.speedBoostUntil = Math.max(ally.speedBoostUntil, game.elapsed + superData.duration);
      game.effects.push({
        type: 'ring',
        x: ally.x,
        y: ally.y,
        startRadius: 12,
        endRadius: 48,
        width: 5,
        color: '#7dffe6',
        life: 0.55,
        maxLife: 0.55,
      });
    }
    return true;
  }

  if (superData.type === 'dash') {
    const stepSize = 8;
    let travelled = 0;
    let endX = entity.x;
    let endY = entity.y;
    const dx = Math.cos(angle) * stepSize;
    const dy = Math.sin(angle) * stepSize;
    while (travelled < superData.distance) {
      const nextX = endX + dx;
      const nextY = endY + dy;
      if (game.blocksMovement(nextX, nextY, entity.radius)) break;
      endX = nextX;
      endY = nextY;
      travelled += stepSize;
    }
    game.effects.push({
      type: 'dash',
      x: entity.x,
      y: entity.y,
      x2: endX,
      y2: endY,
      color: entity.hero.color2,
      life: 0.32,
      maxLife: 0.32,
    });
    const hit = new Set();
    for (const enemy of game.entities) {
      if (!enemy.alive || enemy.team === team) continue;
      const nearPath =
        pointSegmentDistance(enemy.x, enemy.y, entity.x, entity.y, endX, endY) <
        enemy.radius + 28;
      if (!nearPath || hit.has(enemy.id)) continue;
      hit.add(enemy.id);
      applyDamage(game, enemy, superData.damage, entity);
      const knockAngle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
      enemy.knockback = {
        x: Math.cos(knockAngle) * 180,
        y: Math.sin(knockAngle) * 180,
        time: 0.2,
        maxTime: 0.2,
      };
    }
    for (const crate of game.crates) {
      if (!crate.alive) continue;
      if (
        pointSegmentDistance(crate.x, crate.y, entity.x, entity.y, endX, endY) <
        crate.radius + 30
      ) {
        damageCrate(game, crate, superData.damage * 1.25, entity);
      }
    }
    entity.x = endX;
    entity.y = endY;
    entity.invulnerableUntil = Math.max(entity.invulnerableUntil, game.elapsed + 0.16);
    entity.speedBoostUntil = Math.max(entity.speedBoostUntil, game.elapsed + 1.1);
    game.spawnParticles(entity.x, entity.y, entity.hero.color2, 30, {
      speedMin: 30,
      speedMax: 280,
      sizeMin: 1.5,
      sizeMax: 4,
      lifeMin: 0.2,
      lifeMax: 0.6,
      shape: 'spark',
    });
    game.shake = Math.max(game.shake, entity.isPlayer ? 8 : 4);
    return true;
  }

  return false;
}

export function applyDamage(game, target, amount, source, options = {}) {
  if (!target.alive || game.phase === 'ended') return 0;
  if (target.invulnerableUntil > game.elapsed) return 0;
  let remaining = amount;
  if (target.shieldHp > 0) {
    const absorbed = Math.min(target.shieldHp, remaining);
    target.shieldHp -= absorbed;
    remaining -= absorbed;
    if (target.shieldHp <= 0) target.shieldHp = 0;
  }
  if (remaining <= 0) {
    game.addFloatingText(target.x, target.y - 56, 'درع', '#a8f8ff', 13);
    return 0;
  }

  target.hp = Math.max(0, target.hp - remaining);
  target.lastDamageAt = game.elapsed;
  target.flashUntil = game.elapsed + 0.12;
  target.hitAnim = 1;
  target.hitAngle = source
    ? Math.atan2(target.y - source.y, target.x - source.x)
    : target.aim;
  target.damageTaken = (target.damageTaken || 0) + remaining;
  if (target.inBush) target.hidden = false;

  if (source) {
    source.damage = (source.damage || 0) + remaining;
    const cost = source.hero.super.cost || 3200;
    source.superCharge = Math.min(1, source.superCharge + remaining / cost);
    if (source.isPlayer) source.playerDamage = (source.playerDamage || 0) + remaining;
  }

  const playerInvolved = source?.isPlayer || target.isPlayer;
  game.addFloatingText(
    target.x + random(-8, 8),
    target.y - 54,
    `${Math.round(remaining)}`,
    target.isPlayer ? '#ffd8d8' : '#fff8d5',
    options.beam ? 21 : remaining > 900 ? 19 : 14,
  );
  game.spawnParticles(target.x, target.y, source?.hero.color || '#ffd45e', options.beam ? 18 : 8, {
    speedMin: 60,
    speedMax: 260,
    sizeMin: 1.3,
    sizeMax: 3.6,
    lifeMin: 0.12,
    lifeMax: 0.4,
    shape: 'spark',
  });
  if (playerInvolved) {
    game.shake = Math.max(game.shake, options.beam ? 6 : 2.5);
    if (!options.beam && target.hp > 0) game.hitStop = Math.max(game.hitStop || 0, 0.028);
    audio.play('hit');
  }
  if (target.hp <= 0) killEntity(game, target, source);
  return remaining;
}

export function healEntity(game, target, amount, source) {
  if (!target.alive) return 0;
  const missing = target.maxHp - target.hp;
  if (missing <= 0) return 0;
  const healed = Math.min(missing, amount);
  target.hp += healed;
  game.addFloatingText(target.x, target.y - 54, `+${Math.round(healed)}`, '#79ffc7', 14);
  game.spawnParticles(target.x, target.y, '#61ffcd', 9, {
    speedMin: 30,
    speedMax: 130,
    sizeMin: 1.5,
    sizeMax: 3.5,
    lifeMin: 0.25,
    lifeMax: 0.65,
    shape: 'diamond',
  });
  if (target.isPlayer) audio.play('heal');
  if (source) {
    const cost = source.hero.super.cost || 3000;
    source.superCharge = Math.min(1, source.superCharge + (healed / cost) * 0.5);
  }
  return healed;
}

export function killEntity(game, entity, source) {
  if (!entity.alive) return;
  entity.alive = false;
  entity.hp = 0;
  entity.respawnTimer = 3.3;
  entity.deathTimer = entity.deathDuration || 0.72;
  entity.deathAngle = entity.aim;
  entity.animState = 'death';
  entity.attackAnim = 0;
  entity.hitAnim = 0;
  entity.inputX = 0;
  entity.inputY = 0;
  entity.vx = 0;
  entity.vy = 0;
  entity.deaths += 1;
  entity.shieldHp = 0;
  entity.knockback = null;
  entity.superCharge = Math.min(entity.superCharge, 0.35);
  entity.moving = false;
  if (source) {
    source.kills = (source.kills || 0) + 1;
    source.superCharge = Math.min(1, source.superCharge + 0.08);
  }
  const dropped = entity.gems;
  entity.gems = 0;
  game.dropGems(entity.x, entity.y, dropped);
  game.effects.push({
    type: 'ring',
    x: entity.x,
    y: entity.y,
    startRadius: 12,
    endRadius: 76,
    width: 8,
    color: entity.hero.color,
    life: 0.48,
    maxLife: 0.48,
  });
  game.spawnParticles(entity.x, entity.y, entity.hero.color, 26, {
    speedMin: 70,
    speedMax: 330,
    sizeMin: 2,
    sizeMax: 6,
    lifeMin: 0.3,
    lifeMax: 0.9,
    shape: 'circle',
  });
  game.spawnParticles(entity.x, entity.y, entity.hero.color2, 15, {
    speedMin: 50,
    speedMax: 280,
    sizeMin: 2,
    sizeMax: 5,
    lifeMin: 0.25,
    lifeMax: 0.75,
    shape: 'diamond',
  });
  if (entity.isPlayer || source?.isPlayer) {
    game.shake = Math.max(game.shake, 10);
  }
  audio.play('death');
  game.emitEvent({
    type: 'kill',
    victim: entity.name,
    victimTeam: entity.team,
    killer: source?.name || '',
    killerTeam: source?.team ?? null,
    playerInvolved: entity.isPlayer || source?.isPlayer || false,
    playerKilled: source?.isPlayer || false,
    playerDied: entity.isPlayer,
  });
  if (entity.team === 0) {
    game.checkOvertime?.();
  }
}

export function playerStatsFor(game) {
  const player = game.player;
  return {
    kills: player.kills,
    deaths: player.deaths,
    gems: player.gemsCollected,
    damage: Math.round(player.playerDamage || 0),
  };
}

export function matchResult(game, winnerTeam, reason) {
  const ally = game.getTeamScore(0);
  const enemy = game.getTeamScore(1);
  return {
    winner: winnerTeam,
    draw: winnerTeam === null,
    playerWon: winnerTeam === 0,
    reason,
    scores: { ally, enemy },
    playerStats: playerStatsFor(game),
    duration: Math.round(game.elapsed - game.countdownDuration),
    teamMembers: {
      ally: game.entities.filter((entity) => entity.team === 0).map((entity) => ({
        name: entity.name,
        heroId: entity.heroId,
        isPlayer: entity.isPlayer,
      })),
      enemy: game.entities.filter((entity) => entity.team === 1).map((entity) => ({
        name: entity.name,
        heroId: entity.heroId,
      })),
    },
  };
}

export function awardMatch(game, winnerTeam) {
  const playerWon = winnerTeam === 0;
  audio.play(playerWon ? 'victory' : 'defeat');
  game.emitEvent({
    type: 'match-end',
    playerWon,
    draw: winnerTeam === null,
    winnerTeam,
    scores: { ally: game.getTeamScore(0), enemy: game.getTeamScore(1) },
  });
}

export function gemGoalText() {
  return `${WORLD.gemGoal}`;
}
