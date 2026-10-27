import { distance } from './utils.js';

const INK = '#140f22';

function withOutline(ctx, fill, stroke = INK, width = 3) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawFeet(ctx, entity, time) {
  const speedRatio = Math.max(0, Math.min(1, entity.speedRatio || 0));
  const moving = entity.animState === 'run' || (entity.moving && speedRatio > 0.03);
  const idleSway = Math.sin((time || entity.animTime || 0) * 2.2 + entity.id) * 0.8;
  const cycle = moving
    ? Math.sin(entity.walkPhase * 1.7) * (2.4 + speedRatio * 4.2)
    : idleSway;
  const lift = moving ? Math.max(0, Math.sin(entity.walkPhase * 1.7)) * 1.5 * speedRatio : 0;
  ctx.save();
  ctx.fillStyle = '#151323';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  [
    { y: -8, offset: cycle, lift: lift },
    { y: 8, offset: -cycle, lift: 0 },
  ].forEach((foot) => {
    ctx.beginPath();
    ctx.ellipse(-8 + foot.offset, foot.y - foot.lift, 7.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawCommonHead(ctx, entity, options = {}) {
  const hero = entity.hero;
  const radius = options.radius || 10.5;
  const headX = options.headX || 5;
  ctx.save();
  // Back hair silhouette.
  ctx.beginPath();
  ctx.arc(headX - 2, 0, radius + 2.4, 0, Math.PI * 2);
  withOutline(ctx, hero.hair, INK, 2.8);
  // Face.
  ctx.beginPath();
  ctx.arc(headX + 2.5, 0, radius - 0.4, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 2.5);
  // Hair fringe across the back/top.
  ctx.beginPath();
  ctx.arc(headX + 0.5, 0, radius + 0.8, Math.PI * 0.55, Math.PI * 1.45);
  ctx.fillStyle = hero.hair;
  ctx.fill();
  // Eyes face forward.
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath();
  ctx.ellipse(headX + 7, -3.7, 2.7, 3.4, 0, 0, Math.PI * 2);
  ctx.ellipse(headX + 7, 3.7, 2.7, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = options.eyeColor || '#2a1a22';
  ctx.beginPath();
  ctx.arc(headX + 8.4, -3.5, 1.35, 0, Math.PI * 2);
  ctx.arc(headX + 8.4, 3.5, 1.35, 0, Math.PI * 2);
  ctx.fill();
  // Mouth line.
  ctx.strokeStyle = 'rgba(20,12,20,.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(headX + 9.4, 1.2, 3.2, 0.2, 1.1);
  ctx.stroke();
  if (options.visor) {
    ctx.fillStyle = options.visor;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(headX + 7.5, -3.7, 4.6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d6ffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(headX + 4.6, -3.7);
    ctx.lineTo(headX + 10.3, -3.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRaad(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Back canister.
  ctx.beginPath();
  ctx.ellipse(-15, 3, 8, 11, 0, 0, Math.PI * 2);
  withOutline(ctx, '#283246', INK, 2.5);
  ctx.fillStyle = hero.color2;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(-18, -4, 6, 4);
  ctx.globalAlpha = 1;

  // Body.
  ctx.beginPath();
  ctx.ellipse(-1, 0, 16.5, 15.5, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3.2);
  ctx.beginPath();
  ctx.ellipse(-8, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.fill();

  // Chest plate.
  ctx.beginPath();
  ctx.ellipse(4, 0, 9, 11, 0, 0, Math.PI * 2);
  withOutline(ctx, '#1a3340', INK, 2.2);
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(8, 0);
  ctx.lineTo(2, 5);
  ctx.stroke();

  // Shoulder pads.
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(-1, side * 14, 7.5, 6.2, 0, 0, Math.PI * 2);
    withOutline(ctx, '#353143', INK, 2.4);
    ctx.fillStyle = '#ffd45e';
    ctx.beginPath();
    ctx.arc(-1, side * 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  drawCommonHead(ctx, entity, { radius: 11.5, headX: 5 });

  // Scatter cannon.
  ctx.beginPath();
  ctx.roundRect(12, 3, 27, 10, 3);
  withOutline(ctx, '#2a2b40', INK, 2.5);
  ctx.beginPath();
  ctx.roundRect(16, 5, 20, 3, 2);
  ctx.fillStyle = hero.color2;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#10101f';
  ctx.fillRect(37, 2, 5, 12);
  ctx.fillStyle = '#ffb548';
  ctx.beginPath();
  ctx.arc(41.5, 8, 2.3, 0, Math.PI * 2);
  ctx.fill();
  // Hand on the grip.
  ctx.beginPath();
  ctx.arc(18, 13, 4.2, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 2);
  ctx.restore();
}

function drawNajm(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Body.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 13, 12.5, 0, 0, Math.PI * 2);
  withOutline(ctx, '#eefbff', INK, 3);
  ctx.beginPath();
  ctx.ellipse(-5, 0, 8.5, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.color;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Jacket stripe.
  ctx.strokeStyle = '#15253d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -8);
  ctx.lineTo(1, 0);
  ctx.lineTo(-9, 8);
  ctx.stroke();

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(-1, side * 12, 5.5, 4.6, 0, 0, Math.PI * 2);
    withOutline(ctx, '#15253d', INK, 2.2);
    ctx.fillStyle = hero.color;
    ctx.beginPath();
    ctx.arc(-1, side * 12, 1.3, 0, Math.PI * 2);
    ctx.fill();
  });

  drawCommonHead(ctx, entity, { radius: 10, headX: 5, visor: '#25dff2', eyeColor: '#0b6073' });

  // Long plasma rifle.
  ctx.beginPath();
  ctx.roundRect(12, 1.5, 42, 6, 2);
  withOutline(ctx, '#12243d', INK, 2.3);
  ctx.fillStyle = hero.color;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(20, 3.4, 28, 2);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.roundRect(27, -1.5, 10, 4, 1.5);
  withOutline(ctx, '#30394e', INK, 1.6);
  ctx.fillStyle = '#82fbff';
  ctx.beginPath();
  ctx.arc(53, 4.5, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(17, 9, 3.8, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 1.8);
  ctx.restore();
}

function drawZahra(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Robe.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 15, 14, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3);
  ctx.beginPath();
  ctx.ellipse(-5, 0, 9.5, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7d2c85';
  ctx.globalAlpha = 0.65;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ffd45e';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(-1, 0, 10.5, -1.1, 1.1);
  ctx.stroke();

  // Shoulder shawl scallops.
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(-1, side * 12, 5, 0, Math.PI * 2);
    withOutline(ctx, '#8f2f78', INK, 2);
  });

  drawCommonHead(ctx, entity, { radius: 10.2, headX: 5, eyeColor: '#7a3e80' });

  // Floating healing orb.
  const pulse = 1 + Math.sin(entity.walkPhase * 2.3) * 0.08;
  ctx.save();
  ctx.translate(25, 0);
  ctx.scale(pulse, pulse);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = hero.color2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  withOutline(ctx, '#70ffdf', '#1e5d5c', 2);
  ctx.fillStyle = '#e9fffb';
  ctx.beginPath();
  ctx.arc(-2, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hands.
  [-7, 7].forEach((y) => {
    ctx.beginPath();
    ctx.arc(17, y, 3.4, 0, Math.PI * 2);
    withOutline(ctx, hero.skin, INK, 1.7);
  });
  ctx.restore();
}

function drawSahm(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Scarf trail.
  ctx.beginPath();
  ctx.moveTo(-9, -7);
  ctx.quadraticCurveTo(-25, -11 + Math.sin(entity.walkPhase * 1.4) * 3, -30, 0);
  ctx.quadraticCurveTo(-22, 7, -8, 7);
  ctx.closePath();
  withOutline(ctx, hero.color, INK, 2.2);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = hero.color2;
  ctx.fillRect(-26, -1.5, 10, 3);
  ctx.globalAlpha = 1;

  // Body.
  ctx.beginPath();
  ctx.ellipse(-1, 0, 12.5, 12, 0, 0, Math.PI * 2);
  withOutline(ctx, '#3d2060', INK, 3);
  ctx.beginPath();
  ctx.ellipse(-4, 0, 7.8, 9.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.color;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -9);
  ctx.lineTo(-4, 9);
  ctx.stroke();

  // Hood head.
  ctx.beginPath();
  ctx.arc(4.5, 0, 12, 0, Math.PI * 2);
  withOutline(ctx, '#28133e', INK, 2.8);
  ctx.beginPath();
  ctx.ellipse(6.5, 0, 8.5, 7.2, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 2.2);
  ctx.fillStyle = '#1a1026';
  ctx.beginPath();
  ctx.ellipse(8.5, 4.2, 7, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glowing eyes.
  ctx.fillStyle = hero.color2;
  ctx.shadowColor = hero.color2;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.ellipse(11, -2.5, 2.3, 1.4, -0.2, 0, Math.PI * 2);
  ctx.ellipse(11, 2.5, 2.3, 1.4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Twin blades.
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(12, side * 9);
    ctx.rotate(side * 0.24);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, -2.5);
    ctx.lineTo(25, 0);
    ctx.lineTo(18, 2.5);
    ctx.closePath();
    withOutline(ctx, '#e6ffd0', INK, 1.5);
    ctx.fillStyle = hero.color2;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(8, -1);
    ctx.lineTo(19, 0);
    ctx.lineTo(8, 1);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawBubblix(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  // Hover jets.
  ctx.fillStyle = 'rgba(100,240,255,.22)';
  ctx.beginPath();
  ctx.ellipse(-11, 0, 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Round chassis.
  ctx.beginPath();
  ctx.arc(-1, 0, 17, 0, Math.PI * 2);
  withOutline(ctx, '#e9fbff', INK, 3.2);
  ctx.beginPath();
  ctx.arc(-4, 0, 12.5, 0, Math.PI * 2);
  ctx.fillStyle = hero.color;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Belly screen.
  ctx.beginPath();
  ctx.ellipse(5, 0, 8, 9, 0, 0, Math.PI * 2);
  withOutline(ctx, '#09233c', INK, 2.2);
  ctx.fillStyle = hero.color2;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.arc(5, -2, 1.8, 0, Math.PI * 2);
  ctx.arc(5, 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Side thrusters.
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(-3, side * 15, 7, 5.2, 0, 0, Math.PI * 2);
    withOutline(ctx, '#2d5b8c', INK, 2.2);
    ctx.fillStyle = hero.color2;
    ctx.beginPath();
    ctx.arc(-3, side * 15, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Glass dome head.
  ctx.beginPath();
  ctx.arc(7, 0, 12.5, 0, Math.PI * 2);
  withOutline(ctx, 'rgba(197,250,255,.55)', INK, 2.8);
  ctx.beginPath();
  ctx.arc(7, 0, 9.5, 0, Math.PI * 2);
  withOutline(ctx, hero.skin2 || '#e7fcff', INK, 2);
  ctx.fillStyle = '#122f4b';
  ctx.beginPath();
  ctx.ellipse(9.5, -3, 1.8, 2.4, 0, 0, Math.PI * 2);
  ctx.ellipse(9.5, 3, 1.8, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#12324e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(10, 0.5, 2.6, 0, Math.PI);
  ctx.stroke();
  // Antenna bubble.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, -10);
  ctx.quadraticCurveTo(-2, -21, 4, -25);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, -27, 4.5, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.8);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#d8ffff';
  ctx.beginPath();
  ctx.arc(3, -28, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Bubble blaster.
  ctx.beginPath();
  ctx.roundRect(10, 4, 23, 8, 4);
  withOutline(ctx, '#3a6f9e', INK, 2.2);
  ctx.fillStyle = hero.color2;
  ctx.beginPath();
  ctx.arc(33, 8, 4.5, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.8);
  ctx.beginPath();
  ctx.arc(33, 8, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, 12, 3.9, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.8);
  ctx.restore();
}

function drawGrizz(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Back fur and tail.
  ctx.beginPath();
  ctx.arc(-18, 0, 8, 0, Math.PI * 2);
  withOutline(ctx, hero.hair, INK, 2.4);

  // Big furry body.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 18, 17, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 3.4);
  ctx.beginPath();
  ctx.ellipse(-8, 0, 10, 13, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.skin2 || '#e6a466';
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Vest.
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.lineTo(7, -13);
  ctx.lineTo(10, 10);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  withOutline(ctx, '#5a3a22', INK, 2.4);
  ctx.strokeStyle = '#8a5a2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(-3, 11);
  ctx.stroke();

  // Shoulder tufts.
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(-1, side * 16, 7, 0, Math.PI * 2);
    withOutline(ctx, hero.hair, INK, 2.2);
  });

  // Bear head.
  ctx.beginPath();
  ctx.arc(7, 0, 13.5, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 3);
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(0, side * 11, 4.8, 0, Math.PI * 2);
    withOutline(ctx, hero.hair, INK, 2);
  });
  ctx.beginPath();
  ctx.ellipse(13, 0, 7.8, 6.2, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin2 || '#e6a466', INK, 2);
  ctx.fillStyle = '#24120a';
  ctx.beginPath();
  ctx.ellipse(17, 0, 2.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath();
  ctx.arc(12, -3.5, 2.2, 0, Math.PI * 2);
  ctx.arc(12, 3.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#24120a';
  ctx.beginPath();
  ctx.arc(12.8, -3.5, 1, 0, Math.PI * 2);
  ctx.arc(12.8, 3.5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d2111';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(17, 0.8, 2.6, 0.2, 1.5);
  ctx.stroke();

  // War hammer.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(8, 13);
  ctx.lineTo(32, 13);
  ctx.stroke();
  ctx.strokeStyle = '#7b4a22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(8, 13);
  ctx.lineTo(32, 13);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(28, 5, 12, 16, 3);
  withOutline(ctx, '#6f8298', INK, 2.4);
  ctx.fillStyle = hero.color;
  ctx.fillRect(30, 8, 8, 2.2);
  ctx.beginPath();
  ctx.arc(10, 16, 4.2, 0, Math.PI * 2);
  withOutline(ctx, hero.skin2 || '#e6a466', INK, 2);
  ctx.restore();
}

function drawCactus(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Prickly body.
  ctx.beginPath();
  ctx.ellipse(-1, 0, 15, 14, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 3.2);
  ctx.beginPath();
  ctx.ellipse(-5, 0, 8, 10.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.skin2 || '#7ee881';
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Poncho.
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.lineTo(8, -11);
  ctx.lineTo(11, 10);
  ctx.lineTo(-14, 11);
  ctx.closePath();
  withOutline(ctx, '#ffcf4a', INK, 2.2);
  ctx.strokeStyle = hero.accent || '#ff6f9d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(9, -4);
  ctx.moveTo(-10, 4);
  ctx.lineTo(9, 4);
  ctx.stroke();

  // Spines.
  ctx.strokeStyle = hero.skin2 || '#7ee881';
  ctx.lineWidth = 1.6;
  [[-9, -14], [-3, -16], [5, -15], [-12, 12], [-4, 15], [5, 14]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + (y < 0 ? -5 : 5));
    ctx.stroke();
  });

  // Cactus head.
  ctx.beginPath();
  ctx.arc(7, 0, 13.5, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 3);
  ctx.strokeStyle = hero.skin2 || '#7ee881';
  ctx.lineWidth = 1.8;
  [[3, -11], [8, -13], [12, -9], [13, 8], [8, 12], [2, 11]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (y < 0 ? 2 : 2), y + (y < 0 ? -5 : 5));
    ctx.stroke();
  });
  ctx.fillStyle = '#fffdf2';
  ctx.beginPath();
  ctx.ellipse(12, -3.5, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(12, 3.5, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18351d';
  ctx.beginPath();
  ctx.arc(13, -3.5, 1.15, 0, Math.PI * 2);
  ctx.arc(13, 3.5, 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#245a2b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(14, 0, 2.5, 0.2, 1.4);
  ctx.stroke();
  // Sombrero.
  ctx.beginPath();
  ctx.ellipse(4, -9, 13, 3.8, 0, 0, Math.PI * 2);
  withOutline(ctx, '#f4d27a', INK, 2);
  ctx.beginPath();
  ctx.ellipse(4, -12, 8.5, 4.2, 0, Math.PI, Math.PI * 2);
  withOutline(ctx, '#e0b45a', INK, 2);
  ctx.beginPath();
  ctx.ellipse(4, -11, 13, 2.5, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.accent || '#ff6f9d', INK, 1.4);

  // Guitar neck as a sonic weapon.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.lineTo(31, 8);
  ctx.stroke();
  ctx.strokeStyle = '#7a431c';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.lineTo(31, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(9, 12, 6.5, 5, -0.25, 0, Math.PI * 2);
  withOutline(ctx, '#d58a3a', INK, 2);
  ctx.fillStyle = hero.color2;
  ctx.beginPath();
  ctx.arc(36, 7, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRokko(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Heavy chassis.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 18, 16, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3.4);
  ctx.beginPath();
  ctx.ellipse(-7, 0, 9, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.color2;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#1a2740';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(9, -10);
  ctx.moveTo(-12, 12);
  ctx.lineTo(9, 10);
  ctx.stroke();

  // Chest panel.
  ctx.beginPath();
  ctx.roundRect(1, -8, 10, 16, 3);
  withOutline(ctx, '#1a2740', INK, 2);
  ctx.fillStyle = hero.eye;
  ctx.beginPath();
  ctx.arc(4, -3, 1.4, 0, Math.PI * 2);
  ctx.arc(4, 2, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders.
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(-2, side * 15, 6.5, 0, Math.PI * 2);
    withOutline(ctx, '#35445e', INK, 2.2);
    ctx.fillStyle = hero.color2;
    ctx.beginPath();
    ctx.arc(-2, side * 15, 1.7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Head with hard hat.
  ctx.beginPath();
  ctx.roundRect(3, -10, 17, 20, 5);
  withOutline(ctx, '#4a5d7e', INK, 2.8);
  ctx.beginPath();
  ctx.roundRect(7, -6, 11, 12, 3);
  withOutline(ctx, '#0a2038', INK, 1.8);
  ctx.strokeStyle = hero.eye;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(9, -2);
  ctx.lineTo(16, -2);
  ctx.moveTo(9, 2);
  ctx.lineTo(16, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(6, 0, 11, 6, 0, Math.PI, Math.PI * 2);
  withOutline(ctx, '#ffcf4a', INK, 2);
  ctx.beginPath();
  ctx.ellipse(6, -1.5, 13, 2.8, 0, 0, Math.PI * 2);
  withOutline(ctx, '#ffcf4a', INK, 1.6);
  ctx.fillStyle = hero.color2;
  ctx.fillRect(4, -2.3, 4, 2);

  // Giant drill.
  ctx.beginPath();
  ctx.roundRect(13, 7, 12, 10, 3);
  withOutline(ctx, '#35445e', INK, 2.2);
  ctx.beginPath();
  ctx.moveTo(24, 5);
  ctx.lineTo(46, 12);
  ctx.lineTo(24, 19);
  ctx.closePath();
  withOutline(ctx, '#f0bc46', INK, 2.4);
  ctx.strokeStyle = '#7a4a08';
  ctx.lineWidth = 1.2;
  for (let x = 27; x < 43; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 7 + (x - 24) * 0.22);
    ctx.lineTo(x + 3, 16 - (x - 24) * 0.22);
    ctx.stroke();
  }
  ctx.fillStyle = hero.color2;
  ctx.beginPath();
  ctx.arc(25, 12, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlicky(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Tail.
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.quadraticCurveTo(-28, 13, -23, -3);
  ctx.quadraticCurveTo(-20, -10, -10, -4);
  ctx.closePath();
  withOutline(ctx, hero.hair, INK, 2.2);
  ctx.fillStyle = hero.skin2 || '#ffc58f';
  ctx.beginPath();
  ctx.arc(-22, 2, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Body with adventurer vest.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 13, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3);
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.lineTo(5, -9);
  ctx.lineTo(7, 9);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  withOutline(ctx, '#244a54', INK, 1.8);
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-2, 7);
  ctx.stroke();

  // Fox head.
  ctx.beginPath();
  ctx.arc(7, 0, 12, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 2.8);
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(2, side * 7);
    ctx.lineTo(-1, side * 20);
    ctx.lineTo(9, side * 12);
    ctx.closePath();
    withOutline(ctx, hero.hair, INK, 1.8);
  });
  ctx.beginPath();
  ctx.ellipse(13, 0, 6.4, 4.6, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin2 || '#ffc58f', INK, 1.6);
  ctx.fillStyle = '#2a1608';
  ctx.beginPath();
  ctx.ellipse(17, 0, 2.2, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath();
  ctx.ellipse(12, -3.7, 2.4, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(12, 3.7, 2.4, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hero.eye;
  ctx.beginPath();
  ctx.arc(13, -3.7, 1.2, 0, Math.PI * 2);
  ctx.arc(13, 3.7, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Goggles.
  ctx.beginPath();
  ctx.arc(4, -8, 4, 0, Math.PI * 2);
  ctx.arc(4, 8, 4, 0, Math.PI * 2);
  withOutline(ctx, '#2c3c4a', INK, 1.4);
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(4, -4);
  ctx.lineTo(4, 4);
  ctx.stroke();

  // Boomerang.
  ctx.beginPath();
  ctx.moveTo(13, 10);
  ctx.quadraticCurveTo(28, 3, 35, 9);
  ctx.quadraticCurveTo(28, 13, 13, 18);
  ctx.closePath();
  withOutline(ctx, hero.color2, INK, 2);
  ctx.fillStyle = hero.accent || '#ffe38a';
  ctx.beginPath();
  ctx.arc(25, 9, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipette(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Back paint tank.
  ctx.beginPath();
  ctx.roundRect(-17, -8, 8, 16, 3);
  withOutline(ctx, hero.color, INK, 2);
  ctx.fillStyle = hero.color2;
  ctx.fillRect(-15, -3, 4, 6);

  // Overalls body.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 13, 0, 0, Math.PI * 2);
  withOutline(ctx, '#f7fbff', INK, 3);
  ctx.beginPath();
  ctx.ellipse(-4, 0, 9, 10.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d7eaff';
  ctx.fill();
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -9);
  ctx.lineTo(-3, -6);
  ctx.moveTo(-9, 9);
  ctx.lineTo(-3, 6);
  ctx.stroke();

  // Paint splats.
  ctx.fillStyle = hero.color;
  ctx.beginPath();
  ctx.arc(-7, -5, 2.2, 0, Math.PI * 2);
  ctx.arc(-10, 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hero.color2;
  ctx.beginPath();
  ctx.arc(-1, 6, 1.7, 0, Math.PI * 2);
  ctx.fill();

  drawCommonHead(ctx, entity, { radius: 10.5, headX: 6, eyeColor: '#0e5e70' });
  // Pink fringe.
  ctx.beginPath();
  ctx.arc(5, 0, 12, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(13, -9);
  ctx.lineTo(1, 2);
  ctx.closePath();
  withOutline(ctx, hero.hair, INK, 1.8);
  // Beret.
  ctx.beginPath();
  ctx.ellipse(3, -9, 10, 4, -0.15, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.8);
  ctx.beginPath();
  ctx.arc(9, -11, 1.8, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.2);

  // Paint sprayer.
  ctx.beginPath();
  ctx.roundRect(13, 3, 20, 8, 3);
  withOutline(ctx, '#f2f8ff', INK, 2);
  ctx.fillStyle = hero.color;
  ctx.fillRect(17, 5, 12, 2.2);
  ctx.beginPath();
  ctx.arc(35, 7, 3.2, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.6);
  ctx.fillStyle = hero.color;
  ctx.beginPath();
  ctx.arc(16, 13, 3.8, 0, Math.PI * 2);
  withOutline(ctx, '#fff4fb', INK, 1.6);
  ctx.restore();
}

function drawZyra(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Cyber jacket.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 13, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.dark, INK, 3);
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -11);
  ctx.lineTo(4, 0);
  ctx.lineTo(-8, 11);
  ctx.stroke();
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, -7);
  ctx.lineTo(-4, -3);
  ctx.moveTo(-12, 7);
  ctx.lineTo(-4, 3);
  ctx.stroke();

  drawCommonHead(ctx, entity, { radius: 10.5, headX: 6, eyeColor: hero.eye });
  // Blue fringe.
  ctx.beginPath();
  ctx.arc(5, 0, 12, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(14, -8);
  ctx.lineTo(2, 3);
  ctx.closePath();
  withOutline(ctx, hero.hair, INK, 1.8);
  // Headphones.
  ctx.beginPath();
  ctx.arc(4, 0, 14, Math.PI * 0.72, Math.PI * 1.28);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(2, side * 12, 3.6, 5, 0, 0, Math.PI * 2);
    withOutline(ctx, hero.color2, INK, 1.6);
  });

  // Holographic disc.
  ctx.beginPath();
  ctx.ellipse(31, 0, 4.5, 10, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.6);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = hero.color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = hero.color2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(31, 0, 2.2, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(17, 9, 3.8, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.6);
  ctx.restore();
}

function drawSharky(ctx, entity) {
  const hero = entity.hero;
  ctx.save();
  drawFeet(ctx, entity);

  // Tail fin.
  ctx.beginPath();
  ctx.moveTo(-10, 5);
  ctx.lineTo(-26, 16);
  ctx.lineTo(-20, 3);
  ctx.lineTo(-28, -6);
  ctx.lineTo(-10, -4);
  ctx.closePath();
  withOutline(ctx, hero.color, INK, 2.2);

  // Hoodie body.
  ctx.beginPath();
  ctx.ellipse(-2, 0, 15, 14, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3.2);
  ctx.beginPath();
  ctx.ellipse(-6, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = hero.color2;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Shark mouth pocket.
  ctx.beginPath();
  ctx.moveTo(-11, -8);
  ctx.lineTo(7, -7);
  ctx.lineTo(9, 7);
  ctx.lineTo(-11, 8);
  ctx.closePath();
  withOutline(ctx, '#f3fbff', INK, 1.8);
  ctx.strokeStyle = '#c8ecff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(7, 0);
  for (let x = -6; x < 6; x += 4) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 2, 3);
    ctx.lineTo(x + 4, 0);
  }
  ctx.stroke();

  // Shark hood head.
  ctx.beginPath();
  ctx.arc(7, 0, 14, 0, Math.PI * 2);
  withOutline(ctx, hero.color, INK, 3);
  ctx.beginPath();
  ctx.ellipse(10, 0, 8, 7.5, 0, 0, Math.PI * 2);
  withOutline(ctx, hero.skin, INK, 2);
  ctx.fillStyle = '#0b2a4f';
  ctx.beginPath();
  ctx.arc(12, -2.8, 1.5, 0, Math.PI * 2);
  ctx.arc(12, 2.8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6b2f1a';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(14, 0.5, 2.6, 0.1, Math.PI - 0.1);
  ctx.stroke();
  // Shark teeth frame.
  ctx.fillStyle = '#f3fbff';
  for (let y = -10; y <= 10; y += 4) {
    ctx.beginPath();
    ctx.moveTo(7, y - 2);
    ctx.lineTo(12, y);
    ctx.lineTo(7, y + 2);
    ctx.closePath();
    ctx.fill();
  }
  // Fin.
  ctx.beginPath();
  ctx.moveTo(3, -9);
  ctx.lineTo(0, -20);
  ctx.lineTo(11, -12);
  ctx.closePath();
  withOutline(ctx, hero.color2, INK, 1.6);

  // Water cannon.
  ctx.beginPath();
  ctx.roundRect(13, 4, 26, 9, 3);
  withOutline(ctx, '#e8fbff', INK, 2.2);
  ctx.fillStyle = hero.color;
  ctx.fillRect(17, 6, 16, 2.4);
  ctx.beginPath();
  ctx.arc(39, 8.5, 4, 0, Math.PI * 2);
  withOutline(ctx, hero.color2, INK, 1.6);
  ctx.fillStyle = '#d8ffff';
  ctx.beginPath();
  ctx.arc(39, 8.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(17, 14, 3.8, 0, Math.PI * 2);
  withOutline(ctx, '#12345c', INK, 1.6);
  ctx.restore();
}

const BODY_RENDERERS = {
  nova: drawNajm,
  bubblix: drawBubblix,
  grizz: drawGrizz,
  vex: drawSahm,
  pipette: drawPipette,
  cactustito: drawCactus,
  rokko: drawRokko,
  flicky: drawFlicky,
  zyra: drawZyra,
  sharky: drawSharky,
};

function drawFallenBrawler(ctx, game, entity) {
  const duration = entity.deathDuration || 0.72;
  const progress = Math.min(1, Math.max(0, 1 - entity.deathTimer / duration));
  const alpha = Math.max(0, 1 - progress * 1.08);
  const fall = Math.min(1, progress * 1.35);
  ctx.save();
  ctx.globalAlpha = alpha * 0.86;
  ctx.fillStyle = 'rgba(2,12,17,.34)';
  ctx.beginPath();
  ctx.ellipse(entity.x + 2, entity.y + 20, entity.radius + 8, entity.radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(entity.x, entity.y - 3);
  ctx.rotate((entity.deathAngle || 0) + fall * 1.2);
  ctx.translate(0, fall * 7);
  ctx.scale(1.16 * (1 - fall * 0.2), 1.16 * (1 - fall * 0.36));
  (BODY_RENDERERS[entity.heroId] || drawNajm)(ctx, entity);
  ctx.restore();
}

export function drawBrawler(ctx, game, entity) {
  if (!entity.alive) {
    if (entity.deathTimer > 0) drawFallenBrawler(ctx, game, entity);
    return;
  }
  const hiddenFromViewer =
    entity.team !== game.player.team &&
    entity.hidden &&
    distance(entity.x, entity.y, game.player.x, game.player.y) > 175;
  const alpha = hiddenFromViewer ? 0.24 : entity.hidden ? 0.68 : 1;
  const now = game.elapsed;
  const invulnerable = entity.invulnerableUntil > now;
  const superReady = entity.superCharge >= 1;
  const teamColor = entity.team === 0 ? game.arena.palette.ally : game.arena.palette.enemy;
  const speedRatio = Math.max(0, Math.min(1.3, entity.speedRatio || 0));
  const runCycle = Math.sin(entity.walkPhase * 1.7);
  const idleCycle = Math.sin(now * 2.2 + entity.id);
  const attack = Math.max(0, Math.min(1, entity.attackAnim || 0));
  const attackPulse = Math.sin(attack * Math.PI);
  const hit = Math.max(0, Math.min(1, entity.hitAnim || 0));
  const hitShake = hit > 0 ? Math.sin(now * 72 + entity.id) * hit * 2.1 : 0;
  const spawn = Math.max(0, Math.min(1, entity.spawnAnim || 0));
  const bob = entity.moving
    ? runCycle * 1.7 * Math.max(0.25, speedRatio)
    : idleCycle * 0.7;
  const lateral =
    -Math.sin(entity.aim) * (entity.velocityX || 0) +
    Math.cos(entity.aim) * (entity.velocityY || 0);
  const lean = Math.max(-0.13, Math.min(0.13, lateral / 900));
  const runSquash = entity.moving ? Math.abs(runCycle) * 0.018 * speedRatio : 0;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Ground shadow.
  ctx.fillStyle = 'rgba(2,12,17,.42)';
  ctx.beginPath();
  ctx.ellipse(entity.x + 2, entity.y + 20, entity.radius + 6, entity.radius * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  // Team indicator ring.
  ctx.strokeStyle = teamColor;
  ctx.globalAlpha = alpha * (entity.isPlayer ? 0.95 : 0.72);
  ctx.lineWidth = entity.isPlayer ? 3.2 : 2.2;
  ctx.beginPath();
  ctx.ellipse(entity.x, entity.y + 12, entity.radius + 6, (entity.radius + 6) * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (entity.isPlayer) {
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -now * 12;
    ctx.strokeStyle = '#fff6ca';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(entity.x, entity.y + 12, entity.radius + 11, (entity.radius + 11) * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = alpha;

  if (superReady) {
    const pulse = 0.35 + Math.sin(now * 5) * 0.15;
    ctx.globalAlpha = alpha * pulse;
    ctx.strokeStyle = entity.hero.color2;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(entity.x, entity.y + 12, entity.radius + 17, (entity.radius + 17) * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }

  // Spawn shield.
  if (invulnerable) {
    const shieldPulse = 0.45 + Math.sin(now * 8) * 0.15;
    ctx.globalAlpha = alpha * shieldPulse;
    ctx.strokeStyle = '#c5ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y - 2 + bob, entity.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }

  ctx.translate(entity.x, entity.y - 3 + bob);
  ctx.scale(
    1.16 + attackPulse * 0.065 + spawn * 0.12 + runSquash,
    1.16 - attackPulse * 0.045 + spawn * 0.12 - runSquash,
  );
  ctx.rotate(entity.aim + lean);
  ctx.translate(attackPulse * 4.2 + hitShake, 0);
  (BODY_RENDERERS[entity.heroId] || drawNajm)(ctx, entity);

  if (attackPulse > 0.04) {
    const muzzle = entity.radius + 17;
    ctx.save();
    ctx.translate(muzzle, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = attackPulse * 0.95;
    ctx.fillStyle = entity.hero.color;
    ctx.beginPath();
    ctx.moveTo(15 * attackPulse, 0);
    ctx.lineTo(-4, 7 * attackPulse);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, -7 * attackPulse);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2 * attackPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (now < entity.flashUntil || hit > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (0.45 + hit * 0.2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, entity.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();

  if (hiddenFromViewer) return;

  // Health and name plate.
  const barWidth = entity.isPlayer ? 58 : 46;
  const barHeight = 6.5;
  const barY = entity.y - 48;
  const hpRatio = Math.max(0, entity.hp / entity.maxHp);
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = 'rgba(7,10,22,.82)';
  ctx.strokeStyle = 'rgba(0,0,0,.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(entity.x - barWidth / 2, barY, barWidth, barHeight, 3);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(entity.x - barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2, 2.5);
  ctx.clip();
  const hpColor = hpRatio > 0.55 ? '#62f78b' : hpRatio > 0.28 ? '#ffc548' : '#ff5d6c';
  ctx.fillStyle = hpColor;
  ctx.fillRect(entity.x - barWidth / 2, barY, barWidth, barHeight);
  ctx.restore();

  if (entity.shieldHp > 0) {
    ctx.fillStyle = 'rgba(192,255,250,.9)';
    ctx.fillRect(
      entity.x - barWidth / 2 + 1,
      barY - 3,
      (barWidth - 2) * Math.min(1, entity.shieldHp / 950),
      2,
    );
  }

  ctx.font = '700 10px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = entity.isPlayer ? '#fff3b0' : teamColor;
  ctx.shadowColor = 'rgba(0,0,0,.8)';
  ctx.shadowBlur = 3;
  ctx.fillText(entity.isPlayer ? `${entity.name} • أنت` : entity.name, entity.x, barY - 4);
  ctx.shadowBlur = 0;

  if (entity.gems > 0) {
    const gemX = entity.x + barWidth / 2 + 10;
    const gemY = barY + 3;
    ctx.fillStyle = '#61f7e0';
    ctx.strokeStyle = '#0b4b4f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gemX, gemY - 5);
    ctx.lineTo(gemX + 4.5, gemY);
    ctx.lineTo(gemX, gemY + 5);
    ctx.lineTo(gemX - 4.5, gemY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 10px Cairo, sans-serif';
    ctx.fillStyle = '#efffff';
    ctx.textAlign = 'left';
    ctx.fillText(String(entity.gems), gemX + 7, gemY + 4);
  }

  if (entity.isPlayer) {
    ctx.fillStyle = '#ffd45e';
    ctx.beginPath();
    ctx.moveTo(entity.x, barY - 20);
    ctx.lineTo(entity.x - 5, barY - 28);
    ctx.lineTo(entity.x + 5, barY - 28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
