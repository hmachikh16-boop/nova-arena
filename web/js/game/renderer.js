import { WORLD } from '../data.js';
import { clamp, distance, easeOutCubic, hexToRgba } from './utils.js';
import { drawBrawler } from './sprites.js';
import { drawCrate } from './props.js';

function drawMine(ctx, game) {
  const { gemMine: mine, palette } = game.arena;
  const time = game.elapsed;
  ctx.save();
  ctx.translate(mine.x, mine.y);

  const pulsing = 0.5 + Math.sin(time * 2.6) * 0.18;
  ctx.globalAlpha = pulsing * 0.32;
  ctx.fillStyle = palette.mine;
  ctx.beginPath();
  ctx.arc(0, 0, mine.radius + 22 + Math.sin(time * 2.1) * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 62);
  glow.addColorStop(0, 'rgba(153,255,235,.8)');
  glow.addColorStop(0.4, 'rgba(55,240,198,.24)');
  glow.addColorStop(1, 'rgba(55,240,198,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 66, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(time * 0.35);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const radius = 31 + Math.sin(time * 2 + index) * 3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-time * 0.35);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const bob = Math.sin(time * 2.2) * 5;
  ctx.translate(0, -18 + bob);
  ctx.rotate(time * 0.8);
  ctx.shadowColor = palette.mine;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#8dfff0';
  ctx.strokeStyle = '#0c5350';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(12, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(-12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(5, -1);
  ctx.lineTo(-4, 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawAim(ctx, game) {
  const player = game.player;
  if (!player.alive || game.phase === 'ended') return;
  const hero = player.hero;
  const time = game.elapsed;
  const aim = player.aim;
  const range = hero.attack.range;
  let mouseDistance = range;
  if (game.mouse.active) {
    mouseDistance = distance(player.x, player.y, game.mouse.x, game.mouse.y);
  }
  const desired = clamp(mouseDistance, 50, range);
  const wallDistance = game.worldMap.raycast(player.x, player.y, aim, desired, 6);
  const previewDistance = Math.min(desired, wallDistance);
  const endX = player.x + Math.cos(aim) * previewDistance;
  const endY = player.y + Math.sin(aim) * previewDistance;
  const color = hero.color;

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, range, 0, Math.PI * 2);
  ctx.stroke();

  if (hero.attack.type === 'shotgun') {
    const spread = hero.attack.spread * 2.6;
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, Math.min(range, 260), aim - spread, aim + spread);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = hexToRgba(color, 0.7);
  ctx.lineWidth = 1.8;
  ctx.setLineDash([4, 9]);
  ctx.lineDashOffset = -time * 26;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(aim) * 27, player.y + Math.sin(aim) * 27);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.translate(endX, endY);
  ctx.rotate(aim);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#fff8df';
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  for (let index = 0; index < 4; index += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGem(ctx, game, gem, index) {
  const time = game.elapsed;
  const bob = Math.sin(time * 3 + index * 1.7) * 4;
  const y = gem.y + bob;
  const scale = 0.9 + Math.sin(time * 2.4 + index) * 0.1;
  ctx.save();
  ctx.translate(gem.x, y);
  ctx.fillStyle = 'rgba(0,12,16,.28)';
  ctx.beginPath();
  ctx.ellipse(0, 14 - bob, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#55ffe1';
  ctx.shadowColor = '#55ffe1';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.rotate(time * 0.7 + index);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#71ffe6';
  ctx.strokeStyle = '#0b5754';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(9.5, -2);
  ctx.lineTo(5, 11);
  ctx.lineTo(-5, 11);
  ctx.lineTo(-9.5, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(4, -2);
  ctx.lineTo(-3, 5);
  ctx.lineTo(-5, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(22,91,85,.6)';
  ctx.beginPath();
  ctx.moveTo(9.5, -2);
  ctx.lineTo(5, 11);
  ctx.lineTo(1, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawProjectiles(ctx, game) {
  for (const projectile of game.projectiles) {
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const ux = projectile.vx / speed;
    const uy = projectile.vy / speed;
    const trailLength = projectile.type === 'sniper' ? 44 : projectile.type === 'orb' ? 20 : 24;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createLinearGradient(
      projectile.x - ux * trailLength,
      projectile.y - uy * trailLength,
      projectile.x,
      projectile.y,
    );
    gradient.addColorStop(0, hexToRgba(projectile.trail, 0));
    gradient.addColorStop(0.7, hexToRgba(projectile.trail, 0.5));
    gradient.addColorStop(1, hexToRgba(projectile.color, 0.95));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = projectile.radius * 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(projectile.x - ux * trailLength, projectile.y - uy * trailLength);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    if (projectile.type === 'orb') {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = projectile.heal > 0 ? '#a7fff0' : projectile.color;
      ctx.strokeStyle = '#352047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(projectile.x - 2, projectile.y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (projectile.type === 'fan') {
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(projectile.angle + game.elapsed * 8);
      ctx.fillStyle = projectile.color;
      ctx.strokeStyle = '#273218';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * Math.PI * 2;
        const px = Math.cos(angle) * projectile.radius * 1.7;
        const py = Math.sin(angle) * projectile.radius * 1.7;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        if (index === 0) ctx.lineTo(0, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = projectile.type === 'sniper' ? '#eaffff' : projectile.color;
      ctx.lineWidth = projectile.type === 'sniper' ? 3 : 4.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(projectile.x - ux * 9, projectile.y - uy * 9);
      ctx.lineTo(projectile.x + ux * 6, projectile.y + uy * 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

function drawParticles(ctx, game) {
  for (const particle of game.particles) {
    const ratio = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ratio) * (particle.alpha ?? 1);
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    if (particle.shape === 'spark') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-particle.vx * 0.035, -particle.vy * 0.035);
      ctx.stroke();
    } else if (particle.shape === 'diamond') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size * 0.55, 0);
      ctx.lineTo(0, particle.size);
      ctx.lineTo(-particle.size * 0.55, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size * (0.4 + ratio * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawEffects(ctx, game) {
  for (const effect of game.effects) {
    const ratio = clamp(effect.life / effect.maxLife, 0, 1);
    const progress = 1 - ratio;
    ctx.save();
    if (effect.type === 'ring') {
      const radius = effect.startRadius + (effect.endRadius - effect.startRadius) * easeOutCubic(progress);
      ctx.globalAlpha = ratio * 0.9;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.width * ratio + 1;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = ratio * 0.16;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'beam') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ratio;
      const dx = Math.cos(effect.angle);
      const dy = Math.sin(effect.angle);
      ctx.lineCap = 'round';
      ctx.strokeStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = effect.width * (0.4 + ratio * 0.6);
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x + dx * effect.length, effect.y + dy * effect.length);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, effect.width * 0.22);
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x + dx * effect.length, effect.y + dy * effect.length);
      ctx.stroke();
    } else if (effect.type === 'dash') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ratio * 0.8;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 16 * ratio;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
    } else if (effect.type === 'muzzle') {
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ratio * 0.95;
      const size = effect.size * (0.65 + progress * 0.55);
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.3, size * 0.38);
      ctx.lineTo(-size * 0.08, 0);
      ctx.lineTo(-size * 0.3, -size * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloatingTexts(ctx, game) {
  for (const text of game.floatingTexts) {
    const ratio = clamp(text.life / text.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = Math.min(1, ratio * 1.7);
    ctx.font = `800 ${text.size}px Cairo, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(9,8,19,.72)';
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

function drawAmbient(ctx, game) {
  const time = game.elapsed;
  ctx.save();
  for (let index = 0; index < 22; index += 1) {
    const baseX = (index * 227 + 113) % WORLD.width;
    const baseY = (index * 149 + 71) % WORLD.height;
    const x = baseX + Math.sin(time * 0.35 + index) * 18;
    const y = baseY + Math.cos(time * 0.28 + index * 1.3) * 12;
    const alpha = 0.12 + (Math.sin(time * 1.2 + index * 2) + 1) * 0.1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = index % 5 === 0 ? '#ffd45e' : '#92ffe8';
    ctx.beginPath();
    ctx.arc(x, y, index % 5 === 0 ? 1.8 : 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOvertime(ctx, game) {
  if (game.overtimeTeam === null || game.overtimeTeam === undefined) return;
  const color = game.overtimeTeam === 0 ? game.arena.palette.ally : game.arena.palette.enemy;
  const pulse = 0.15 + (Math.sin(game.elapsed * 6) + 1) * 0.05;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(game.arena.gemMine.x, game.arena.gemMine.y, 105 + Math.sin(game.elapsed * 3) * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScreenVignette(ctx, game) {
  if (!game.vignetteGradient) {
    const gradient = ctx.createRadialGradient(
      WORLD.width / 2,
      WORLD.height / 2,
      260,
      WORLD.width / 2,
      WORLD.height / 2,
      760,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(2,4,12,.12)');
    gradient.addColorStop(1, 'rgba(2,4,12,.58)');
    game.vignetteGradient = gradient;
  }
  ctx.fillStyle = game.vignetteGradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const player = game.player;
  if (!player.alive) {
    ctx.fillStyle = 'rgba(8,10,24,.22)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    return;
  }
  const hpRatio = player.hp / player.maxHp;
  if (hpRatio < 0.32) {
    const strength = (0.32 - hpRatio) / 0.32;
    const pulse = 0.26 + (Math.sin(game.elapsed * 5.4) + 1) * 0.12;
    const gradient = ctx.createRadialGradient(
      WORLD.width / 2,
      WORLD.height / 2,
      230,
      WORLD.width / 2,
      WORLD.height / 2,
      720,
    );
    gradient.addColorStop(0, 'rgba(255,30,60,0)');
    gradient.addColorStop(1, `rgba(255,26,64,${strength * pulse})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  }
}

export class ArenaRenderer {
  constructor() {
    this.time = 0;
  }

  draw(game) {
    const ctx = game.ctx;
    const shake = game.shake || 0;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    if (game.camera) {
      game.camera.apply(ctx, WORLD.width, WORLD.height);
    }
    ctx.translate(shakeX, shakeY);
    ctx.drawImage(game.worldMap.layer, 0, 0);
    drawOvertime(ctx, game);
    drawMine(ctx, game);
    game.gems.forEach((gem, index) => drawGem(ctx, game, gem, index));
    drawAim(ctx, game);

    const drawables = [
      ...game.entities
        .filter((entity) => entity.alive || entity.deathTimer > 0)
        .map((entity) => ({ kind: 'entity', y: entity.y, value: entity })),
      ...game.crates.map((crate) => ({ kind: 'crate', y: crate.y, value: crate })),
    ].sort((a, b) => a.y - b.y || a.value.x - b.value.x);
    for (const drawable of drawables) {
      if (drawable.kind === 'entity') drawBrawler(ctx, game, drawable.value);
      else drawCrate(ctx, game, drawable.value);
    }

    drawProjectiles(ctx, game);
    drawEffects(ctx, game);
    drawParticles(ctx, game);
    drawFloatingTexts(ctx, game);
    drawAmbient(ctx, game);
    ctx.restore();
    drawScreenVignette(ctx, game);
  }
}
