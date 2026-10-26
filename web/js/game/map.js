import { ARENA, WORLD } from '../data.js';
import { circleHitsRect, clamp, distance, pointInRect } from './utils.js';
import { drawMapLayer } from './map-render.js';

function segmentHitsWall(x1, y1, x2, y2, walls, padding = 0) {
  const length = distance(x1, y1, x2, y2);
  const steps = Math.max(1, Math.ceil(length / 14));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const wall of walls) {
      if (pointInRect(x, y, wall, padding)) return true;
    }
  }
  return false;
}

export function createWorldMap(arena = ARENA) {
  const walls = arena.walls;
  const bushes = arena.bushes;
  const border = WORLD.border;

  function isInsideWorld(x, y, radius = 0) {
    return (
      x >= border + radius &&
      x <= WORLD.width - border - radius &&
      y >= border + radius &&
      y <= WORLD.height - border - radius
    );
  }

  function collides(x, y, radius = 20) {
    if (!isInsideWorld(x, y, radius)) return true;
    for (const wall of walls) {
      if (circleHitsRect(x, y, radius, wall)) return true;
    }
    return false;
  }

  function pointInWall(x, y, padding = 0) {
    if (!isInsideWorld(x, y)) return true;
    for (const wall of walls) {
      if (pointInRect(x, y, wall, padding)) return true;
    }
    return false;
  }

  function lineOfSight(x1, y1, x2, y2, padding = 0) {
    if (wallSegmentHits(x1, y1, x2, y2, padding)) return false;
    return true;
  }

  function wallSegmentHits(x1, y1, x2, y2, padding = 0) {
    return segmentHitsWall(x1, y1, x2, y2, walls, padding);
  }

  function pointInBush(x, y, padding = 0) {
    for (const bush of bushes) {
      if (pointInRect(x, y, bush, padding)) return true;
    }
    return false;
  }

  function raycast(x, y, angle, maxDistance = 900, step = 7) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let travelled = step; travelled <= maxDistance; travelled += step) {
      const px = x + dx * travelled;
      const py = y + dy * travelled;
      if (pointInWall(px, py)) return travelled - step;
    }
    return maxDistance;
  }

  const cols = Math.floor(WORLD.width / 40);
  const rows = Math.floor(WORLD.height / 40);
  const cellSize = 40;
  const blocked = new Uint8Array(cols * rows);

  function cellCenter(col, row) {
    return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 };
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const { x, y } = cellCenter(col, row);
      blocked[row * cols + col] = collides(x, y, 23) ? 1 : 0;
    }
  }

  function nearestOpenCell(col, row) {
    if (col >= 0 && col < cols && row >= 0 && row < rows && !blocked[row * cols + col]) {
      return { col, row };
    }
    for (let radius = 1; radius <= 7; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const c = col + dx;
          const r = row + dy;
          if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
          if (!blocked[r * cols + c]) return { col: c, row: r };
        }
      }
    }
    return null;
  }

  function findPath(startX, startY, goalX, goalY) {
    const startCol = clamp(Math.floor(startX / cellSize), 0, cols - 1);
    const startRow = clamp(Math.floor(startY / cellSize), 0, rows - 1);
    const goalCol = clamp(Math.floor(goalX / cellSize), 0, cols - 1);
    const goalRow = clamp(Math.floor(goalY / cellSize), 0, rows - 1);
    const start = nearestOpenCell(startCol, startRow);
    const goal = nearestOpenCell(goalCol, goalRow);
    if (!start || !goal) return [];
    if (start.col === goal.col && start.row === goal.row) {
      return [{ x: goalX, y: goalY }];
    }

    const startIndex = start.row * cols + start.col;
    const goalIndex = goal.row * cols + goal.col;
    const count = cols * rows;
    const gScore = new Float32Array(count);
    const fScore = new Float32Array(count);
    const cameFrom = new Int32Array(count);
    const closed = new Uint8Array(count);
    const inOpen = new Uint8Array(count);
    gScore.fill(Number.POSITIVE_INFINITY);
    fScore.fill(Number.POSITIVE_INFINITY);
    cameFrom.fill(-1);
    gScore[startIndex] = 0;

    const heuristic = (col, row) => {
      const dx = Math.abs(col - goal.col);
      const dy = Math.abs(row - goal.row);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };
    fScore[startIndex] = heuristic(start.col, start.row);
    const open = [startIndex];
    inOpen[startIndex] = 1;

    let iterations = 0;
    while (open.length && iterations < 800) {
      iterations += 1;
      let bestPosition = 0;
      for (let index = 1; index < open.length; index += 1) {
        if (fScore[open[index]] < fScore[open[bestPosition]]) bestPosition = index;
      }
      const current = open.splice(bestPosition, 1)[0];
      inOpen[current] = 0;
      if (current === goalIndex) {
        const path = [];
        let cursor = current;
        while (cursor !== -1 && cursor !== startIndex) {
          const col = cursor % cols;
          const row = Math.floor(cursor / cols);
          path.push(cellCenter(col, row));
          cursor = cameFrom[cursor];
        }
        path.reverse();
        if (path.length) path[path.length - 1] = { x: goalX, y: goalY };
        else path.push({ x: goalX, y: goalY });
        return path;
      }
      closed[current] = 1;
      const col = current % cols;
      const row = Math.floor(current / cols);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nextCol = col + dx;
          const nextRow = row + dy;
          if (nextCol < 0 || nextCol >= cols || nextRow < 0 || nextRow >= rows) continue;
          if (blocked[nextRow * cols + nextCol]) continue;
          if (dx !== 0 && dy !== 0) {
            if (blocked[row * cols + nextCol] || blocked[nextRow * cols + col]) continue;
          }
          const next = nextRow * cols + nextCol;
          if (closed[next]) continue;
          const moveCost = dx !== 0 && dy !== 0 ? Math.SQRT2 : 1;
          const tentative = gScore[current] + moveCost;
          if (tentative >= gScore[next]) continue;
          cameFrom[next] = current;
          gScore[next] = tentative;
          fScore[next] = tentative + heuristic(nextCol, nextRow);
          if (!inOpen[next]) {
            open.push(next);
            inOpen[next] = 1;
          }
        }
      }
    }
    return [];
  }

  const layer = drawMapLayer({
    arena,
    world: WORLD,
    createCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = WORLD.width;
      canvas.height = WORLD.height;
      return canvas;
    },
  });

  return {
    arena,
    walls,
    bushes,
    palette: arena.palette,
    collides,
    pointInWall,
    lineOfSight,
    wallSegmentHits,
    pointInBush,
    raycast,
    findPath,
    layer,
  };
}

export { segmentHitsWall };
