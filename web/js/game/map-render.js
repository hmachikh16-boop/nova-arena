import { roundedRect } from './utils.js';

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function bushBlob(ctx, bush, random, color, inset = 0) {
  const points = 11;
  const cx = bush.x + bush.w / 2;
  const cy = bush.y + bush.h / 2;
  const rx = Math.max(10, bush.w / 2 - inset);
  const ry = Math.max(10, bush.h / 2 - inset);
  ctx.beginPath();
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const wobble = 0.84 + random() * 0.26;
    const x = cx + Math.cos(angle) * rx * wobble;
    const y = cy + Math.sin(angle) * ry * wobble;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawThemeFloor(ctx, arena, world, random) {
  const palette = arena.palette;
  ctx.save();
  if (arena.theme === 'temple') {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = palette.groundLine;
    ctx.lineWidth = 2;
    for (let y = 70; y < world.height; y += 118) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
      ctx.stroke();
    }
    for (let x = 90; x < world.width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.2;
    for (let index = 0; index < 46; index += 1) {
      const x = random() * world.width;
      const y = random() * world.height;
      ctx.fillStyle = index % 3 === 0 ? 'rgba(135, 255, 192, .18)' : 'rgba(3, 23, 18, .3)';
      ctx.beginPath();
      ctx.ellipse(x, y, random() * 26 + 6, random() * 12 + 3, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (arena.theme === 'neon') {
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = 'rgba(94, 226, 255, .2)';
    ctx.lineWidth = 2;
    for (let x = 0; x < world.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    for (let y = 0; y < world.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(111, 247, 255, .34)';
    for (let x = 0; x < world.width; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.16;
    for (let index = 0; index < 22; index += 1) {
      const w = random() * 180 + 40;
      const h = random() * 90 + 24;
      const x = random() * world.width;
      const y = random() * world.height;
      ctx.fillStyle = index % 2 ? palette.mine : palette.ally;
      ctx.fillRect(x, y, w, h);
    }
  } else if (arena.theme === 'sand') {
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = 'rgba(255, 224, 158, .28)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 34; index += 1) {
      const y = random() * world.height;
      const x = random() * world.width;
      const w = random() * 160 + 60;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y - random() * 34 - 8, x + w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(80, 38, 15, .5)';
    ctx.lineWidth = 4;
    for (let index = 0; index < 18; index += 1) {
      const x = random() * world.width;
      const y = random() * world.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 56 - 28, y + random() * 40 + 14);
      ctx.lineTo(x + random() * 80 - 40, y + random() * 76 + 30);
      ctx.stroke();
    }
  } else if (arena.theme === 'ice') {
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = 'rgba(208, 249, 255, .38)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 42; index += 1) {
      const x = random() * world.width;
      const y = random() * world.height;
      const length = random() * 70 + 18;
      const angle = random() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.lineTo(x + Math.cos(angle + 0.6) * length * 0.6, y + Math.sin(angle + 0.6) * length * 0.6);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.28;
    for (let index = 0; index < 28; index += 1) {
      ctx.fillStyle = 'rgba(224, 253, 255, .22)';
      ctx.beginPath();
      ctx.ellipse(random() * world.width, random() * world.height, random() * 42 + 8, random() * 20 + 4, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (arena.theme === 'space') {
    ctx.globalAlpha = 0.6;
    for (let index = 0; index < 130; index += 1) {
      ctx.fillStyle = index % 4 === 0 ? palette.ally : 'rgba(220, 236, 255, .55)';
      ctx.beginPath();
      ctx.arc(random() * world.width, random() * world.height, random() * 1.6 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(129, 166, 255, .32)';
    ctx.lineWidth = 2;
    for (let index = 0; index < 24; index += 1) {
      const x = random() * world.width;
      const y = random() * world.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 34, y);
      ctx.lineTo(x + 48, y + 24);
      ctx.lineTo(x + 34, y + 48);
      ctx.lineTo(x, y + 48);
      ctx.lineTo(x - 14, y + 24);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFloor(ctx, arena, world) {
  const palette = arena.palette;
  const gradient = ctx.createLinearGradient(0, 0, world.width, world.height);
  gradient.addColorStop(0, palette.ground);
  gradient.addColorStop(0.5, palette.groundMid || palette.ground);
  gradient.addColorStop(1, palette.groundAlt);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);

  const random = seededRandom(73);
  drawThemeFloor(ctx, arena, world, random);

  ctx.save();
  for (let index = 0; index < 560; index += 1) {
    const x = random() * world.width;
    const y = random() * world.height;
    const radius = random() * 2.2 + 0.4;
    ctx.fillStyle = random() > 0.65 ? palette.ambient || 'rgba(110,255,209,.1)' : 'rgba(0,0,0,.12)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const cx = arena.gemMine.x;
  const cy = arena.gemMine.y;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 2;
  for (const radius of [146, 205, 286]) {
    ctx.setLineDash(radius === 205 ? [4, 18] : []);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let index = 0; index < 8; index += 1) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(153, 0);
    ctx.lineTo(196, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.11;
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const radius = 116;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = palette.mine;
  ctx.fill();
  ctx.restore();

  const spawnZones = [
    { point: arena.spawns.ally[0], color: palette.ally, team: 'ALLY' },
    { point: arena.spawns.enemy[0], color: palette.enemy, team: 'ENEMY' },
  ];
  for (const zone of spawnZones) {
    ctx.save();
    ctx.translate(zone.point.x, zone.point.y);
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 9]);
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = zone.color;
    ctx.font = '800 16px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zone.team === 'ALLY' ? 'فريقك' : 'الخصم', 0, 0);
    ctx.restore();
  }

  ctx.save();
  const ambient = ctx.createRadialGradient(cx, cy, 80, cx, cy, 540);
  ambient.addColorStop(0, palette.ambient || 'rgba(55,240,198,.12)');
  ambient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, world.width, world.height);
  const vignette = ctx.createRadialGradient(
    world.width / 2,
    world.height / 2,
    180,
    world.width / 2,
    world.height / 2,
    760,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(1,10,15,.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.restore();
}

function drawMineBase(ctx, arena, palette) {
  const { x, y, radius } = arena.gemMine;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath();
  ctx.ellipse(0, 14, radius + 30, radius + 17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.wallFace;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * (radius + 20);
    const py = Math.sin(angle) * (radius + 20);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const inner = ctx.createRadialGradient(0, -4, 4, 0, 0, radius + 2);
  inner.addColorStop(0, palette.groundAlt);
  inner.addColorStop(0.6, palette.wallFace);
  inner.addColorStop(1, palette.wallTop);
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
  glow.addColorStop(0, palette.mine);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = palette.mine;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 3;
  ctx.strokeRect(-28, -28, 56, 56);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = palette.mine;
  ctx.fillRect(-20, -20, 40, 40);
  ctx.restore();
}

function drawBushes(ctx, arena, palette) {
  arena.bushes.forEach((bush, index) => {
    const random = seededRandom(101 + index * 19);
    ctx.save();
    ctx.fillStyle = 'rgba(1,16,17,.27)';
    ctx.beginPath();
    ctx.ellipse(
      bush.x + bush.w / 2,
      bush.y + bush.h / 2 + 8,
      bush.w / 2 + 7,
      bush.h / 2 + 6,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    bushBlob(ctx, bush, random, palette.bushDark, 7);
    bushBlob(ctx, bush, random, palette.bush, 1);
    ctx.globalAlpha = 0.6;
    bushBlob(ctx, bush, random, palette.bushLight, -8);
    ctx.globalAlpha = 1;
    for (let dot = 0; dot < 13; dot += 1) {
      const x = bush.x + 12 + random() * (bush.w - 24);
      const y = bush.y + 12 + random() * (bush.h - 24);
      ctx.fillStyle = random() > 0.45 ? 'rgba(139,255,178,.48)' : 'rgba(7,79,53,.45)';
      ctx.beginPath();
      ctx.ellipse(x, y, random() * 7 + 2, random() * 4 + 1.5, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawWall(ctx, wall, palette) {
  const vertical = wall.h > wall.w;
  const radius = 11;
  const depth = 13;
  ctx.save();

  // Long soft ground shadow.
  ctx.fillStyle = palette.wallShadow;
  roundedRect(ctx, wall.x + 12, wall.y + 18, wall.w, wall.h, radius);
  ctx.fill();

  // Extruded side faces: drawn slightly down-right so the top slab appears raised.
  const side = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
  side.addColorStop(0, palette.wallFace);
  side.addColorStop(0.55, palette.border);
  side.addColorStop(1, '#02080b');
  ctx.fillStyle = side;
  roundedRect(ctx, wall.x + depth * 0.55, wall.y + depth * 0.7, wall.w, wall.h, radius);
  ctx.fill();

  // Bright lip along the exposed bottom edge for a chunky 3D rim.
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = palette.wallEdge;
  ctx.lineWidth = 2.5;
  roundedRect(ctx, wall.x + depth * 0.55, wall.y + depth * 0.7, wall.w, wall.h, radius);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Top face.
  const top = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
  top.addColorStop(0, palette.wallTop);
  top.addColorStop(0.45, palette.wallTop);
  top.addColorStop(1, palette.wallFace);
  ctx.fillStyle = top;
  roundedRect(ctx, wall.x, wall.y, wall.w, wall.h, radius);
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner bevel.
  const inner = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
  inner.addColorStop(0, 'rgba(255,255,255,.17)');
  inner.addColorStop(0.25, 'rgba(255,255,255,.03)');
  inner.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = inner;
  roundedRect(ctx, wall.x + 7, wall.y + 6, wall.w - 14, wall.h - 13, radius - 5);
  ctx.fill();

  // Top-left rim light.
  ctx.strokeStyle = palette.wallEdge;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(wall.x + 8, wall.y + 15);
    ctx.lineTo(wall.x + 8, wall.y + wall.h - 17);
  } else {
    ctx.moveTo(wall.x + 16, wall.y + 8);
    ctx.lineTo(wall.x + wall.w - 16, wall.y + 8);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Panel seams.
  ctx.strokeStyle = 'rgba(3, 13, 18, .32)';
  ctx.lineWidth = 3;
  if (vertical) {
    const lineY = wall.y + wall.h / 2;
    ctx.beginPath();
    ctx.moveTo(wall.x + 12, lineY);
    ctx.lineTo(wall.x + wall.w - 12, lineY);
    ctx.stroke();
  } else {
    const lineX = wall.x + wall.w / 2;
    ctx.beginPath();
    ctx.moveTo(lineX, wall.y + 12);
    ctx.lineTo(lineX, wall.y + wall.h - 12);
    ctx.stroke();
  }

  // Raised gold studs.
  const studCount = Math.max(1, Math.floor((vertical ? wall.h : wall.w) / 90));
  for (let index = 0; index < studCount; index += 1) {
    const offset = (index + 0.5) / studCount;
    const x = vertical ? wall.x + wall.w / 2 : wall.x + wall.w * offset;
    const y = vertical ? wall.y + wall.h * offset : wall.y + wall.h / 2;
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath();
    ctx.arc(x + 1.2, y + 1.6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.gold;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawBorder(ctx, arena, world) {
  const palette = arena.palette;
  ctx.save();
  const size = 24;
  ctx.fillStyle = palette.border;
  ctx.fillRect(0, 0, world.width, size);
  ctx.fillRect(0, world.height - size, world.width, size);
  ctx.fillRect(0, 0, size, world.height);
  ctx.fillRect(world.width - size, 0, size, world.height);

  ctx.strokeStyle = 'rgba(255,212,94,.44)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, world.width - 28, world.height - 28);

  const gradient = ctx.createLinearGradient(0, 0, world.width, 0);
  gradient.addColorStop(0, palette.ally);
  gradient.addColorStop(0.5, palette.gold);
  gradient.addColorStop(1, palette.enemy);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = gradient;
  ctx.fillRect(24, 24, world.width - 48, 4);
  ctx.fillRect(24, world.height - 28, world.width - 48, 4);
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,255,255,.18)';
  for (let x = 42; x < world.width - 24; x += 58) {
    ctx.beginPath();
    ctx.arc(x, 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, world.height - 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCornerCrystals(ctx, arena, world) {
  const palette = arena.palette;
  const positions = [
    { x: 88, y: 220, scale: 0.8, color: palette.mine },
    { x: 1190, y: 500, scale: 0.8, color: palette.mine },
    { x: 1120, y: 210, scale: 0.55, color: palette.gold },
    { x: 160, y: 510, scale: 0.5, color: palette.gold },
  ];
  positions.forEach((item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(item.scale, item.scale);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(0, 18, 32, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = palette.wallFace;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.lineTo(-7, -28);
    ctx.lineTo(4, -14);
    ctx.lineTo(16, -44);
    ctx.lineTo(24, 4);
    ctx.lineTo(9, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(-7, -28);
    ctx.lineTo(4, -14);
    ctx.lineTo(4, 8);
    ctx.lineTo(-9, 12);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(0, 16, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawMapLayer({ arena, world, createCanvas }) {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  drawFloor(ctx, arena, world);
  drawMineBase(ctx, arena, arena.palette);
  drawCornerCrystals(ctx, arena, world);
  drawBushes(ctx, arena, arena.palette);
  arena.walls.forEach((wall) => drawWall(ctx, wall, arena.palette));
  drawBorder(ctx, arena, world);
  return canvas;
}
