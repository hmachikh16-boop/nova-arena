export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const random = (min, max) => min + Math.random() * (max - min);
export const randomInt = (min, max) => Math.floor(random(min, max + 1));
export const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const distanceSq = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const approach = (value, target, delta) =>
  value < target ? Math.min(value + delta, target) : Math.max(value - delta, target);

export const angleDelta = (from, to) => {
  let delta = (to - from + Math.PI) % TAU;
  if (delta < 0) delta += TAU;
  return delta - Math.PI;
};

export const turnToward = (from, to, maxStep) => from + clamp(angleDelta(from, to), -maxStep, maxStep);

export function shuffle(values) {
  const list = [...values];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

export function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (length < 0.0001) return { x: 0, y: 0, length: 0 };
  return { x: x / length, y: y / length, length };
}

export function pointInRect(x, y, rect, padding = 0) {
  return (
    x >= rect.x - padding &&
    x <= rect.x + rect.w + padding &&
    y >= rect.y - padding &&
    y <= rect.y + rect.h + padding
  );
}

export function circleHitsRect(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.w);
  const closestY = clamp(y, rect.y, rect.y + rect.h);
  return distanceSq(x, y, closestX, closestY) < radius * radius;
}

export function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function hexToRgba(hex, alpha) {
  const cleaned = hex.replace('#', '');
  const value = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned;
  const number = Number.parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
