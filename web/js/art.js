import { ARENA, RARITIES } from './data.js';

export { portrait, heroMiniIcon } from './portraits.js';

export function rarityChip(rarityKey, extraClass = '') {
  const rarity = RARITIES[rarityKey] || RARITIES.rare;
  return `<span class="rarity-chip ${extraClass}" style="--rarity:${rarity.color};--rarity-soft:${rarity.soft}">${rarity.name}</span>`;
}

export function roleIcon(key, className = '') {
  const icons = {
    tank: '<path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6l-7-3Z"/><path d="M9 10h6M12 7v9"/>',
    marksman: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    support: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M8 11h8M12 7v8"/>',
    assassin: '<path d="m4 20 4-1 11-11-2-2L6 17l-2 3Z"/><path d="m14 4 6 6M15 3l6 6"/>',
  };
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.marksman}</svg>`;
}

export function icon(name, className = '') {
  const paths = {
    trophy: '<path d="M7 4h10v4c0 3.3-2.2 6-5 6S7 11.3 7 8V4Z"/><path d="M7 6H3v2c0 2.2 1.8 4 4 4M17 6h4v2c0 2.2-1.8 4-4 4"/><path d="M12 14v4M8 21h8M9 18h6"/>',
    gem: '<path d="m6 4 12 0 4 6-10 11L2 10l4-6Z" fill="currentColor" stroke="none"/><path d="m2 10 20 0M8 4l2 6 2 11 2-11 2-6" stroke="rgba(255,255,255,.55)" stroke-width="1.2" fill="none"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M12 6v12M15 8.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" fill="none" stroke="rgba(70,42,0,.7)" stroke-width="1.7"/>',
    play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    soundOn: '<path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    soundOff: '<path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="m17 9 5 6M22 9l-5 6"/>',
    expand: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    shield: '<path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6l-7-3Z"/>',
    sword: '<path d="m4 20 4-1 11-11-2-2L6 17l-2 3Z"/><path d="m14 4 6 6"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    speed: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><path d="M3 20h18"/>',
    zap: '<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',
    crown: '<path d="m3 7 5 4 4-7 4 7 5-4-2 12H5L3 7Z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M17 14c2.3.6 4 2.6 4 5"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    flame: '<path d="M12 22c4 0 7-2.6 7-6.5 0-3-1.8-5.1-3.8-7.4C14 6.8 13 4.8 13 2c-4.2 2.3-6 5.5-6 8.2 0 1 .2 2 .6 2.9C6.4 12.3 5 11 5 9c-1 1.8-1.5 3.7-1.5 5.6C3.5 19.4 7 22 12 22Z"/><path d="M12 22c-2.2 0-3.5-1.4-3.5-3.2 0-2.3 2-3.5 3.5-5.8 1.5 2.3 3.5 3.5 3.5 5.8 0 1.8-1.3 3.2-3.5 3.2Z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    users3: '<circle cx="12" cy="7" r="3"/><circle cx="5.5" cy="9" r="2"/><circle cx="18.5" cy="9" r="2"/><path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5M1 18c0-2.2 1.3-4 3.5-4M23 18c0-2.2-1.3-4-3.5-4"/>',
    arrowLeft: '<path d="M19 12H5m6-7-7 7 7 7"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',
    rank: '<path d="M12 3 15 9l6 .9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.9 9 9l3-6Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
    spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M5 19l2.5-2.5"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
  };
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
}

export function mapThumb(arena = ARENA) {
  const { walls, bushes, palette, gemMine, spawns } = arena;
  const wallMarkup = walls
    .map(
      (wall) =>
        `<g><rect x="${wall.x + 8}" y="${wall.y + 10}" width="${wall.w}" height="${wall.h}" rx="9" fill="${palette.border}" opacity=".55"/><rect x="${wall.x}" y="${wall.y}" width="${wall.w}" height="${wall.h}" rx="9" fill="${palette.wallFace}" stroke="${palette.border}" stroke-width="7"/><rect x="${wall.x + 7}" y="${wall.y + 5}" width="${wall.w - 14}" height="${wall.h - 14}" rx="6" fill="${palette.wallTop}"/><rect x="${wall.x + 10}" y="${wall.y + 7}" width="${wall.w - 20}" height="4" rx="2" fill="${palette.wallEdge}" opacity=".6"/></g>`,
    )
    .join('');
  const bushMarkup = bushes
    .map(
      (bush) =>
        `<rect x="${bush.x}" y="${bush.y}" width="${bush.w}" height="${bush.h}" rx="${Math.min(bush.h / 2, 36)}" fill="${palette.bush}" opacity=".9" stroke="${palette.bushDark}" stroke-width="4"/>`,
    )
    .join('');
  const allySpawn = spawns?.ally?.[0] || { x: 150, y: 620 };
  const enemySpawn = spawns?.enemy?.[0] || { x: 1130, y: 100 };
  const themeGlow =
    arena.theme === 'neon'
      ? `<rect width="1280" height="720" fill="url(#neonWash)" opacity=".8"/>`
      : arena.theme === 'space'
        ? `<rect width="1280" height="720" fill="url(#spaceWash)" opacity=".9"/>`
        : '';
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="mapWash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.ground}"/><stop offset=".55" stop-color="${palette.groundMid || palette.ground}"/><stop offset="1" stop-color="${palette.groundAlt}"/></linearGradient>
      <radialGradient id="neonWash"><stop stop-color="${palette.mine}" stop-opacity=".12"/><stop offset=".7" stop-color="${palette.ground}" stop-opacity="0"/></radialGradient>
      <radialGradient id="spaceWash"><stop stop-color="${palette.mine}" stop-opacity=".16"/><stop offset=".65" stop-color="${palette.ground}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#mapWash)"/>
    ${themeGlow}
    <g opacity=".2" stroke="${palette.groundLine}" stroke-width="2">
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${120 + i * 150} 0V720" />`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${100 + i * 140}H1280" />`).join('')}
    </g>
    <circle cx="${gemMine.x}" cy="${gemMine.y}" r="105" fill="none" stroke="${palette.gold}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 12"/>
    <circle cx="${gemMine.x}" cy="${gemMine.y}" r="47" fill="${palette.mine}" opacity=".25"/>
    <circle cx="${gemMine.x}" cy="${gemMine.y}" r="18" fill="${palette.mine}"/>
    ${bushMarkup}
    ${wallMarkup}
    <circle cx="${allySpawn.x}" cy="${allySpawn.y}" r="45" fill="${palette.ally}" opacity=".28"/>
    <circle cx="${enemySpawn.x}" cy="${enemySpawn.y}" r="45" fill="${palette.enemy}" opacity=".28"/>
    <rect x="10" y="10" width="1260" height="700" rx="18" fill="none" stroke="${palette.border}" stroke-width="20" opacity=".9"/>
  </svg>`;
}
