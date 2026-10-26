import { DIFFICULTY, WORLD } from '../data.js';
import { distance, normalize, random } from './utils.js';

const IDEAL_RANGE = {
  tank: 0.44,
  marksman: 0.82,
  support: 0.68,
  assassin: 0.48,
};

function ensureAI(bot) {
  if (!bot.ai) {
    bot.ai = {
      target: null,
      targetTimer: 0,
      decisionTimer: 0,
      pathTimer: 0,
      path: [],
      goal: null,
      lastGoal: null,
      strafe: Math.random() > 0.5 ? 1 : -1,
      reaction: random(0.1, 0.35),
      stuckTimer: 0,
      lastX: bot.x,
      lastY: bot.y,
      superDelay: random(0.2, 0.8),
    };
  }
  return bot.ai;
}

function pickTarget(game, bot) {
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const enemy of game.entities) {
    if (!enemy.alive || enemy.team === bot.team) continue;
    const dist = distance(bot.x, bot.y, enemy.x, enemy.y);
    if (dist > DIFFICULTY.detection) continue;
    if (!game.canSee(bot, enemy)) continue;
    let score = dist;
    if (enemy.gems >= 4) score -= 80;
    if (enemy === game.player) score -= 20;
    if (enemy.hp < enemy.maxHp * 0.25) score -= 55;
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  }
  return best;
}

function nearestGemFor(game, bot) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const gem of game.gems) {
    if (gem.age < gem.delay) continue;
    const dist = distance(bot.x, bot.y, gem.x, gem.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = gem;
    }
  }
  return best ? { gem: best, distance: bestDistance } : null;
}

function aimWithError(bot, target, projectileSpeed) {
  const travelTime = Math.min(0.28, distance(bot.x, bot.y, target.x, target.y) / Math.max(500, projectileSpeed));
  const predictedX = target.x + (target.velocityX || 0) * travelTime * 0.9;
  const predictedY = target.y + (target.velocityY || 0) * travelTime * 0.9;
  const base = Math.atan2(predictedY - bot.y, predictedX - bot.x);
  const error = (Math.random() - 0.5) * DIFFICULTY.aimError * 2;
  return base + error;
}

function chooseGoal(game, bot, target) {
  const hero = bot.hero;
  const attackRange = hero.attack.range;
  const mine = game.arena.gemMine;
  const ownGem = nearestGemFor(game, bot);
  const teamGems = game.getTeamScore(bot.team);
  const lowHealth = bot.hp < bot.maxHp * 0.32;
  const spawn = bot.spawn;

  if (lowHealth && target) {
    const targetDistance = distance(bot.x, bot.y, target.x, target.y);
    if (targetDistance < 470) {
      return {
        x: spawn.x + random(-18, 18),
        y: spawn.y + random(-18, 18),
        mode: 'retreat',
      };
    }
  }

  if (ownGem && ownGem.distance < 330) {
    const enemyClose = target ? distance(bot.x, bot.y, target.x, target.y) < 230 : false;
    if (!enemyClose || ownGem.distance < 130) {
      return { x: ownGem.gem.x, y: ownGem.gem.y, mode: 'gem' };
    }
  }

  if (target) {
    const dist = distance(bot.x, bot.y, target.x, target.y);
    const ideal = Math.max(120, attackRange * (IDEAL_RANGE[hero.roleKey] || 0.6));
    if (teamGems >= WORLD.gemGoal && bot.gems > 0 && bot.hp < bot.maxHp * 0.6) {
      return { x: spawn.x, y: spawn.y, mode: 'protect' };
    }
    if (dist > ideal * 1.18) {
      return { x: target.x, y: target.y, mode: 'approach' };
    }
    if (dist < ideal * 0.7) {
      const angle = Math.atan2(bot.y - target.y, bot.x - target.x);
      return {
        x: bot.x + Math.cos(angle) * 120,
        y: bot.y + Math.sin(angle) * 120,
        mode: 'kite',
      };
    }
    const perpendicular = Math.atan2(target.y - bot.y, target.x - bot.x) + Math.PI / 2;
    if (Math.random() < 0.16) bot.ai.strafe *= -1;
    const strafeRadius = Math.min(150, dist * 0.42);
    return {
      x: bot.x + Math.cos(perpendicular) * strafeRadius * bot.ai.strafe,
      y: bot.y + Math.sin(perpendicular) * strafeRadius * bot.ai.strafe,
      mode: 'strafe',
    };
  }

  if (ownGem && ownGem.distance < 620) {
    return { x: ownGem.gem.x, y: ownGem.gem.y, mode: 'gem' };
  }

  const offsetAngle = (bot.slot / 3) * Math.PI * 2 + (bot.team === 0 ? 0.3 : 2.2);
  const ring = bot.team === 0 ? 125 : 120;
  return {
    x: mine.x + Math.cos(offsetAngle) * ring,
    y: mine.y + Math.sin(offsetAngle) * ring,
    mode: 'mine',
  };
}

function maybeUseSuper(game, bot, target) {
  if (bot.superCharge < 1 || !bot.alive) return;
  const ai = ensureAI(bot);
  if (ai.superDelay > 0) return;
  const type = bot.hero.super.type;
  if (type === 'quake') {
    const closeEnemies = game.entities.filter(
      (entity) =>
        entity.alive &&
        entity.team !== bot.team &&
        distance(entity.x, entity.y, bot.x, bot.y) < bot.hero.super.radius * 0.9,
    );
    if (closeEnemies.length) {
      game.useSuper(bot);
      ai.superDelay = 0.6;
    }
    return;
  }
  if (type === 'beam') {
    if (target) {
      const dist = distance(bot.x, bot.y, target.x, target.y);
      if (dist < bot.hero.super.length && dist > 80 && game.canSee(bot, target)) {
        const angle = Math.atan2(target.y - bot.y, target.x - bot.x);
        game.useSuper(bot, angle + (Math.random() - 0.5) * 0.06);
        ai.superDelay = 0.6;
      }
    }
    return;
  }
  if (type === 'heal') {
    const hurtAlly = game.entities.some(
      (entity) =>
        entity.alive &&
        entity.team === bot.team &&
        entity.hp < entity.maxHp * 0.6 &&
        distance(entity.x, entity.y, bot.x, bot.y) < bot.hero.super.radius * 0.85,
    );
    if (hurtAlly) {
      game.useSuper(bot);
      ai.superDelay = 0.7;
    }
    return;
  }
  if (type === 'dash' && target) {
    const dist = distance(bot.x, bot.y, target.x, target.y);
    if (dist > 110 && dist < bot.hero.super.distance * 1.1) {
      const angle = Math.atan2(target.y - bot.y, target.x - bot.x);
      game.useSuper(bot, angle);
      ai.superDelay = 0.6;
    }
  }
}

function followGoal(game, bot, dt) {
  const ai = bot.ai;
  ai.pathTimer -= dt;
  const goal = ai.goal;
  if (!goal) return;
  const goalMoved = !ai.lastGoal || distance(goal.x, goal.y, ai.lastGoal.x, ai.lastGoal.y) > 58;
  const needsPath =
    ai.pathTimer <= 0 ||
    goalMoved ||
    (!ai.path.length && !game.worldMap.lineOfSight(bot.x, bot.y, goal.x, goal.y, 8));

  if (needsPath) {
    const clear = game.worldMap.lineOfSight(bot.x, bot.y, goal.x, goal.y, 14);
    ai.path = clear ? [] : game.worldMap.findPath(bot.x, bot.y, goal.x, goal.y);
    ai.lastGoal = { x: goal.x, y: goal.y };
    ai.pathTimer = DIFFICULTY.pathInterval + random(-0.08, 0.12);
  }

  while (ai.path.length && distance(bot.x, bot.y, ai.path[0].x, ai.path[0].y) < 24) {
    ai.path.shift();
  }

  const waypoint = ai.path.length ? ai.path[0] : goal;
  const direction = normalize(waypoint.x - bot.x, waypoint.y - bot.y);
  if (direction.length < 0.01) return;

  let vertical = direction.y;
  let horizontal = direction.x;
  if (ai.target && ai.goal.mode === 'strafe') {
    const wobble = Math.sin(game.elapsed * 2.2 + bot.id) * 0.12;
    vertical += wobble;
    horizontal -= wobble;
  }

  const separation = { x: 0, y: 0 };
  for (const other of game.entities) {
    if (other === bot || !other.alive || other.team !== bot.team) continue;
    const dist = distance(bot.x, bot.y, other.x, other.y);
    if (dist > 0 && dist < 72) {
      const push = (72 - dist) / 72;
      separation.x += ((bot.x - other.x) / dist) * push;
      separation.y += ((bot.y - other.y) / dist) * push;
    }
  }

  game.moveActor(bot, horizontal + separation.x * 1.4, vertical + separation.y * 1.4, dt, 1);
}

export function updateBot(game, bot, dt) {
  if (!bot.alive) return;
  const ai = ensureAI(bot);
  ai.reaction -= dt;
  ai.decisionTimer -= dt;
  ai.superDelay = Math.max(0, ai.superDelay - dt);

  if (!ai.target || !ai.target.alive || !game.canSee(bot, ai.target)) {
    const found = pickTarget(game, bot);
    if (found !== ai.target) {
      ai.target = found;
      ai.reaction = Math.max(ai.reaction, DIFFICULTY.reaction + random(0, 0.16));
    }
  } else if (ai.targetTimer <= 0) {
    const found = pickTarget(game, bot);
    if (found && found !== ai.target) {
      ai.target = found;
      ai.reaction = Math.max(ai.reaction, DIFFICULTY.reaction * 0.8);
    }
    ai.targetTimer = 0.35;
  }
  ai.targetTimer -= dt;

  const target = ai.target;
  if (ai.decisionTimer <= 0 || !ai.goal) {
    ai.goal = chooseGoal(game, bot, target);
    ai.decisionTimer = random(0.24, 0.42);
  }

  maybeUseSuper(game, bot, target);

  if (target) {
    const dist = distance(bot.x, bot.y, target.x, target.y);
    const range = bot.hero.attack.range;
    if (ai.reaction <= 0 && dist <= range * 1.04 && game.canSee(bot, target)) {
      const angle = aimWithError(bot, target, bot.hero.attack.speed);
      const used = game.tryAttack(bot, angle);
      if (used) ai.reaction = random(0.08, 0.18);
    } else if (bot.hero.roleKey === 'support') {
      const ally = game.entities
        .filter(
          (entity) =>
            entity.alive &&
            entity.team === bot.team &&
            entity !== bot &&
            entity.hp < entity.maxHp * 0.82 &&
            distance(entity.x, entity.y, bot.x, bot.y) < range * 0.92,
        )
        .sort(
          (a, b) =>
            distance(bot.x, bot.y, a.x, a.y) - distance(bot.x, bot.y, b.x, b.y),
        )[0];
      if (ally && dist > 260) {
        const angle = Math.atan2(ally.y - bot.y, ally.x - bot.x);
        game.tryAttack(bot, angle);
      }
    }
    if (dist < DIFFICULTY.detection) {
      const desiredAim = Math.atan2(target.y - bot.y, target.x - bot.x);
      bot.aim += Math.atan2(Math.sin(desiredAim - bot.aim), Math.cos(desiredAim - bot.aim)) * Math.min(1, dt * 9);
    }
  } else {
    const movingAngle = Math.atan2(ai.goal.y - bot.y, ai.goal.x - bot.x);
    bot.aim += Math.atan2(Math.sin(movingAngle - bot.aim), Math.cos(movingAngle - bot.aim)) * Math.min(1, dt * 6);
  }

  followGoal(game, bot, dt);

  const moved = distance(bot.x, bot.y, ai.lastX, ai.lastY);
  ai.lastX = bot.x;
  ai.lastY = bot.y;
  if (moved < 0.7) {
    ai.stuckTimer += dt;
  } else {
    ai.stuckTimer = Math.max(0, ai.stuckTimer - dt * 2);
  }
  if (ai.stuckTimer > 0.75) {
    ai.pathTimer = 0;
    ai.decisionTimer = 0;
    ai.strafe *= -1;
    ai.stuckTimer = 0;
  }
}
