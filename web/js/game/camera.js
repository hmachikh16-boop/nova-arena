import { clamp } from './utils.js';

/**
 * Smooth, clamped arena camera with a small amount of look-ahead.
 *
 * The world is exactly one screen wide, so the camera deliberately uses a
 * slight zoom. That gives the scene a little breathing room and makes player
 * movement feel less rigid. Clamping keeps the view inside the arena.
 */
export class ArenaCamera {
  constructor(world, options = {}) {
    this.world = world;
    this.zoom = options.zoom ?? 1.12;
    this.targetZoom = this.zoom;
    this.x = world.width / 2;
    this.y = world.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  snap(x, y) {
    this.targetX = this.clampX(x);
    this.targetY = this.clampY(y);
    this.x = this.targetX;
    this.y = this.targetY;
  }

  halfWidth() {
    return this.world.width / (2 * this.zoom);
  }

  halfHeight() {
    return this.world.height / (2 * this.zoom);
  }

  clampX(value) {
    const half = this.halfWidth();
    return clamp(value, half, this.world.width - half);
  }

  clampY(value) {
    const half = this.halfHeight();
    return clamp(value, half, this.world.height - half);
  }

  update(dt, player) {
    if (!player) return;
    const speedRatio = clamp(
      Math.hypot(player.velocityX || 0, player.velocityY || 0) / Math.max(1, player.hero.speed),
      0,
      1,
    );
    const lookDistance = 22 + speedRatio * 38;
    const lookX = clamp(
      (player.velocityX || 0) * 0.14 + Math.cos(player.aim || 0) * 8,
      -lookDistance,
      lookDistance,
    );
    const lookY = clamp(
      (player.velocityY || 0) * 0.14 + Math.sin(player.aim || 0) * 8,
      -lookDistance * 0.55,
      lookDistance * 0.55,
    );

    this.targetX = this.clampX(player.x + lookX);
    this.targetY = this.clampY(player.y + lookY);
    this.targetZoom = 1.12 + speedRatio * 0.015;

    const positionBlend = 1 - Math.exp(-dt * 7.2);
    const zoomBlend = 1 - Math.exp(-dt * 3.4);
    this.x += (this.targetX - this.x) * positionBlend;
    this.y += (this.targetY - this.y) * positionBlend;
    this.zoom += (this.targetZoom - this.zoom) * zoomBlend;
  }

  setShake(amount) {
    this.shakeX = amount > 0 ? (Math.random() - 0.5) * amount : 0;
    this.shakeY = amount > 0 ? (Math.random() - 0.5) * amount : 0;
  }

  apply(ctx, viewWidth, viewHeight) {
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.shakeX, -this.y + this.shakeY);
  }

  screenToWorld(screenX, screenY, viewWidth, viewHeight) {
    return {
      x: (screenX - viewWidth / 2) / this.zoom + this.x - this.shakeX,
      y: (screenY - viewHeight / 2) / this.zoom + this.y - this.shakeY,
    };
  }

  worldToScreen(worldX, worldY, viewWidth, viewHeight) {
    return {
      x: (worldX - this.x + this.shakeX) * this.zoom + viewWidth / 2,
      y: (worldY - this.y + this.shakeY) * this.zoom + viewHeight / 2,
    };
  }
}
