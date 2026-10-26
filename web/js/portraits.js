import { HEROES, RARITIES, rarityOf } from './data.js';

const INK = '#160f26';
const OUTLINE = `stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;
let portraitSequence = 0;

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '');
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function shade(hex, amount) {
  const clean = String(hex || '#888888').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const value = parseInt(full.slice(0, 6), 16);
  const target = amount < 0 ? 0 : 255;
  const mix = Math.abs(amount) / 100;
  const red = clampChannel(((value >> 16) & 255) + (target - ((value >> 16) & 255)) * mix);
  const green = clampChannel(((value >> 8) & 255) + (target - ((value >> 8) & 255)) * mix);
  const blue = clampChannel((value & 255) + (target - (value & 255)) * mix);
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function gradient(id, stops, options = '') {
  return `<linearGradient id="${id}" ${options}>${stops
    .map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`)
    .join('')}</linearGradient>`;
}

function radial(id, stops, options = '') {
  return `<radialGradient id="${id}" ${options}>${stops
    .map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`)
    .join('')}</radialGradient>`;
}

function starPath(cx, cy, outer, inner = outer * 0.44, points = 5) {
  const path = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    path.push(`${index === 0 ? 'M' : 'L'}${(cx + Math.cos(angle) * radius).toFixed(2)} ${(cy + Math.sin(angle) * radius).toFixed(2)}`);
  }
  return `${path.join(' ')}Z`;
}

function sparkle(cx, cy, radius, color, opacity = 0.85) {
  return `<path d="${starPath(cx, cy, radius, radius * 0.24, 4)}" fill="${color}" opacity="${opacity}"/>`;
}

function portraitDefs(hero, p) {
  const skinLight = hero.skin2 || shade(hero.skin, 24);
  const skinDark = shade(hero.skin, -26);
  const hairLight = hero.hair2 ? shade(hero.hair, 18) : shade(hero.hair, 26);
  const hairDark = shade(hero.hair, -30);
  return `
    <defs>
      ${radial(`bg${p}`, [
        [0, hero.color, 0.9],
        [0.42, hero.color, 0.38],
        [0.74, hero.dark, 0.94],
        [1, shade(hero.dark, -16), 1],
      ], 'cx="50%" cy="35%" r="78%"')}
      ${gradient(`skin${p}`, [
        [0, skinLight],
        [0.42, hero.skin],
        [1, skinDark],
      ], 'x1="0" y1="0" x2="0.82" y2="1"')}
      ${gradient(`hair${p}`, [
        [0, hairLight],
        [0.46, hero.hair],
        [1, hairDark],
      ], 'x1="0.15" y1="0" x2="0.85" y2="1"')}
      ${gradient(`cloth${p}`, [
        [0, shade(hero.color, 20)],
        [0.48, hero.color],
        [1, shade(hero.color, -22)],
      ], 'x1="0" y1="0" x2="0.9" y2="1"')}
      ${gradient(`cloth2${p}`, [
        [0, shade(hero.color2, 22)],
        [0.52, hero.color2],
        [1, shade(hero.color2, -26)],
      ], 'x1="0" y1="0" x2="0.9" y2="1"')}
      ${gradient(`dark${p}`, [
        [0, shade(hero.dark, 30)],
        [0.6, hero.dark],
        [1, shade(hero.dark, -18)],
      ], 'x1="0" y1="0" x2="1" y2="1"')}
      ${gradient(`metal${p}`, [
        [0, '#f5fbff'],
        [0.24, '#aebed4'],
        [0.56, '#53657f'],
        [1, '#202b40'],
      ], 'x1="0" y1="0" x2="1" y2="1"')}
      ${gradient(`gold${p}`, [
        [0, '#fff8bd'],
        [0.28, '#ffe172'],
        [0.62, '#ffc22e'],
        [1, '#d47f00'],
      ], 'x1="0" y1="0" x2="0.7" y2="1"')}
      ${radial(`eye${p}`, [
        [0, shade(hero.eye, 38)],
        [0.56, hero.eye],
        [1, shade(hero.eye, -36)],
      ], 'cx="42%" cy="34%" r="72%"')}
      ${radial(`iris${p}`, [
        [0, '#1d122b'],
        [0.65, '#0c0716'],
        [1, '#05030a'],
      ], 'cx="45%" cy="42%" r="70%"')}
      ${radial(`vignette${p}`, [
        [0.55, '#000000', 0],
        [1, '#02010a', 0.42],
      ], 'cx="50%" cy="42%" r="72%"')}
      ${radial(`softGlow${p}`, [
        [0, hero.color2, 0.75],
        [1, hero.color2, 0],
      ], 'cx="50%" cy="50%" r="50%"')}
      <filter id="glow${p}" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="soft${p}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
      <filter id="shadow${p}" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#03010b" flood-opacity=".45"/>
      </filter>
      <pattern id="dots${p}" width="19" height="19" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2" fill="#ffffff" opacity=".55"/>
      </pattern>
      <pattern id="grid${p}" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none" stroke="${hero.color2}" stroke-width="1" opacity=".25"/>
      </pattern>
      <pattern id="hazard${p}" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="17" height="34" fill="#ffd45e" opacity=".2"/>
      </pattern>
    </defs>`;
}

function motifMarkup(hero, p) {
  const c = hero.color;
  const c2 = hero.color2;
  const accent = hero.accent || c2;
  switch (hero.motif) {
    case 'stars':
      return `
        <g opacity=".9">
          <path d="${starPath(210, 205, 154, 22, 12)}" fill="${c2}" opacity=".08"/>
          ${sparkle(72, 116, 11, '#ffffff', 0.72)}
          ${sparkle(345, 138, 8, c2, 0.8)}
          ${sparkle(320, 310, 6, '#ffffff', 0.55)}
          ${sparkle(96, 320, 5, c2, 0.6)}
          <circle cx="355" cy="244" r="3.5" fill="#fff" opacity=".75"/>
          <circle cx="55" cy="238" r="2.8" fill="#fff" opacity=".65"/>
          <circle cx="122" cy="92" r="2.2" fill="#fff" opacity=".5"/>
        </g>
        <path d="M0 410 Q80 360 170 402 T420 386 V480 H0Z" fill="${shade(hero.dark, 9)}" opacity=".55"/>`;
    case 'bubbles':
      return `
        <g fill="none" stroke="${c2}" stroke-width="2.5" opacity=".42">
          <circle cx="68" cy="112" r="23"/><circle cx="352" cy="150" r="17"/>
          <circle cx="326" cy="84" r="9"/><circle cx="108" cy="290" r="13"/>
          <circle cx="368" cy="330" r="27"/><circle cx="44" cy="360" r="11"/>
        </g>
        <g fill="${c2}" opacity=".2">
          <circle cx="68" cy="112" r="16"/><circle cx="352" cy="150" r="11"/>
          <circle cx="368" cy="330" r="19"/>
        </g>
        <path d="M0 420 Q120 382 230 416 T420 400 V480 H0Z" fill="${hero.dark}" opacity=".48"/>`;
    case 'forest':
      return `
        <g fill="${accent}" opacity=".2">
          <path d="M42 104 C74 74 102 92 94 128 C76 154 42 142 42 104Z"/>
          <path d="M362 92 C394 58 414 92 394 120 C374 146 344 128 362 92Z"/>
          <path d="M32 318 C64 288 94 310 84 344 C64 370 30 354 32 318Z"/>
        </g>
        <g fill="none" stroke="${c2}" stroke-width="3" opacity=".3">
          <path d="M84 90 L114 120 M100 76 L100 104 M326 318 L356 348 M340 304 L340 332"/>
          <path d="M352 88 L374 110 M364 76 L364 96"/>
        </g>
        <g fill="${c2}" opacity=".26">
          <path d="M356 218 l7 17 17 7 -17 7 -7 17 -7 -17 -17 -7 17 -7z"/>
        </g>
        <path d="M0 408 Q110 360 224 406 T420 392 V480 H0Z" fill="${hero.dark}" opacity=".55"/>`;
    case 'shadows':
      return `
        <g fill="${c}" opacity=".25">
          <path d="M20 390 C54 310 38 246 104 204 C138 182 142 140 190 116 C154 178 176 196 142 242 C100 298 120 352 76 414Z"/>
          <path d="M400 396 C374 318 394 252 330 212 C296 190 292 148 248 122 C284 182 262 200 296 246 C336 300 316 356 358 416Z"/>
        </g>
        <g fill="none" stroke="${c2}" stroke-width="2.5" opacity=".4">
          <path d="M52 250 C94 218 94 178 134 158"/>
          <path d="M368 246 C326 214 326 174 286 154"/>
          <circle cx="210" cy="76" r="44" stroke-dasharray="4 12"/>
        </g>
        <g fill="${c2}" opacity=".82" filter="url(#glow${p})">
          <path d="M74 116 l9 25 25 9 -25 9 -9 25 -9 -25 -25 -9 25 -9z" opacity=".6"/>
          <circle cx="348" cy="310" r="4"/>
          <circle cx="92" cy="324" r="3"/>
        </g>
        <path d="M0 416 Q120 376 226 414 T420 396 V480 H0Z" fill="${hero.dark}" opacity=".62"/>`;
    case 'paint':
      return `
        <g fill="${c}" opacity=".38">
          <path d="M32 82 C58 54 100 68 104 98 C110 134 70 150 46 128 C28 112 22 98 32 82Z"/>
          <path d="M338 64 C372 48 406 72 394 106 C382 138 342 142 326 114 C314 94 320 76 338 64Z"/>
          <path d="M54 320 C84 296 124 316 118 348 C112 382 66 390 48 362 C38 346 42 332 54 320Z"/>
          <path d="M318 332 C346 310 382 330 376 360 C370 390 332 400 314 376 C304 362 306 344 318 332Z"/>
        </g>
        <g fill="${c2}" opacity=".55">
          <circle cx="94" cy="158" r="7"/><circle cx="338" cy="198" r="5"/>
          <circle cx="72" cy="246" r="4"/><circle cx="360" cy="278" r="6"/>
          <circle cx="126" cy="388" r="3"/><circle cx="298" cy="402" r="4"/>
        </g>
        <path d="M0 414 Q118 376 226 412 T420 396 V480 H0Z" fill="${hero.dark}" opacity=".5"/>`;
    case 'fiesta':
      return `
        <g fill="${c2}" opacity=".2">
          <path d="M0 54 L420 54 L420 92 L0 92Z"/>
        </g>
        <g stroke="${c}" stroke-width="2" opacity=".5">
          <path d="M0 54 L42 92 M70 54 L112 92 M140 54 L182 92 M210 54 L252 92 M280 54 L322 92 M350 54 L392 92" fill="none"/>
        </g>
        <g fill="${accent}" opacity=".65">
          <rect x="54" y="72" width="13" height="13" rx="2" transform="rotate(24 60 78)"/>
          <rect x="154" y="70" width="10" height="10" rx="2" transform="rotate(-18 159 75)"/>
          <rect x="266" y="74" width="12" height="12" rx="2" transform="rotate(32 272 80)"/>
          <rect x="354" y="68" width="9" height="9" rx="2" transform="rotate(-26 358 72)"/>
        </g>
        <g opacity=".5" fill="${c2}">
          <circle cx="78" cy="146" r="4"/><circle cx="338" cy="128" r="5"/>
          <circle cx="56" cy="280" r="3"/><circle cx="364" cy="300" r="4"/>
        </g>
        <path d="M0 414 Q118 376 226 412 T420 396 V480 H0Z" fill="${hero.dark}" opacity=".5"/>`;
    case 'construction':
      return `
        <rect x="0" y="0" width="420" height="112" fill="url(#hazard${p})" opacity=".6"/>
        <g fill="${c2}" opacity=".28">
          <circle cx="54" cy="138" r="14"/><circle cx="366" cy="144" r="14"/>
          <circle cx="52" cy="298" r="10"/><circle cx="368" cy="310" r="10"/>
        </g>
        <g fill="none" stroke="${c}" stroke-width="4" opacity=".35">
          <path d="M30 186 L88 186 M332 186 L390 186"/>
          <path d="M34 330 L80 330 M340 330 L388 330"/>
        </g>
        <path d="M0 412 Q112 370 224 408 T420 392 V480 H0Z" fill="${hero.dark}" opacity=".6"/>`;
    case 'desert':
      return `
        <circle cx="210" cy="176" r="126" fill="none" stroke="${c2}" stroke-width="2" opacity=".18"/>
        <g fill="${c2}" opacity=".26">
          <path d="M0 390 Q96 336 190 380 T420 366 V480 H0Z"/>
          <path d="M0 420 Q120 382 226 416 T420 400 V480 H0Z" fill="${c}" opacity=".3"/>
        </g>
        <g fill="none" stroke="${c2}" stroke-width="3" opacity=".35">
          <path d="M42 298 C90 272 126 288 154 312"/>
          <path d="M278 118 C312 100 346 106 376 128"/>
        </g>
        <g opacity=".55" fill="#fff">
          <circle cx="72" cy="208" r="3"/><circle cx="338" cy="242" r="4"/><circle cx="86" cy="356" r="2"/>
        </g>
        <path d="M0 414 Q118 376 226 412 T420 396 V480 H0Z" fill="${hero.dark}" opacity=".5"/>`;
    case 'cyber':
      return `
        <rect width="420" height="480" fill="url(#grid${p})" opacity=".55"/>
        <g fill="none" stroke="${c}" stroke-width="2" opacity=".35">
          <path d="M24 126 H104 V58"/><path d="M396 334 H314 V408"/>
          <path d="M32 348 H88"/><path d="M336 80 H388"/>
        </g>
        <g fill="none" stroke="${c2}" stroke-width="2.5" opacity=".55">
          <rect x="42" y="80" width="44" height="44" rx="8" transform="rotate(12 64 102)"/>
          <rect x="330" y="300" width="38" height="38" rx="7" transform="rotate(-14 349 319)"/>
        </g>
        <g fill="${c2}" opacity=".72" filter="url(#glow${p})">
          <circle cx="64" cy="102" r="3"/><circle cx="349" cy="319" r="3"/>
          <circle cx="350" cy="142" r="2.4"/><circle cx="70" cy="338" r="2.4"/>
        </g>
        <path d="M0 418 Q120 380 226 416 T420 398 V480 H0Z" fill="${hero.dark}" opacity=".58"/>`;
    case 'ocean':
      return `
        <g fill="none" stroke="${c2}" stroke-width="3" opacity=".3">
          <path d="M0 162 C44 138 82 186 126 162 C170 138 208 186 252 162 C296 138 334 186 378 162 C398 150 412 154 420 160"/>
          <path d="M0 204 C44 180 82 228 126 204 C170 180 208 228 252 204 C296 180 334 228 378 204"/>
          <path d="M0 336 C50 312 90 360 140 336 C190 312 230 360 280 336 C330 312 370 360 420 336"/>
        </g>
        <g fill="none" stroke="${c2}" stroke-width="2" opacity=".45">
          <circle cx="70" cy="112" r="18"/><circle cx="352" cy="90" r="11"/>
          <circle cx="368" cy="280" r="22"/><circle cx="52" cy="284" r="9"/>
        </g>
        <g fill="${c2}" opacity=".26">
          <circle cx="70" cy="112" r="12"/><circle cx="368" cy="280" r="15"/>
        </g>
        <path d="M0 418 Q120 380 226 416 T420 398 V480 H0Z" fill="${hero.dark}" opacity=".55"/>`;
    default:
      return `<path d="M0 414 Q118 376 226 412 T420 396 V480 H0Z" fill="${hero.dark}" opacity=".5"/>`;
  }
}

function portraitBackground(hero, p) {
  return `
    <rect width="420" height="480" fill="url(#bg${p})"/>
    <g color="${hero.color2}" opacity=".16" transform="translate(210 190)">
      ${Array.from({ length: 16 }, (_, index) => {
        const angle = (360 / 16) * index;
        return `<path d="M0 -34 L-26 -300 L26 -300 Z" transform="rotate(${angle})" fill="currentColor"/>`;
      }).join('')}
    </g>
    <circle cx="210" cy="196" r="176" fill="none" stroke="${hero.color2}" stroke-opacity=".18" stroke-width="2" stroke-dasharray="5 14"/>
    <circle cx="210" cy="196" r="202" fill="none" stroke="${hero.color2}" stroke-opacity=".09" stroke-width="26"/>
    <rect width="420" height="480" fill="url(#dots${p})" opacity=".055"/>
    ${motifMarkup(hero, p)}
    <ellipse cx="210" cy="452" rx="154" ry="27" fill="${shade(hero.dark, -6)}" opacity=".7"/>
    <ellipse cx="210" cy="449" rx="120" ry="19" fill="${hero.color}" opacity=".2" filter="url(#soft${p})"/>
    <rect width="420" height="480" fill="url(#vignette${p})"/>`;
}

function charWrap(scale, markup) {
  return `<g transform="translate(210 480) scale(${scale}) translate(-210 -480)">${markup}</g>`;
}

function limb(path, color, width = 28, highlight = true) {
  return `
    <path d="${path}" fill="none" stroke="${INK}" stroke-width="${width + 10}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>
    ${highlight ? `<path d="${path}" fill="none" stroke="${shade(color, 24)}" stroke-width="${Math.max(5, width * 0.24)}" stroke-linecap="round" stroke-linejoin="round" opacity=".42" transform="translate(-2 -2)"/>` : ''}`;
}

function shoe(x, y, width, height, color, accent, flip = 1) {
  return `
    <path d="M${x - width / 2} ${y} Q${x - width / 2 - 4 * flip} ${y + height * 0.7} ${x - width * 0.2} ${y + height} L${x + width * 0.5} ${y + height} Q${x + width * 0.58} ${y + height * 0.64} ${x + width * 0.28} ${y + height * 0.34} L${x + width * 0.14} ${y}Z"
      fill="${color}" ${OUTLINE} stroke-width="6"/>
    <path d="M${x - width * 0.42} ${y + height * 0.72} L${x + width * 0.36} ${y + height * 0.72}" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M${x - width * 0.3} ${y + height * 0.34} Q${x} ${y + height * 0.16} ${x + width * 0.18} ${y + height * 0.3}" fill="none" stroke="${shade(color, 34)}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
}

function starBadge(x, y, radius, fill, p) {
  return `<g filter="url(#shadow${p})">
    <path d="${starPath(x, y, radius, radius * 0.46, 5)}" fill="${fill}" ${OUTLINE} stroke-width="4"/>
    <path d="${starPath(x - 1, y - 2, radius * 0.55, radius * 0.24, 5)}" fill="${shade(fill, 42)}" opacity=".7"/>
  </g>`;
}

function eyeShape(x, y, rx, ry, hero, p, options = {}) {
  const irisScale = options.irisScale || 0.62;
  const pupilScale = options.pupilScale || 0.34;
  return `
    <g>
      <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="${x + 1}" cy="${y + 1}" rx="${rx * irisScale}" ry="${ry * irisScale}" fill="url(#eye${p})"/>
      <ellipse cx="${x + 1}" cy="${y + 1}" rx="${rx * pupilScale}" ry="${ry * pupilScale * 1.06}" fill="#1b1026"/>
      <circle cx="${x - rx * 0.24}" cy="${y - ry * 0.34}" r="${Math.max(2.5, rx * 0.22)}" fill="#ffffff"/>
      <circle cx="${x + rx * 0.3}" cy="${y + ry * 0.3}" r="${Math.max(1.4, rx * 0.1)}" fill="#ffffff" opacity=".85"/>
      ${options.lashes ? `<path d="M${x - rx - 4} ${y - ry * 0.7} Q${x - rx * 0.4} ${y - ry - 5} ${x + rx * 0.8} ${y - ry * 0.45}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${options.lid ? `<path d="M${x - rx} ${y - ry * 0.25} Q${x} ${y - ry * 0.52} ${x + rx} ${y - ry * 0.18}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".7"/>` : ''}
    </g>`;
}

function humanFace(hero, p, options = {}) {
  const cy = options.cy || 160;
  const rx = options.rx || 77;
  const ry = options.ry || 82;
  const eyeY = options.eyeY || cy + 6;
  const gap = options.eyeGap || 35;
  const eyeRx = options.eyeRx || 20;
  const eyeRy = options.eyeRy || 23;
  const browColor = options.browColor || shade(hero.hair, -24);
  const mouthColor = options.mouthColor || '#571f35';
  const expression = options.expression || 'smile';
  const freckles = options.freckles;
  const fangs = options.fangs;
  const mask = options.mask;
  const headTop = cy - ry;
  return `
    <path d="M183 ${cy + ry - 14} L179 272 Q210 288 242 272 L238 ${cy + ry - 16}" fill="url(#skin${p})" ${OUTLINE}/>
    <path d="M179 260 Q210 274 242 258 L241 270 Q210 285 180 268Z" fill="${shade(hero.skin, -26)}" opacity=".55"/>
    <ellipse cx="210" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#skin${p})" ${OUTLINE}/>
    <ellipse cx="${210 - rx + 2}" cy="${cy + 7}" rx="14" ry="21" fill="url(#skin${p})" ${OUTLINE} stroke-width="5"/>
    <ellipse cx="${210 + rx - 2}" cy="${cy + 7}" rx="14" ry="21" fill="url(#skin${p})" ${OUTLINE} stroke-width="5"/>
    <path d="M${210 - rx * 0.72} ${cy + ry * 0.22} Q210 ${cy + ry * 0.46} ${210 + rx * 0.72} ${cy + ry * 0.22} Q210 ${cy + ry + 10} ${210 - rx * 0.72} ${cy + ry * 0.22}Z" fill="${shade(hero.skin, -15)}" opacity=".13"/>
    <ellipse cx="${210 - rx * 0.66}" cy="${cy + ry * 0.4}" rx="13" ry="7" fill="${hero.accent || hero.color}" opacity=".18" filter="url(#soft${p})"/>
    <ellipse cx="${210 + rx * 0.66}" cy="${cy + ry * 0.4}" rx="13" ry="7" fill="${hero.accent || hero.color}" opacity=".18" filter="url(#soft${p})"/>
    ${freckles ? `<g fill="${shade(hero.skin, -30)}" opacity=".6"><circle cx="${210 - 42}" cy="${cy + 30}" r="1.6"/><circle cx="${210 - 31}" cy="${cy + 35}" r="1.3"/><circle cx="${210 - 49}" cy="${cy + 39}" r="1.2"/><circle cx="${210 + 42}" cy="${cy + 30}" r="1.6"/><circle cx="${210 + 31}" cy="${cy + 35}" r="1.3"/><circle cx="${210 + 49}" cy="${cy + 39}" r="1.2"/></g>` : ''}
    <path d="M${210 - gap - eyeRx - 6} ${eyeY - eyeRy - 10} Q${210 - gap} ${eyeY - eyeRy - 20} ${210 - gap + eyeRx + 4} ${eyeY - eyeRy - 9}" fill="none" stroke="${browColor}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${210 + gap - eyeRx - 4} ${eyeY - eyeRy - 9} Q${210 + gap} ${eyeY - eyeRy - 20} ${210 + gap + eyeRx + 6} ${eyeY - eyeRy - 10}" fill="none" stroke="${browColor}" stroke-width="8" stroke-linecap="round"/>
    ${eyeShape(210 - gap, eyeY, eyeRx, eyeRy, hero, p, { lashes: options.lashes !== false, lid: true, irisScale: options.irisScale })}
    ${eyeShape(210 + gap, eyeY, eyeRx, eyeRy, hero, p, { lashes: options.lashes !== false, lid: true, irisScale: options.irisScale })}
    <path d="M205 ${cy + 32} Q210 ${cy + 34} 214 ${cy + 30}" fill="none" stroke="${shade(hero.skin, -38)}" stroke-width="4" stroke-linecap="round" opacity=".65"/>
    ${
      expression === 'grin'
        ? `<path d="M185 ${cy + 48} Q210 ${cy + 82} 238 ${cy + 46} Q210 ${cy + 63} 185 ${cy + 48}Z" fill="${mouthColor}" ${OUTLINE} stroke-width="5"/>
           <path d="M192 ${cy + 51} Q210 ${cy + 64} 231 ${cy + 50} Q210 ${cy + 58} 192 ${cy + 51}Z" fill="#fff9eb"/>
           <path d="M203 ${cy + 69} Q210 ${cy + 76} 221 ${cy + 65} Q210 ${cy + 73} 203 ${cy + 69}Z" fill="#ff7c9f" opacity=".8"/>`
        : expression === 'smirk'
          ? `<path d="M186 ${cy + 50} Q208 ${cy + 58} 236 ${cy + 40} Q220 ${cy + 66} 190 ${cy + 58}Z" fill="${mouthColor}" ${OUTLINE} stroke-width="4"/>
             <path d="M194 ${cy + 52} Q210 ${cy + 57} 228 ${cy + 47} Q212 ${cy + 59} 194 ${cy + 52}Z" fill="#fff9eb" opacity=".9"/>`
          : expression === 'soft'
            ? `<path d="M193 ${cy + 52} Q210 ${cy + 62} 229 ${cy + 50}" fill="none" stroke="${mouthColor}" stroke-width="5" stroke-linecap="round"/>`
            : `<path d="M187 ${cy + 47} Q210 ${cy + 74} 235 ${cy + 45} Q210 ${cy + 61} 187 ${cy + 47}Z" fill="${mouthColor}" ${OUTLINE} stroke-width="5"/>
               <path d="M194 ${cy + 50} Q210 ${cy + 61} 229 ${cy + 49} Q210 ${cy + 56} 194 ${cy + 50}Z" fill="#fff9eb"/>
               ${fangs ? `<path d="M198 ${cy + 55} L201 ${cy + 63} L205 ${cy + 55}Z" fill="#fff"/><path d="M218 ${cy + 55} L221 ${cy + 63} L225 ${cy + 55}Z" fill="#fff"/>` : ''}`
    }
    ${mask || ''}
    <path d="M${210 - rx + 8} ${headTop + 28} Q${210 - rx + 16} ${headTop + 72} ${210 - rx + 8} ${headTop + 112}" fill="none" stroke="${shade(hero.skin, 30)}" stroke-width="4" stroke-linecap="round" opacity=".35"/>
    <path d="M${210 + rx - 8} ${headTop + 30} Q${210 + rx - 2} ${headTop + 78} ${210 + rx - 10} ${headTop + 116}" fill="none" stroke="${shade(hero.skin, -28)}" stroke-width="5" stroke-linecap="round" opacity=".25"/>`;
}

function humanLegs(hero, p, options = {}) {
  const pants = options.pants || shade(hero.dark, 22);
  const pants2 = options.pants2 || shade(hero.color, -18);
  const shoeColor = options.shoe || shade(hero.dark, 12);
  const shoeAccent = options.shoeAccent || hero.color2;
  return `
    ${limb('M182 360 L176 428', pants, 34)}
    ${limb('M238 360 L244 428', pants2, 34)}
    <path d="M166 394 Q180 386 196 396" fill="none" stroke="${shade(pants, 24)}" stroke-width="6" opacity=".5"/>
    <path d="M224 396 Q240 386 254 394" fill="none" stroke="${shade(pants2, 24)}" stroke-width="6" opacity=".5"/>
    ${shoe(174, 428, 58, 30, shoeColor, shoeAccent, 1)}
    ${shoe(246, 428, 58, 30, shoeColor, shoeAccent, -1)}`;
}

function humanTorso(hero, p, options = {}) {
  const top = options.top || `url(#cloth${p})`;
  const bottom = options.bottom || shade(hero.color, -28);
  const trim = options.trim || hero.color2;
  const style = options.style || 'hoodie';
  const belt = options.belt || shade(hero.dark, 18);
  return `
    <path d="M151 268 Q210 248 269 268 L289 366 Q210 392 131 366Z" fill="${top}" ${OUTLINE}/>
    <path d="M151 268 Q210 248 269 268 L274 304 Q210 292 146 304Z" fill="${shade(hero.color, 26)}" opacity=".18"/>
    <path d="M246 264 Q272 276 284 310 L288 366 Q254 380 226 382 L246 264Z" fill="${shade(hero.color, -26)}" opacity=".22"/>
    <path d="M137 360 Q210 384 283 360" fill="none" stroke="${shade(hero.color, -36)}" stroke-width="9" opacity=".55"/>
    ${style === 'hoodie' ? `
      <path d="M164 268 Q210 238 256 268 Q246 290 210 294 Q174 290 164 268Z" fill="${shade(hero.color, -22)}" ${OUTLINE} stroke-width="5"/>
      <path d="M176 272 Q210 258 244 272" fill="none" stroke="${trim}" stroke-width="5" opacity=".8"/>
      <path d="M178 334 Q210 346 242 334 L238 362 Q210 372 182 362Z" fill="${shade(hero.color, -24)}" opacity=".7"/>
      <path d="M194 290 L192 322 M226 290 L228 322" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="192" cy="326" r="4" fill="${trim}"/><circle cx="228" cy="326" r="4" fill="${trim}"/>
    ` : ''}
    ${style === 'ninja' ? `
      <path d="M158 300 L262 300 L256 322 L164 322Z" fill="${shade(hero.dark, 20)}" ${OUTLINE} stroke-width="4"/>
      <path d="M168 312 L252 312" stroke="${trim}" stroke-width="3" opacity=".65"/>
      <path d="M184 270 L210 300 L236 270" fill="none" stroke="${trim}" stroke-width="5"/>
      <path d="M150 340 L270 340" stroke="${belt}" stroke-width="14" stroke-linecap="round"/>
      <rect x="196" y="334" width="28" height="15" rx="4" fill="${trim}" ${OUTLINE} stroke-width="3"/>
    ` : ''}
    ${style === 'overalls' ? `
      <path d="M174 266 L166 296 L152 292 L158 258Z" fill="${shade(hero.color, 24)}" ${OUTLINE} stroke-width="4"/>
      <path d="M246 266 L254 296 L268 292 L262 258Z" fill="${shade(hero.color, 24)}" ${OUTLINE} stroke-width="4"/>
      <path d="M170 318 L250 318 L244 370 Q210 382 176 370Z" fill="${shade(hero.color, 18)}" ${OUTLINE} stroke-width="5"/>
      <rect x="192" y="316" width="36" height="28" rx="7" fill="${shade(hero.color, -12)}" stroke="${INK}" stroke-width="3"/>
      <circle cx="200" cy="330" r="5" fill="${trim}"/><circle cx="220" cy="330" r="5" fill="${trim}"/>
      <g fill="${hero.color2}" opacity=".9">
        <circle cx="158" cy="332" r="7"/><circle cx="274" cy="350" r="5"/>
        <circle cx="164" cy="354" r="3"/><circle cx="263" cy="326" r="3"/>
      </g>
    ` : ''}
    ${style === 'cyber' ? `
      <path d="M167 270 L210 286 L253 270 L264 310 L244 322 L236 292 L184 292 L176 322 L156 310Z" fill="${shade(hero.dark, 26)}" ${OUTLINE} stroke-width="4"/>
      <path d="M176 312 L190 354 M244 312 L230 354" stroke="${trim}" stroke-width="4" opacity=".75"/>
      <path d="M208 286 L208 350" stroke="${trim}" stroke-width="3" stroke-dasharray="5 6" opacity=".6"/>
      <rect x="194" y="336" width="32" height="18" rx="5" fill="${shade(hero.dark, 18)}" stroke="${INK}" stroke-width="3"/>
      <circle cx="210" cy="345" r="5" fill="${trim}" filter="url(#glow${p})"/>
    ` : ''}
    ${style === 'shark' ? `
      <path d="M150 272 Q210 246 270 272 L276 330 Q210 350 144 330Z" fill="${shade(hero.color, 12)}" ${OUTLINE} stroke-width="4"/>
      <path d="M166 316 Q210 334 254 316 Q244 354 210 358 Q176 354 166 316Z" fill="#f3fbff" ${OUTLINE} stroke-width="4"/>
      <path d="M174 318 L182 330 L190 316 L198 331 L206 316 L214 331 L222 316 L230 331 L238 316 L246 330" fill="none" stroke="#d8f2ff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M208 286 L208 318" stroke="${shade(hero.color, -36)}" stroke-width="4" opacity=".6"/>
    ` : ''}
    ${style !== 'cyber' ? `<path d="M210 316 Q218 322 226 316" fill="none" stroke="${trim}" stroke-width="4" opacity=".8"/>` : ''}`;
}

function humanArm(hero, p, side, options = {}) {
  const sleeve = options.sleeve || hero.color;
  const glove = options.glove || shade(hero.dark, 18);
  const x1 = 210 + side * 56;
  const y1 = 286;
  const x2 = 210 + side * (options.bend || 78);
  const y2 = options.high ? 300 : 342;
  const x3 = 210 + side * (options.reach || 88);
  const y3 = options.handY || 370;
  return `
    ${limb(`M${x1} ${y1} Q${x2} ${y2} ${x3} ${y3}`, sleeve, 27)}
    <path d="M${x3 - side * 5} ${y3 - 4} l${side * 18} ${side * 5}" stroke="${shade(sleeve, -26)}" stroke-width="7" stroke-linecap="round" opacity=".55"/>
    <circle cx="${x3}" cy="${y3}" r="17" fill="${glove}" ${OUTLINE} stroke-width="5"/>
    <circle cx="${x3 - 4}" cy="${y3 - 4}" r="6" fill="${shade(glove, 34)}" opacity=".5"/>`;
}

function chibiHands(hero, p, options = {}) {
  return `
    <circle cx="${options.leftX || 122}" cy="${options.leftY || 362}" r="18" fill="${options.glove || shade(hero.dark, 18)}" ${OUTLINE} stroke-width="5"/>
    <circle cx="${options.rightX || 298}" cy="${options.rightY || 362}" r="18" fill="${options.glove || shade(hero.dark, 18)}" ${OUTLINE} stroke-width="5"/>`;
}

/* ------------------------------------------------------------------ */
/* HERO PORTRAITS                                                     */
/* ------------------------------------------------------------------ */

function novaPortrait(p) {
  const hero = HEROES.nova;
  return `
    ${charWrap(1, `
      <g>
        <path d="M128 182 C110 100 164 44 224 46 C286 48 318 104 304 184 L292 236 C276 264 254 250 244 220 L232 192 L218 238 L202 196 L186 244 C166 252 148 234 142 210Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M292 112 C334 78 366 112 348 158 C334 194 316 214 300 246 C294 210 302 176 288 150Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M306 126 C330 112 342 130 336 158 C330 186 312 200 304 222" fill="none" stroke="${shade(hero.hair, 36)}" stroke-width="7" stroke-linecap="round" opacity=".75"/>
        <path d="M142 198 C128 174 132 146 150 126" fill="none" stroke="${shade(hero.hair, 28)}" stroke-width="7" stroke-linecap="round" opacity=".65"/>

        ${humanLegs(hero, p, {
          pants: '#14284a',
          pants2: '#1a3560',
          shoe: '#f3feff',
          shoeAccent: hero.color,
        })}

        <path d="M153 270 Q210 246 267 270 L284 362 Q210 388 136 362Z" fill="#f4fdff" ${OUTLINE}/>
        <path d="M238 260 Q268 276 280 310 L284 362 Q254 376 226 382 L238 260Z" fill="#c9f7ff" opacity=".72"/>
        <path d="M151 270 L178 314 L148 334 L136 300Z" fill="${hero.color}" ${OUTLINE} stroke-width="5"/>
        <path d="M269 270 L242 314 L272 334 L284 300Z" fill="${shade(hero.color, -8)}" ${OUTLINE} stroke-width="5"/>
        <path d="M164 270 Q210 244 256 270 Q246 294 210 300 Q174 294 164 270Z" fill="${shade(hero.color, -28)}" ${OUTLINE} stroke-width="5"/>
        <path d="M176 274 Q210 260 244 274" fill="none" stroke="${hero.color2}" stroke-width="5" opacity=".8"/>
        <path d="M177 338 Q210 350 243 338 L240 364 Q210 374 180 364Z" fill="${shade(hero.color, -18)}" opacity=".72"/>
        <path d="M144 358 Q210 384 276 358" fill="none" stroke="${shade(hero.color, -38)}" stroke-width="9" opacity=".72"/>
        <path d="M206 302 L210 316 L224 316 L213 325 L218 340 L206 331 L194 340 L199 325 L188 316 L202 316Z" fill="url(#gold${p})" ${OUTLINE} stroke-width="3"/>
        <path d="M150 304 L172 318 M270 304 L248 318" stroke="${hero.color2}" stroke-width="4" stroke-linecap="round" opacity=".65"/>

        ${limb('M156 290 Q116 318 130 354', '#effcff', 27)}
        ${limb('M264 290 Q302 314 306 342', '#effcff', 27)}
        <circle cx="130" cy="354" r="18" fill="#172744" ${OUTLINE} stroke-width="5"/>
        <circle cx="306" cy="342" r="18" fill="#172744" ${OUTLINE} stroke-width="5"/>
        <path d="M122 350 Q130 342 138 350" fill="none" stroke="${hero.color}" stroke-width="4" stroke-linecap="round"/>

        ${humanFace(hero, p, {
          cy: 162,
          rx: 77,
          ry: 82,
          eyeY: 170,
          eyeGap: 35,
          eyeRx: 21,
          eyeRy: 24,
          expression: 'grin',
          lashes: true,
        })}
        <path d="M142 168 C146 88 184 55 226 58 C270 60 300 92 304 160 C282 144 264 138 248 144 C234 120 210 112 190 124 C170 136 156 154 150 180Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M156 156 C180 128 208 122 230 136 C248 148 264 154 284 150" fill="none" stroke="${shade(hero.hair, 34)}" stroke-width="8" stroke-linecap="round" opacity=".72"/>
        <path d="M182 104 C198 118 206 138 206 156" fill="none" stroke="${shade(hero.hair, 24)}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
        <path d="M270 142 L292 116 L302 142 L288 164Z" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
        <path d="M282 132 L286 140 L294 140 L288 146 L290 154 L282 149 L274 154 L276 146 L270 140 L278 140Z" fill="#fff6bd"/>
        <circle cx="150" cy="154" r="6" fill="${hero.color2}" ${OUTLINE} stroke-width="3"/>
        <path d="M214 252 Q232 262 248 250" fill="none" stroke="${shade(hero.skin, -30)}" stroke-width="4" stroke-linecap="round" opacity=".5"/>

        <g transform="translate(318 344) rotate(-14)" filter="url(#shadow${p})">
          <rect x="-18" y="-18" width="92" height="38" rx="14" fill="url(#metal${p})" ${OUTLINE} stroke-width="6"/>
          <rect x="24" y="-12" width="44" height="13" rx="6" fill="${hero.color}" opacity=".9"/>
          <rect x="-10" y="-7" width="26" height="16" rx="7" fill="#1a2946" stroke="${INK}" stroke-width="3"/>
          <circle cx="28" cy="1" r="11" fill="${hero.color2}" filter="url(#glow${p})"/>
          <path d="M28 -5 L32 0 L28 5 L24 0Z" fill="#fffbe0"/>
          <rect x="62" y="-20" width="14" height="42" rx="5" fill="#2c3b58" ${OUTLINE} stroke-width="4"/>
          <path d="M-12 17 L64 17" stroke="${hero.color2}" stroke-width="4" stroke-linecap="round" opacity=".6"/>
        </g>
        <g opacity=".9" fill="${hero.color2}" filter="url(#glow${p})">
          ${sparkle(80, 118, 9, '#ffffff', 0.9)}
          ${sparkle(352, 246, 7, hero.color2, 0.8)}
          ${sparkle(98, 306, 5, '#ffffff', 0.6)}
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function bubblixPortrait(p) {
  const hero = HEROES.bubblix;
  return `
    ${charWrap(0.92, `
      <g>
        <g opacity=".5" fill="${hero.color2}">
          <circle cx="84" cy="144" r="19"/>
          <circle cx="342" cy="118" r="12"/>
          <circle cx="362" cy="296" r="25"/>
          <circle cx="58" cy="332" r="14"/>
        </g>
        <g fill="none" stroke="${hero.color2}" stroke-width="3" opacity=".48">
          <circle cx="84" cy="144" r="19"/><circle cx="342" cy="118" r="12"/>
          <circle cx="362" cy="296" r="25"/><circle cx="58" cy="332" r="14"/>
        </g>

        <ellipse cx="210" cy="424" rx="78" ry="18" fill="#04172d" opacity=".6"/>
        ${limb('M184 372 L180 414', '#24456f', 28)}
        ${limb('M236 372 L240 414', '#24456f', 28)}
        ${shoe(178, 412, 54, 27, '#e8fbff', hero.color2, 1)}
        ${shoe(242, 412, 54, 27, '#e8fbff', hero.color2, -1)}

        <circle cx="210" cy="326" r="70" fill="url(#cloth${p})" ${OUTLINE}/>
        <ellipse cx="210" cy="328" rx="52" ry="47" fill="#ecfdff" ${OUTLINE} stroke-width="5"/>
        <ellipse cx="210" cy="330" rx="38" ry="34" fill="#8ee8ff" opacity=".18"/>
        <path d="M210 348 L210 372" stroke="${shade(hero.color, -18)}" stroke-width="5" opacity=".5"/>
        <path d="M186 318 L198 330 L186 342" fill="none" stroke="${hero.color}" stroke-width="5" stroke-linecap="round"/>
        <path d="M234 318 L222 330 L234 342" fill="none" stroke="${hero.color}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="168" cy="356" r="8" fill="${hero.color2}" filter="url(#glow${p})"/>
        <circle cx="252" cy="356" r="8" fill="${hero.color2}" filter="url(#glow${p})"/>
        <path d="M164 300 Q148 274 150 246" stroke="${shade(hero.color, -8)}" stroke-width="19" stroke-linecap="round" ${OUTLINE} stroke-width="6"/>
        <path d="M164 300 Q148 274 150 246" stroke="${shade(hero.color, 14)}" stroke-width="13" stroke-linecap="round"/>
        <circle cx="150" cy="242" r="10" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
        <path d="M256 298 Q278 278 282 250" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
        <path d="M256 298 Q278 278 282 250" fill="none" stroke="${shade(hero.color, 10)}" stroke-width="20" stroke-linecap="round"/>
        <circle cx="283" cy="246" r="15" fill="#eaffff" ${OUTLINE} stroke-width="5"/>
        <path d="M276 246 Q283 238 290 246" fill="none" stroke="${hero.color}" stroke-width="4" stroke-linecap="round"/>

        <circle cx="210" cy="166" r="86" fill="#d8f7ff" ${OUTLINE}/>
        <circle cx="210" cy="166" r="86" fill="url(#softGlow${p})" opacity=".22"/>
        <path d="M138 196 Q210 260 282 196" fill="none" stroke="${shade(hero.color, -16)}" stroke-width="6" opacity=".4"/>
        <ellipse cx="210" cy="170" rx="62" ry="58" fill="#88e9ff" opacity=".28" ${OUTLINE} stroke-width="5"/>
        <ellipse cx="210" cy="174" rx="46" ry="42" fill="${hero.skin2}" ${OUTLINE} stroke-width="5"/>
        ${eyeShape(190, 166, 15, 18, hero, p, { lashes: false, irisScale: 0.6 })}
        ${eyeShape(230, 166, 15, 18, hero, p, { lashes: false, irisScale: 0.6 })}
        <path d="M190 194 Q210 208 230 194" fill="none" stroke="#1a4562" stroke-width="5" stroke-linecap="round"/>
        <circle cx="210" cy="192" r="3" fill="#1a4562" opacity=".55"/>
        <path d="M158 112 Q168 82 196 76" fill="none" stroke="${shade(hero.color, -18)}" stroke-width="8" stroke-linecap="round"/>
        <path d="M196 76 Q210 72 226 78" fill="none" stroke="${shade(hero.color, -18)}" stroke-width="8" stroke-linecap="round"/>
        <circle cx="226" cy="76" r="15" fill="${hero.color2}" fill-opacity=".3" stroke="${hero.color2}" stroke-width="4"/>
        <circle cx="220" cy="70" r="4" fill="#fff" opacity=".85"/>
        <path d="M128 164 Q112 166 112 184 Q112 202 130 202" fill="none" stroke="${shade(hero.color, -18)}" stroke-width="14" stroke-linecap="round"/>
        <path d="M292 164 Q308 166 308 184 Q308 202 290 202" fill="none" stroke="${shade(hero.color, -18)}" stroke-width="14" stroke-linecap="round"/>
        <circle cx="210" cy="88" r="5" fill="${hero.color2}" filter="url(#glow${p})"/>

        <g transform="translate(322 338) rotate(-12)" filter="url(#shadow${p})">
          <rect x="-12" y="-20" width="78" height="38" rx="16" fill="url(#metal${p})" ${OUTLINE} stroke-width="6"/>
          <rect x="20" y="-12" width="34" height="11" rx="5" fill="${hero.color}"/>
          <circle cx="58" cy="-1" r="16" fill="none" stroke="${hero.color2}" stroke-width="6" opacity=".85"/>
          <circle cx="58" cy="-1" r="7" fill="${hero.color2}" filter="url(#glow${p})"/>
          <rect x="-4" y="10" width="26" height="18" rx="7" fill="#24456f" stroke="${INK}" stroke-width="4"/>
        </g>
        <g fill="none" stroke="${hero.color2}" stroke-width="3" opacity=".6" filter="url(#glow${p})">
          <circle cx="366" cy="314" r="9"/><circle cx="386" cy="288" r="5"/><circle cx="350" cy="272" r="4"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function grizzPortrait(p) {
  const hero = HEROES.grizz;
  return `
    ${charWrap(1.03, `
      <g>
        <path d="M132 282 C100 302 90 342 112 372" fill="none" stroke="${INK}" stroke-width="48" stroke-linecap="round"/>
        <path d="M132 282 C100 302 90 342 112 372" fill="none" stroke="url(#hair${p})" stroke-width="35" stroke-linecap="round"/>
        <path d="M286 282 C318 298 330 334 314 366" fill="none" stroke="${INK}" stroke-width="48" stroke-linecap="round"/>
        <path d="M286 282 C318 298 330 334 314 366" fill="none" stroke="${shade(hero.hair, 10)}" stroke-width="35" stroke-linecap="round"/>

        ${humanLegs(hero, p, { pants: '#4b2b16', pants2: '#38200f', shoe: '#2b1b12', shoeAccent: hero.color })}

        <path d="M144 264 Q210 236 276 264 L292 370 Q210 400 128 370Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M160 268 L146 336 L174 352 L186 286Z" fill="#5a3a22" ${OUTLINE} stroke-width="5"/>
        <path d="M260 268 L274 336 L246 352 L234 286Z" fill="#4b2d18" ${OUTLINE} stroke-width="5"/>
        <path d="M184 288 Q210 278 236 288 L232 340 Q210 350 188 340Z" fill="${shade(hero.skin, 28)}" ${OUTLINE} stroke-width="4"/>
        <path d="M168 330 Q210 350 252 330 L248 358 Q210 374 172 358Z" fill="#33200f" ${OUTLINE} stroke-width="4"/>
        <rect x="192" y="338" width="36" height="24" rx="6" fill="url(#gold${p})" ${OUTLINE} stroke-width="4"/>
        <path d="M210 342 L214 352 L224 352 L216 359 L219 369 L210 363 L201 369 L204 359 L196 352 L206 352Z" fill="#6b3f0a" opacity=".72"/>
        <path d="M150 306 L274 306" stroke="#2b1b12" stroke-width="9" opacity=".6"/>
        <g fill="${hero.skin2}" opacity=".9">
          <path d="M158 278 l8 14 -10 11 -8 -14Z"/><path d="M262 278 l-8 14 10 11 8 -14Z"/>
        </g>

        <path d="M132 92 C132 58 158 42 184 54 C196 32 230 32 244 54 C270 40 296 60 292 92 C308 112 292 144 266 144 L158 144 C132 144 116 112 132 92Z" fill="url(#hair${p})" ${OUTLINE}/>
        <ellipse cx="210" cy="162" rx="84" ry="76" fill="url(#hair${p})" ${OUTLINE}/>
        <ellipse cx="210" cy="186" rx="49" ry="39" fill="${hero.skin2}" ${OUTLINE} stroke-width="6"/>
        <ellipse cx="210" cy="174" rx="20" ry="14" fill="#24120a" ${OUTLINE} stroke-width="4"/>
        <path d="M210 188 L210 198" stroke="#3d2111" stroke-width="4" stroke-linecap="round"/>
        <path d="M190 200 Q210 224 230 200 Q210 214 190 200Z" fill="#3d1518" ${OUTLINE} stroke-width="4"/>
        <path d="M194 202 Q210 216 226 202 Q210 210 194 202Z" fill="#fff6e8"/>
        <path d="M196 208 L200 219 L204 207Z" fill="#fff"/><path d="M216 207 L220 219 L224 208Z" fill="#fff"/>
        <ellipse cx="174" cy="148" rx="14" ry="16" fill="#fff8e8" ${OUTLINE} stroke-width="4"/>
        <ellipse cx="246" cy="148" rx="14" ry="16" fill="#fff8e8" ${OUTLINE} stroke-width="4"/>
        <circle cx="176" cy="150" r="6" fill="#24120a"/><circle cx="248" cy="150" r="6" fill="#24120a"/>
        <circle cx="174" cy="147" r="2.2" fill="#fff"/><circle cx="246" cy="147" r="2.2" fill="#fff"/>
        <path d="M152 128 Q174 116 194 130" fill="none" stroke="#3c210f" stroke-width="8" stroke-linecap="round"/>
        <path d="M226 130 Q248 116 270 128" fill="none" stroke="#3c210f" stroke-width="8" stroke-linecap="round"/>
        <path d="M146 112 C158 90 180 84 196 94" fill="none" stroke="${shade(hero.hair, 22)}" stroke-width="6" opacity=".55"/>
        <path d="M272 104 C286 94 298 96 306 108" fill="none" stroke="${shade(hero.hair, 22)}" stroke-width="6" opacity=".55"/>
        <circle cx="210" cy="218" r="5" fill="#3c210f" opacity=".5"/>

        <g transform="translate(312 294) rotate(20)" filter="url(#shadow${p})">
          <rect x="-5" y="-8" width="18" height="130" rx="8" fill="#6d3f1c" ${OUTLINE} stroke-width="5"/>
          <rect x="3" y="-8" width="5" height="128" rx="2" fill="#b8783e" opacity=".65"/>
          <path d="M-38 -28 L34 -38 L50 -8 L42 28 L-30 38 L-46 8Z" fill="url(#metal${p})" ${OUTLINE} stroke-width="6"/>
          <path d="M-24 -20 L28 -28 L38 -6 L30 20 L-20 28Z" fill="#64748e" opacity=".55"/>
          <path d="M-18 -34 L-10 -54 L8 -50 L4 -32Z" fill="#2c3648" ${OUTLINE} stroke-width="4"/>
          <path d="M20 -40 L34 -56 L48 -44 L38 -28Z" fill="#2c3648" ${OUTLINE} stroke-width="4"/>
          <path d="M-30 10 L34 2" stroke="${hero.color}" stroke-width="5" opacity=".7"/>
        </g>
        <g opacity=".6" fill="${hero.color2}">
          <path d="M104 132 C134 108 166 120 174 150 C146 166 112 156 104 132Z"/>
          <path d="M320 330 C346 310 370 320 374 344 C356 360 326 352 320 330Z"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function vexPortrait(p) {
  const hero = HEROES.vex;
  return `
    ${charWrap(1, `
      <g>
        <path d="M124 178 C112 100 164 48 224 48 C282 48 314 92 306 168 L294 238 C282 268 254 258 242 226 L230 196 L214 238 L198 196 L184 242 C164 250 146 232 140 210Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M286 112 C330 76 360 112 346 156 C334 194 316 210 302 244 C298 208 306 176 282 150Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M304 134 C324 120 334 138 328 164 C322 190 308 204 300 226" fill="none" stroke="${shade(hero.hair, -18)}" stroke-width="6" stroke-linecap="round" opacity=".55"/>

        ${humanLegs(hero, p, { pants: '#1d1530', pants2: '#271b40', shoe: '#130e20', shoeAccent: hero.color2 })}

        <path d="M153 270 Q210 246 267 270 L282 362 Q210 388 138 362Z" fill="url(#dark${p})" ${OUTLINE}/>
        <path d="M158 286 L262 286 L256 312 L164 312Z" fill="${shade(hero.dark, 22)}" ${OUTLINE} stroke-width="4"/>
        <path d="M168 304 L252 304" stroke="${hero.color2}" stroke-width="3" opacity=".55"/>
        <path d="M151 342 L270 342" stroke="${shade(hero.color, -30)}" stroke-width="13" stroke-linecap="round"/>
        <rect x="196" y="334" width="28" height="16" rx="4" fill="${hero.color2}" ${OUTLINE} stroke-width="3"/>
        <path d="M170 352 L204 364 M250 352 L216 364" stroke="${hero.color}" stroke-width="4" opacity=".65"/>
        <path d="M156 272 Q142 250 148 224" fill="none" stroke="${INK}" stroke-width="32" stroke-linecap="round"/>
        <path d="M156 272 Q142 250 148 224" fill="none" stroke="${hero.color}" stroke-width="22" stroke-linecap="round"/>
        <path d="M148 224 Q142 202 158 186" fill="none" stroke="${hero.color2}" stroke-width="7" stroke-linecap="round" opacity=".7"/>
        <path d="M264 272 Q280 250 276 224" fill="none" stroke="${INK}" stroke-width="32" stroke-linecap="round"/>
        <path d="M264 272 Q280 250 276 224" fill="none" stroke="${shade(hero.color, -12)}" stroke-width="22" stroke-linecap="round"/>
        <path d="M276 224 Q282 202 266 186" fill="none" stroke="${hero.color2}" stroke-width="6" stroke-linecap="round" opacity=".65"/>

        ${humanFace(hero, p, {
          cy: 162,
          rx: 76,
          ry: 82,
          eyeY: 164,
          eyeGap: 34,
          eyeRx: 20,
          eyeRy: 19,
          expression: 'smirk',
          lashes: true,
          irisScale: 0.53,
          browColor: '#231735',
          mask: `<path d="M142 188 Q210 178 278 188 L270 222 Q236 254 210 256 Q184 254 150 222Z" fill="url(#dark${p})" ${OUTLINE} stroke-width="6"/>
            <path d="M161 204 Q210 196 259 204" fill="none" stroke="${hero.color}" stroke-width="4" opacity=".7"/>
            <path d="M194 210 L210 226 L226 210" fill="none" stroke="${hero.color2}" stroke-width="4"/>
            <path d="M154 236 Q210 270 266 236" fill="none" stroke="${hero.color2}" stroke-width="4" opacity=".5"/>`,
        })}
        <path d="M142 158 C146 88 184 56 226 58 C270 60 300 92 304 158 C282 142 262 136 246 144 C232 120 208 114 190 126 C170 140 156 156 150 178Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M146 154 Q174 122 208 132 Q238 140 262 134" fill="none" stroke="${shade(hero.hair, -18)}" stroke-width="7" opacity=".55"/>
        <path d="M146 162 L304 150 L306 170 L148 182Z" fill="${hero.color}" ${OUTLINE} stroke-width="4"/>
        <path d="M164 164 L284 154" stroke="${hero.color2}" stroke-width="3" opacity=".7"/>
        <path d="M252 168 L274 152 L282 174 L260 188Z" fill="${hero.color2}" opacity=".75"/>
        <circle cx="286" cy="160" r="6" fill="${hero.color2}" filter="url(#glow${p})"/>

        <g transform="translate(126 344) rotate(24)" filter="url(#shadow${p})">
          <path d="M0 0 L20 -8 L68 -54 L74 -42 L30 8 L8 18Z" fill="#e8dcff" ${OUTLINE} stroke-width="4"/>
          <path d="M64 -50 L74 -42 L70 -30 L60 -36Z" fill="${hero.color2}"/>
          <rect x="-12" y="-6" width="24" height="12" rx="4" fill="${hero.color}" ${OUTLINE} stroke-width="3"/>
        </g>
        <g transform="translate(296 340) rotate(-28)" filter="url(#shadow${p})">
          <path d="M0 0 L-20 -8 L-68 -54 L-74 -42 L-30 8 L-8 18Z" fill="#e8dcff" ${OUTLINE} stroke-width="4"/>
          <path d="M-64 -50 L-74 -42 L-70 -30 L-60 -36Z" fill="${hero.color2}"/>
          <rect x="-12" y="-6" width="24" height="12" rx="4" fill="${hero.color}" ${OUTLINE} stroke-width="3"/>
        </g>
        <g fill="${hero.color}" opacity=".35" filter="url(#glow${p})">
          <ellipse cx="92" cy="372" rx="24" ry="11" transform="rotate(-18 92 372)"/>
          <ellipse cx="326" cy="376" rx="20" ry="9" transform="rotate(18 326 376)"/>
        </g>
        ${sparkle(344, 204, 8, hero.color2, 0.75)}
        ${sparkle(88, 236, 5, '#ffffff', 0.55)}
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function pipettePortrait(p) {
  const hero = HEROES.pipette;
  return `
    ${charWrap(1, `
      <g>
        <path d="M126 176 C112 100 166 50 226 50 C286 50 316 96 304 174 L294 232 C280 260 254 248 242 220 L228 192 L214 236 L200 194 L186 238 C168 246 150 232 144 210Z" fill="url(#hair${p})" ${OUTLINE}/>
        <circle cx="140" cy="120" r="34" fill="url(#hair${p})" ${OUTLINE}/>
        <circle cx="286" cy="116" r="34" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M114 108 Q140 88 166 108" fill="none" stroke="${shade(hero.hair, 34)}" stroke-width="6" opacity=".65"/>
        <path d="M262 104 Q288 84 314 104" fill="none" stroke="${shade(hero.hair, 34)}" stroke-width="6" opacity=".65"/>

        <path d="M286 272 Q318 286 320 322" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/>
        <path d="M286 272 Q318 286 320 322" fill="none" stroke="${hero.color}" stroke-width="29" stroke-linecap="round"/>
        <rect x="304" y="244" width="26" height="58" rx="10" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
        <path d="M310 252 L324 252" stroke="#fff" stroke-width="4" opacity=".6"/>

        ${humanLegs(hero, p, { pants: '#f2f7ff', pants2: '#dbeaff', shoe: '#ff6fbf', shoeAccent: hero.color2 })}

        <path d="M153 270 Q210 248 267 270 L282 362 Q210 388 136 362Z" fill="#f7fbff" ${OUTLINE}/>
        <path d="M238 262 Q270 278 280 312 L282 362 Q252 376 226 382 L238 262Z" fill="#d7eaff" opacity=".7"/>
        <path d="M158 274 L168 300 L146 308 L140 284Z" fill="${hero.color}" ${OUTLINE} stroke-width="4"/>
        <path d="M262 274 L252 300 L274 308 L280 284Z" fill="${shade(hero.color, -10)}" ${OUTLINE} stroke-width="4"/>
        <path d="M172 318 L248 318 L242 368 Q210 380 178 368Z" fill="#e8f2ff" ${OUTLINE} stroke-width="5"/>
        <rect x="192" y="312" width="36" height="26" rx="7" fill="#c9e1ff" stroke="${INK}" stroke-width="3"/>
        <circle cx="200" cy="325" r="5" fill="${hero.color}"/><circle cx="220" cy="325" r="5" fill="${hero.color2}"/>
        <path d="M174 266 L166 294 M246 266 L254 294" stroke="#f7fbff" stroke-width="13" stroke-linecap="round"/>
        <path d="M174 266 L166 294 M246 266 L254 294" stroke="${shade(hero.color, -20)}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
        <g fill="${hero.color}">
          <circle cx="158" cy="334" r="8"/><circle cx="272" cy="348" r="6"/>
        </g>
        <g fill="${hero.color2}">
          <circle cx="166" cy="354" r="4"/><circle cx="258" cy="326" r="4"/><circle cx="280" cy="360" r="3"/>
        </g>
        <path d="M188 346 Q210 356 232 346" fill="none" stroke="${hero.color}" stroke-width="5" opacity=".55"/>

        ${limb('M156 290 Q118 316 132 350', hero.color, 27)}
        ${limb('M262 290 Q300 310 306 340', hero.color, 27)}
        <circle cx="132" cy="350" r="18" fill="#fff4fb" ${OUTLINE} stroke-width="5"/>
        <circle cx="306" cy="340" r="18" fill="#fff4fb" ${OUTLINE} stroke-width="5"/>
        <path d="M124 346 Q132 338 140 346" fill="none" stroke="${hero.color2}" stroke-width="4" stroke-linecap="round"/>

        ${humanFace(hero, p, {
          cy: 162,
          rx: 76,
          ry: 82,
          eyeY: 168,
          eyeGap: 34,
          eyeRx: 21,
          eyeRy: 24,
          expression: 'grin',
          lashes: true,
          freckles: true,
        })}
        <path d="M142 166 C148 92 184 58 226 60 C270 62 300 96 304 162 C280 146 262 140 246 146 C234 122 210 114 190 126 C170 138 156 158 150 180Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M154 154 Q182 124 216 134 Q246 142 272 134" fill="none" stroke="${shade(hero.hair, 34)}" stroke-width="7" opacity=".65"/>
        <path d="M180 102 C196 116 204 136 204 156" fill="none" stroke="${shade(hero.hair, 24)}" stroke-width="5" opacity=".55"/>
        <path d="M148 94 Q210 46 272 94 Q244 110 210 102 Q176 110 148 94Z" fill="${hero.color2}" ${OUTLINE} stroke-width="5"/>
        <path d="M178 90 Q210 72 242 90" fill="none" stroke="#fff3bd" stroke-width="5" opacity=".7"/>
        <circle cx="254" cy="120" r="7" fill="${hero.color2}" ${OUTLINE} stroke-width="3"/>
        <path d="M138 206 Q210 190 282 206" fill="none" stroke="${shade(hero.hair, -20)}" stroke-width="5" opacity=".25"/>

        <g transform="translate(326 330) rotate(-18)" filter="url(#shadow${p})">
          <rect x="-10" y="-16" width="62" height="30" rx="11" fill="url(#metal${p})" ${OUTLINE} stroke-width="5"/>
          <circle cx="46" cy="-1" r="13" fill="${hero.color}" ${OUTLINE} stroke-width="4"/>
          <circle cx="46" cy="-1" r="5" fill="${hero.color2}" filter="url(#glow${p})"/>
          <path d="M10 14 L10 28 Q10 36 18 36 L34 36 Q42 36 42 28 L42 14" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
          <path d="M8 -10 L-24 -30" stroke="#28354a" stroke-width="7" stroke-linecap="round"/>
        </g>
        <g fill="${hero.color}" opacity=".8">
          <path d="M70 300 C86 286 108 292 108 310 C108 328 84 332 72 320 C64 312 64 306 70 300Z"/>
          <circle cx="354" cy="228" r="7"/><circle cx="88" cy="168" r="5"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function cactustitoPortrait(p) {
  const hero = HEROES.cactustito;
  return `
    ${charWrap(0.97, `
      <g>
        <path d="M126 294 C98 274 82 240 92 208" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
        <path d="M126 294 C98 274 82 240 92 208" fill="none" stroke="${shade(hero.skin, -6)}" stroke-width="20" stroke-linecap="round"/>
        <path d="M294 294 C322 274 338 240 328 208" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
        <path d="M294 294 C322 274 338 240 328 208" fill="none" stroke="${shade(hero.skin, -10)}" stroke-width="20" stroke-linecap="round"/>
        <g stroke="${shade(hero.skin, -28)}" stroke-width="4" stroke-linecap="round">
          <path d="M84 214 L70 204 M90 236 L72 236 M98 258 L82 268"/>
          <path d="M336 214 L350 204 M330 236 L348 236 M322 258 L338 268"/>
        </g>

        ${humanLegs(hero, p, { pants: '#2b6b34', pants2: '#215a2b', shoe: '#6b3f1c', shoeAccent: hero.color2 })}
        <path d="M160 424 Q210 412 260 424 L266 446 Q210 460 154 446Z" fill="${hero.color2}" opacity=".8"/>

        <path d="M154 268 Q210 244 266 268 L280 358 Q210 384 140 358Z" fill="url(#skin${p})" ${OUTLINE}/>
        <path d="M238 258 Q268 276 278 310 L280 358 Q250 372 224 378 L238 258Z" fill="${shade(hero.skin, -18)}" opacity=".4"/>
        <path d="M142 300 Q210 278 278 300 L270 340 Q210 360 150 340Z" fill="#ffcf4a" ${OUTLINE} stroke-width="5"/>
        <path d="M148 318 Q210 300 272 318" fill="none" stroke="${hero.accent}" stroke-width="8" opacity=".85"/>
        <path d="M154 336 Q210 318 266 336" fill="none" stroke="#37a34a" stroke-width="6"/>
        <g stroke="${hero.color2}" stroke-width="4" opacity=".8">
          <path d="M166 278 L158 264 M190 270 L186 254 M234 270 L238 254 M258 278 L266 264"/>
        </g>
        <g stroke="${shade(hero.skin, -30)}" stroke-width="3" stroke-linecap="round">
          <path d="M168 288 L164 296 M194 278 L192 286 M232 278 L234 286 M256 290 L260 298"/>
          <path d="M160 348 L156 356 M246 348 L250 356"/>
        </g>
        <circle cx="210" cy="316" r="8" fill="${hero.accent}" ${OUTLINE} stroke-width="3"/>
        <path d="M207 316 L210 326 L216 316" fill="none" stroke="#fff6bd" stroke-width="3"/>

        <path d="M118 102 Q210 66 302 102 L284 142 Q210 116 136 142Z" fill="#f4d27a" ${OUTLINE}/>
        <path d="M136 138 Q210 114 284 138 Q280 158 210 166 Q140 158 136 138Z" fill="#d9a848" ${OUTLINE} stroke-width="5"/>
        <path d="M132 136 Q210 110 288 136" fill="none" stroke="${hero.accent}" stroke-width="9"/>
        <ellipse cx="210" cy="166" rx="80" ry="74" fill="url(#skin${p})" ${OUTLINE}/>
        <ellipse cx="210" cy="190" rx="58" ry="48" fill="${shade(hero.skin, 14)}" opacity=".28"/>
        <g fill="${shade(hero.skin, 20)}">
          <path d="M144 126 l-6 -18 14 8Z"/><path d="M168 106 l-2 -20 12 12Z"/>
          <path d="M248 104 l4 -20 8 16Z"/><path d="M276 126 l10 -16 4 18Z"/>
          <path d="M132 160 l-18 2 10 12Z"/><path d="M288 160 l18 2 -10 12Z"/>
        </g>
        ${eyeShape(184, 164, 16, 19, hero, p, { lashes: false, irisScale: 0.58 })}
        ${eyeShape(236, 164, 16, 19, hero, p, { lashes: false, irisScale: 0.58 })}
        <path d="M190 144 Q202 136 212 144" fill="none" stroke="#1b4a21" stroke-width="5" stroke-linecap="round"/>
        <path d="M226 144 Q238 136 250 144" fill="none" stroke="#1b4a21" stroke-width="5" stroke-linecap="round"/>
        <path d="M188 198 Q210 214 232 198" fill="none" stroke="#245a2b" stroke-width="5" stroke-linecap="round"/>
        <path d="M176 190 Q188 182 200 190 Q188 198 176 190Z" fill="#1d4a23" ${OUTLINE} stroke-width="3"/>
        <path d="M220 190 Q232 182 244 190 Q232 198 220 190Z" fill="#1d4a23" ${OUTLINE} stroke-width="3"/>
        <ellipse cx="166" cy="196" rx="12" ry="6" fill="${hero.accent}" opacity=".3"/>
        <ellipse cx="254" cy="196" rx="12" ry="6" fill="${hero.accent}" opacity=".3"/>
        <circle cx="210" cy="196" r="4" fill="#245a2b" opacity=".5"/>

        <g transform="translate(208 336) rotate(-18)" filter="url(#shadow${p})">
          <path d="M-70 38 C-70 6 -38 -8 0 -8 C38 -8 70 6 70 38 C50 58 24 64 0 64 C-24 64 -50 58 -70 38Z" fill="#d58a3a" ${OUTLINE} stroke-width="6"/>
          <path d="M-52 34 C-50 14 -28 6 0 6 C28 6 50 14 52 34 C36 48 18 52 0 52 C-18 52 -36 48 -52 34Z" fill="#8f4b1c" opacity=".55"/>
          <circle cx="0" cy="30" r="15" fill="#3a1a0b" ${OUTLINE} stroke-width="4"/>
          <path d="M0 30 L0 64" stroke="#fff2c8" stroke-width="3" opacity=".55"/>
          <rect x="-10" y="-104" width="20" height="98" rx="7" fill="#7a431c" ${OUTLINE} stroke-width="5"/>
          <rect x="-6" y="-106" width="12" height="20" rx="4" fill="#3a1a0b" stroke="${INK}" stroke-width="3"/>
          <g stroke="#ffe6a8" stroke-width="3">
            <path d="M-8 -96 L8 -96 M-8 -86 L8 -86 M-8 -76 L8 -76"/>
          </g>
          <path d="M-16 42 L-32 46 M16 42 L32 46" stroke="#fff2c8" stroke-width="4" stroke-linecap="round"/>
        </g>
        ${limb('M154 292 Q124 318 136 346', hero.skin, 25)}
        ${limb('M264 292 Q300 302 306 330', hero.skin, 25)}
        <circle cx="136" cy="346" r="17" fill="${shade(hero.skin, 10)}" ${OUTLINE} stroke-width="5"/>
        <circle cx="306" cy="330" r="17" fill="${shade(hero.skin, 6)}" ${OUTLINE} stroke-width="5"/>
        <g fill="${hero.accent}" filter="url(#glow${p})">
          <path d="M330 148 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/>
          <path d="M86 276 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
          <circle cx="350" cy="252" r="3"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function rokkoPortrait(p) {
  const hero = HEROES.rokko;
  return `
    ${charWrap(1.05, `
      <g>
        <path d="M112 300 C76 318 64 354 84 386" fill="none" stroke="${INK}" stroke-width="56" stroke-linecap="round"/>
        <path d="M112 300 C76 318 64 354 84 386" fill="none" stroke="url(#metal${p})" stroke-width="40" stroke-linecap="round"/>
        <path d="M124 410 L124 438 Q124 452 144 452 L176 452 Q190 452 190 436 L190 410Z" fill="#28354a" ${OUTLINE} stroke-width="6"/>
        <path d="M230 410 L230 438 Q230 452 250 452 L282 452 Q296 452 296 436 L296 410Z" fill="#28354a" ${OUTLINE} stroke-width="6"/>
        <path d="M130 424 L184 424 M236 424 L290 424" stroke="${hero.color}" stroke-width="5" opacity=".8"/>
        <g fill="${shade(hero.color, -20)}">
          <circle cx="146" cy="440" r="6"/><circle cx="176" cy="440" r="6"/>
          <circle cx="252" cy="440" r="6"/><circle cx="282" cy="440" r="6"/>
        </g>

        <path d="M144 260 Q210 232 280 260 L296 366 Q210 400 124 366Z" fill="url(#cloth${p})" ${OUTLINE}/>
        <path d="M244 254 Q278 270 290 306 L296 366 Q258 382 226 386 L244 254Z" fill="${shade(hero.color, -26)}" opacity=".48"/>
        <path d="M142 300 L290 300 L282 324 L150 324Z" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
        <path d="M152 316 L278 316" stroke="#d9f4ff" stroke-width="4" opacity=".65"/>
        <rect x="184" y="264" width="52" height="30" rx="8" fill="#1a2740" ${OUTLINE} stroke-width="4"/>
        <circle cx="198" cy="279" r="5" fill="${hero.color2}" filter="url(#glow${p})"/>
        <circle cx="210" cy="279" r="5" fill="#7bff9d" filter="url(#glow${p})"/>
        <circle cx="222" cy="279" r="5" fill="${hero.accent}" filter="url(#glow${p})"/>
        <path d="M150 342 L276 342" stroke="${hero.color2}" stroke-width="8" opacity=".65"/>
        <g fill="#1a2740">
          <circle cx="160" cy="280" r="4"/><circle cx="260" cy="280" r="4"/>
          <circle cx="160" cy="350" r="4"/><circle cx="260" cy="350" r="4"/>
        </g>

        <path d="M128 156 Q128 112 166 100 L254 100 Q292 112 292 156 L292 194 Q292 236 254 246 L166 246 Q128 236 128 194Z" fill="url(#metal${p})" ${OUTLINE}/>
        <path d="M134 160 Q134 120 170 110 L250 110 Q286 120 286 160 L286 188 Q286 224 250 234 L170 234 Q134 224 134 188Z" fill="#36455f" ${OUTLINE} stroke-width="5"/>
        <path d="M158 154 Q210 140 262 154 Q262 182 262 188 Q210 202 158 188 Q158 166 158 154Z" fill="#0a2038" ${OUTLINE} stroke-width="5"/>
        <path d="M170 166 Q210 156 250 166" stroke="${hero.eye}" stroke-width="5" stroke-linecap="round" filter="url(#glow${p})"/>
        <circle cx="186" cy="168" r="7" fill="${hero.eye}" filter="url(#glow${p})"/>
        <circle cx="234" cy="168" r="7" fill="${hero.eye}" filter="url(#glow${p})"/>
        <path d="M178 210 Q210 228 242 210" fill="none" stroke="#0a1b2c" stroke-width="6" stroke-linecap="round"/>
        <path d="M150 124 Q210 98 270 124 Q286 110 294 128 L284 150 Q210 122 136 150 L126 128 Q136 110 150 124Z" fill="url(#gold${p})" ${OUTLINE}/>
        <path d="M144 130 Q210 108 276 130" fill="none" stroke="#fff3a8" stroke-width="5" opacity=".6"/>
        <rect x="192" y="94" width="36" height="20" rx="6" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
        <circle cx="210" cy="88" r="6" fill="${hero.accent}" filter="url(#glow${p})"/>
        <path d="M124 170 L110 180 L112 200 L126 194Z" fill="#28354a" ${OUTLINE} stroke-width="4"/>
        <path d="M296 170 L310 180 L308 200 L294 194Z" fill="#28354a" ${OUTLINE} stroke-width="4"/>

        <g transform="translate(310 330) rotate(-8)" filter="url(#shadow${p})">
          <path d="M0 -34 L36 -26 L64 -4 L36 18 L0 26 L-20 0Z" fill="url(#metal${p})" ${OUTLINE} stroke-width="6"/>
          <path d="M8 -18 L34 -12 L48 0 L34 12 L8 18 L-4 0Z" fill="#6f829e" opacity=".6"/>
          <path d="M46 0 L108 0 L122 14 L108 28 L46 28Z" fill="url(#gold${p})" ${OUTLINE} stroke-width="5"/>
          <path d="M56 6 L104 6 M56 22 L104 22" stroke="#8d5200" stroke-width="3" opacity=".6"/>
          <path d="M120 0 L152 14 L120 28Z" fill="#d9e9ff" ${OUTLINE} stroke-width="4"/>
          <path d="M108 0 L122 14 L108 28" fill="#ffd45e" opacity=".6"/>
          <path d="M-10 28 L-26 44 M14 30 L10 52 M40 30 L48 54" stroke="${hero.color}" stroke-width="4" stroke-linecap="round" opacity=".8"/>
        </g>
        <path d="M118 288 Q96 304 102 328" fill="none" stroke="${INK}" stroke-width="38" stroke-linecap="round"/>
        <path d="M118 288 Q96 304 102 328" fill="none" stroke="${shade(hero.color, -10)}" stroke-width="27" stroke-linecap="round"/>
        <circle cx="102" cy="332" r="22" fill="url(#metal${p})" ${OUTLINE} stroke-width="5"/>
        <path d="M88 332 L116 332 M102 318 L102 346" stroke="${hero.color2}" stroke-width="4" opacity=".6"/>
        <g fill="${hero.color2}" filter="url(#glow${p})">
          <circle cx="92" cy="376" r="4"/><circle cx="336" cy="362" r="5"/><circle cx="352" cy="386" r="3"/>
        </g>
        <g stroke="${hero.accent}" stroke-width="3" stroke-linecap="round" opacity=".8">
          <path d="M326 322 L350 306 M334 338 L362 334 M326 354 L350 368"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function flickyPortrait(p) {
  const hero = HEROES.flicky;
  return `
    ${charWrap(1, `
      <g>
        <path d="M284 316 C336 328 362 366 342 406 C330 430 300 434 282 412 C310 398 316 372 292 350Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M312 350 Q338 370 326 398" fill="none" stroke="${shade(hero.hair, 26)}" stroke-width="9" stroke-linecap="round" opacity=".6"/>
        <path d="M292 396 Q308 410 326 398" fill="none" stroke="${hero.skin2}" stroke-width="12" stroke-linecap="round"/>

        ${humanLegs(hero, p, { pants: '#244a54', pants2: '#1b3a45', shoe: '#7a4420', shoeAccent: hero.color })}

        <path d="M154 268 Q210 246 266 268 L280 360 Q210 386 140 360Z" fill="url(#cloth${p})" ${OUTLINE}/>
        <path d="M238 258 Q268 276 278 310 L280 360 Q250 374 224 380 L238 258Z" fill="${shade(hero.color, -24)}" opacity=".5"/>
        <path d="M150 278 L270 278 L264 300 L156 300Z" fill="#244a54" ${OUTLINE} stroke-width="4"/>
        <path d="M166 300 L254 300 L246 358 Q210 372 174 358Z" fill="${shade(hero.color, 12)}" ${OUTLINE} stroke-width="4"/>
        <path d="M176 320 L244 320" stroke="${hero.color2}" stroke-width="4" opacity=".7"/>
        <path d="M164 272 Q210 254 256 272" fill="none" stroke="${shade(hero.color, -30)}" stroke-width="8" opacity=".55"/>
        <rect x="190" y="332" width="40" height="20" rx="5" fill="#2c251c" ${OUTLINE} stroke-width="3"/>
        <circle cx="210" cy="342" r="5" fill="url(#gold${p})"/>
        <path d="M150 360 Q210 382 270 360" fill="none" stroke="#2c251c" stroke-width="9"/>
        <path d="M162 306 L150 332 M258 306 L270 332" stroke="${hero.color2}" stroke-width="4" opacity=".7"/>

        <path d="M132 134 L116 66 L174 104Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M166 96 L158 74 L186 90Z" fill="${hero.skin2}" ${OUTLINE} stroke-width="4"/>
        <path d="M286 134 L304 66 L246 104Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M254 96 L264 74 L234 90Z" fill="${hero.skin2}" ${OUTLINE} stroke-width="4"/>
        <ellipse cx="210" cy="164" rx="82" ry="76" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M150 156 Q170 132 196 142 L190 184 Q164 186 150 174Z" fill="${hero.skin2}" ${OUTLINE} stroke-width="4"/>
        <path d="M270 156 Q250 132 224 142 L230 184 Q256 186 270 174Z" fill="${hero.skin2}" ${OUTLINE} stroke-width="4"/>
        <ellipse cx="210" cy="194" rx="48" ry="37" fill="${hero.skin2}" ${OUTLINE} stroke-width="5"/>
        <ellipse cx="210" cy="182" rx="17" ry="12" fill="#2a1608" ${OUTLINE} stroke-width="3"/>
        <path d="M192 206 Q210 224 228 206" fill="none" stroke="#3d1e0e" stroke-width="5" stroke-linecap="round"/>
        <path d="M200 208 Q210 220 220 208" fill="#2a1608" opacity=".65"/>
        ${eyeShape(180, 156, 18, 21, hero, p, { lashes: true, irisScale: 0.6 })}
        ${eyeShape(240, 156, 18, 21, hero, p, { lashes: true, irisScale: 0.6 })}
        <path d="M158 130 Q176 118 194 130" fill="none" stroke="#6b3412" stroke-width="6" stroke-linecap="round"/>
        <path d="M226 130 Q244 118 262 130" fill="none" stroke="#6b3412" stroke-width="6" stroke-linecap="round"/>
        <path d="M134 152 Q120 166 128 186 Q108 180 112 158 Q116 138 134 152Z" fill="${hero.skin2}" opacity=".65"/>
        <path d="M286 152 Q300 166 292 186 Q312 180 308 158 Q304 138 286 152Z" fill="${hero.skin2}" opacity=".65"/>
        <path d="M154 110 Q210 78 266 110 Q254 126 210 116 Q166 126 154 110Z" fill="#2c3c4a" ${OUTLINE} stroke-width="5"/>
        <path d="M166 110 Q210 96 254 110" fill="none" stroke="${hero.color2}" stroke-width="4" opacity=".7"/>
        <ellipse cx="174" cy="112" rx="16" ry="12" fill="${hero.color2}" fill-opacity=".3" stroke="${hero.color2}" stroke-width="3"/>
        <ellipse cx="246" cy="112" rx="16" ry="12" fill="${hero.color2}" fill-opacity=".3" stroke="${hero.color2}" stroke-width="3"/>
        <path d="M162 126 Q210 146 258 126" fill="none" stroke="${hero.accent}" stroke-width="10" stroke-linecap="round"/>
        <path d="M158 140 Q156 164 174 176" fill="none" stroke="${hero.accent}" stroke-width="7" stroke-linecap="round" opacity=".8"/>
        <path d="M262 140 Q264 164 246 176" fill="none" stroke="${hero.accent}" stroke-width="7" stroke-linecap="round" opacity=".8"/>

        ${limb('M156 290 Q124 316 138 348', hero.color, 26)}
        ${limb('M262 290 Q298 304 308 330', hero.color, 26)}
        <circle cx="138" cy="348" r="17" fill="#2c251c" ${OUTLINE} stroke-width="5"/>
        <circle cx="308" cy="330" r="17" fill="#2c251c" ${OUTLINE} stroke-width="5"/>
        <g transform="translate(324 320) rotate(-20)" filter="url(#shadow${p})">
          <path d="M-44 20 C-58 0 -42 -24 -16 -24 L14 -10 C34 0 34 26 12 36 L-18 36 C-30 34 -38 28 -44 20Z" fill="url(#gold${p})" ${OUTLINE} stroke-width="5"/>
          <path d="M-24 4 C-10 -10 14 -4 18 10 C22 24 4 30 -8 20 C-18 12 -28 12 -24 4Z" fill="#8c5200" opacity=".5"/>
          <path d="M-18 -16 L-4 12 L10 -14" fill="none" stroke="#fff3b0" stroke-width="4" opacity=".7"/>
        </g>
        <g fill="${hero.color2}" filter="url(#glow${p})">
          <circle cx="90" cy="242" r="4"/><circle cx="342" cy="218" r="3"/>
          <path d="M84 176 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function zyraPortrait(p) {
  const hero = HEROES.zyra;
  return `
    ${charWrap(1, `
      <g>
        <path d="M130 178 C116 104 166 52 226 52 C286 52 316 96 304 176 L292 236 C278 262 254 250 242 222 L228 194 L214 238 L200 196 L186 240 C168 248 150 234 144 212Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M122 152 C94 148 84 170 98 190 C108 204 124 204 136 196Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M298 152 C326 148 336 170 322 190 C312 204 296 204 284 196Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M112 176 Q96 202 106 226" fill="none" stroke="${shade(hero.hair, 24)}" stroke-width="7" stroke-linecap="round" opacity=".65"/>
        <path d="M308 176 Q324 202 314 226" fill="none" stroke="${shade(hero.hair, 24)}" stroke-width="7" stroke-linecap="round" opacity=".65"/>

        ${humanLegs(hero, p, { pants: '#1a2950', pants2: '#233665', shoe: '#e8fbff', shoeAccent: hero.color })}
        <path d="M160 392 L180 392 M240 392 L260 392" stroke="${hero.color2}" stroke-width="4" opacity=".6"/>

        <path d="M154 268 Q210 246 266 268 L280 362 Q210 388 140 362Z" fill="url(#dark${p})" ${OUTLINE}/>
        <path d="M238 258 Q268 276 278 310 L280 362 Q250 376 224 382 L238 258Z" fill="${shade(hero.color, -18)}" opacity=".3"/>
        <path d="M158 274 L210 296 L262 274 L270 300 L246 314 L242 292 L178 292 L174 314 L150 300Z" fill="#1f3a6e" ${OUTLINE} stroke-width="4"/>
        <path d="M176 296 L190 354 M244 296 L230 354" stroke="${hero.color}" stroke-width="4" opacity=".8"/>
        <path d="M208 292 L208 358" stroke="${hero.color2}" stroke-width="3" stroke-dasharray="5 6" opacity=".75"/>
        <rect x="190" y="332" width="40" height="22" rx="6" fill="#0e1d3a" ${OUTLINE} stroke-width="3"/>
        <circle cx="210" cy="343" r="6" fill="${hero.color2}" filter="url(#glow${p})"/>
        <path d="M150 344 L270 344" stroke="${hero.color2}" stroke-width="5" opacity=".55"/>
        <path d="M162 306 L150 330 M258 306 L270 330" stroke="${hero.color}" stroke-width="3" opacity=".55"/>

        ${humanFace(hero, p, {
          cy: 162,
          rx: 76,
          ry: 82,
          eyeY: 166,
          eyeGap: 34,
          eyeRx: 21,
          eyeRy: 24,
          expression: 'grin',
          lashes: true,
          irisScale: 0.62,
        })}
        <path d="M142 166 C148 92 184 58 226 60 C270 62 300 96 304 162 C280 146 262 140 246 146 C234 122 210 114 190 126 C170 138 156 158 150 180Z" fill="url(#hair${p})" ${OUTLINE}/>
        <path d="M154 154 Q184 124 218 134 Q248 142 272 134" fill="none" stroke="${shade(hero.hair, 28)}" stroke-width="6" opacity=".65"/>
        <path d="M180 104 C196 118 204 138 204 156" fill="none" stroke="${shade(hero.hair, 18)}" stroke-width="5" opacity=".55"/>
        <path d="M142 150 Q124 148 120 166 L130 228 Q146 244 158 228 L154 168Z" fill="${shade(hero.dark, 24)}" ${OUTLINE} stroke-width="5"/>
        <path d="M278 150 Q296 148 300 166 L290 228 Q274 244 262 228 L266 168Z" fill="${shade(hero.dark, 24)}" ${OUTLINE} stroke-width="5"/>
        <circle cx="132" cy="196" r="17" fill="${hero.color}" ${OUTLINE} stroke-width="4"/>
        <circle cx="132" cy="196" r="7" fill="${hero.color2}" filter="url(#glow${p})"/>
        <circle cx="288" cy="196" r="17" fill="${hero.color}" ${OUTLINE} stroke-width="4"/>
        <circle cx="288" cy="196" r="7" fill="${hero.color2}" filter="url(#glow${p})"/>
        <path d="M132 180 L132 156 M288 180 L288 156" stroke="${hero.color2}" stroke-width="4" stroke-linecap="round"/>
        <path d="M118 154 Q132 140 146 154" fill="none" stroke="${hero.color}" stroke-width="5" stroke-linecap="round"/>
        <path d="M274 154 Q288 140 302 154" fill="none" stroke="${hero.color}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="252" cy="114" r="7" fill="${hero.color2}" ${OUTLINE} stroke-width="3"/>
        <path d="M210 94 L214 102 L224 102 L216 109 L219 119 L210 113 L201 119 L204 109 L196 102 L206 102Z" fill="${hero.color2}" opacity=".8"/>

        <path d="M258 286 Q298 296 310 330" fill="none" stroke="${INK}" stroke-width="38" stroke-linecap="round"/>
        <path d="M258 286 Q298 296 310 330" fill="none" stroke="${hero.color}" stroke-width="27" stroke-linecap="round"/>
        <circle cx="310" cy="334" r="20" fill="${shade(hero.dark, 26)}" ${OUTLINE} stroke-width="5"/>
        <g transform="translate(326 286) rotate(-12)" filter="url(#shadow${p})">
          <rect x="-6" y="-46" width="58" height="78" rx="12" fill="${hero.color}" fill-opacity=".2" stroke="${hero.color2}" stroke-width="4"/>
          <path d="M0 -35 L44 -28 L44 20 L0 27Z" fill="${hero.color2}" opacity=".35"/>
          <path d="M8 -22 L36 -18 M8 -10 L36 -6 M8 2 L28 5 M8 14 L20 16" stroke="#e9ffff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
          <circle cx="54" cy="-10" r="5" fill="${hero.color2}" filter="url(#glow${p})"/>
        </g>
        <g fill="${hero.color2}" filter="url(#glow${p})" opacity=".9">
          <rect x="336" y="246" width="12" height="12" rx="2" transform="rotate(18 342 252)"/>
          <rect x="356" y="270" width="7" height="7" rx="2" transform="rotate(-12 360 274)"/>
          <circle cx="82" cy="248" r="3"/><circle cx="346" cy="356" r="3"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

function sharkyPortrait(p) {
  const hero = HEROES.sharky;
  return `
    ${charWrap(1.02, `
      <g>
        <path d="M292 314 C334 324 344 362 322 390 C306 410 278 404 268 384 C292 376 300 352 282 334Z" fill="${shade(hero.color, -8)}" ${OUTLINE}/>
        <path d="M300 344 Q318 362 308 382" fill="none" stroke="${hero.color2}" stroke-width="6" opacity=".6"/>

        ${humanLegs(hero, p, { pants: '#14335e', pants2: '#1b4275', shoe: '#f3fbff', shoeAccent: hero.color })}

        <path d="M152 270 Q210 246 268 270 L284 366 Q210 392 136 366Z" fill="url(#cloth${p})" ${OUTLINE}/>
        <path d="M240 262 Q270 278 280 312 L284 366 Q254 380 224 386 L240 262Z" fill="${shade(hero.color, -24)}" opacity=".45"/>
        <path d="M156 298 Q210 320 264 298 L258 336 Q210 352 162 336Z" fill="#f3fbff" ${OUTLINE} stroke-width="4"/>
        <path d="M170 304 L178 316 L186 302 L194 317 L202 302 L210 317 L218 302 L226 317 L234 302 L242 316 L250 304" fill="none" stroke="${shade(hero.color, -20)}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M164 270 Q210 254 256 270" fill="none" stroke="${hero.color2}" stroke-width="6" opacity=".7"/>
        <path d="M146 350 Q210 376 274 350" fill="none" stroke="${shade(hero.color, -34)}" stroke-width="9" opacity=".7"/>
        <path d="M178 260 L210 240 L242 260 L234 282 L210 270 L186 282Z" fill="${shade(hero.color, -18)}" ${OUTLINE} stroke-width="4"/>
        <path d="M210 268 L210 296" stroke="${hero.color2}" stroke-width="4" opacity=".6"/>
        <g fill="${hero.color2}" opacity=".8">
          <circle cx="158" cy="326" r="4"/><circle cx="262" cy="326" r="4"/>
        </g>

        <path d="M128 144 Q124 88 170 68 L250 68 Q296 88 292 144 L292 214 Q292 252 254 258 L166 258 Q128 252 128 214Z" fill="url(#cloth${p})" ${OUTLINE}/>
        <path d="M140 148 Q140 104 176 88 L244 88 Q280 104 280 148 L280 204 Q280 236 246 242 L174 242 Q140 236 140 204Z" fill="${hero.skin2}" ${OUTLINE} stroke-width="5"/>
        <path d="M168 152 Q210 142 252 152 Q252 178 252 184 Q210 196 168 184 Q168 166 168 152Z" fill="#0b2a4f" stroke="${hero.color2}" stroke-width="4"/>
        <path d="M188 156 Q206 150 224 156" fill="none" stroke="${shade(hero.color, 30)}" stroke-width="7" stroke-linecap="round"/>
        <path d="M178 162 Q210 176 242 162" fill="none" stroke="${shade(hero.color, -18)}" stroke-width="5" opacity=".8"/>
        <ellipse cx="210" cy="206" rx="38" ry="30" fill="${hero.skin2}" ${OUTLINE} stroke-width="4"/>
        <path d="M190 204 Q210 220 230 204" fill="none" stroke="#6b2f1a" stroke-width="5" stroke-linecap="round"/>
        <path d="M196 206 Q210 218 224 206" fill="#fff8ea" opacity=".9"/>
        ${eyeShape(186, 166, 16, 19, hero, p, { lashes: false, irisScale: 0.62 })}
        ${eyeShape(234, 166, 16, 19, hero, p, { lashes: false, irisScale: 0.62 })}
        <path d="M168 144 Q184 134 198 144" fill="none" stroke="#1a3f6b" stroke-width="5" stroke-linecap="round"/>
        <path d="M222 144 Q236 134 252 144" fill="none" stroke="#1a3f6b" stroke-width="5" stroke-linecap="round"/>
        <path d="M136 150 Q118 142 108 158 L116 178 Q130 186 144 176Z" fill="${shade(hero.color, 14)}" ${OUTLINE} stroke-width="4"/>
        <path d="M284 150 Q302 142 312 158 L304 178 Q290 186 276 176Z" fill="${shade(hero.color, 14)}" ${OUTLINE} stroke-width="4"/>
        <path d="M210 68 Q222 34 246 28 Q238 58 250 76Z" fill="${shade(hero.color, -10)}" ${OUTLINE}/>
        <path d="M218 58 Q228 44 236 40" fill="none" stroke="${hero.color2}" stroke-width="4" opacity=".6"/>
        <g fill="#f3fbff" ${OUTLINE} stroke-width="3">
          <path d="M142 112 L150 128 L158 112 L166 128 L174 112 L182 128 L190 112 L198 128 L206 112 L214 128 L222 112 L230 128 L238 112 L246 128 L254 112 L262 128 L270 112 L278 128 L286 112 L294 126 L296 102 L136 102Z"/>
        </g>
        <path d="M130 102 Q210 78 290 102 L292 112 Q210 90 128 112Z" fill="${shade(hero.color, -16)}" ${OUTLINE} stroke-width="4"/>
        <path d="M168 92 Q210 104 252 92" fill="none" stroke="${hero.color2}" stroke-width="4" opacity=".65"/>
        <circle cx="290" cy="120" r="5" fill="${hero.color2}" ${OUTLINE} stroke-width="2"/>

        ${limb('M154 292 Q124 318 136 352', hero.color, 27)}
        ${limb('M266 292 Q300 310 306 340', hero.color, 27)}
        <circle cx="136" cy="352" r="18" fill="#12345c" ${OUTLINE} stroke-width="5"/>
        <circle cx="306" cy="340" r="18" fill="#12345c" ${OUTLINE} stroke-width="5"/>
        <g transform="translate(322 332) rotate(-10)" filter="url(#shadow${p})">
          <rect x="-20" y="-22" width="84" height="40" rx="15" fill="url(#metal${p})" ${OUTLINE} stroke-width="6"/>
          <rect x="20" y="-13" width="34" height="12" rx="6" fill="${hero.color}" opacity=".9"/>
          <circle cx="60" cy="0" r="15" fill="${hero.color2}" ${OUTLINE} stroke-width="4"/>
          <circle cx="60" cy="0" r="7" fill="#e9ffff" filter="url(#glow${p})"/>
          <rect x="-6" y="12" width="24" height="20" rx="7" fill="#12345c" ${OUTLINE} stroke-width="4"/>
          <path d="M-12 -16 L-34 -34" stroke="#2b3b53" stroke-width="8" stroke-linecap="round"/>
        </g>
        <g fill="none" stroke="${hero.color2}" stroke-width="3" opacity=".75" filter="url(#glow${p})">
          <path d="M82 240 C92 222 114 222 124 240"/>
          <path d="M72 216 C86 192 116 192 130 216"/>
          <circle cx="100" cy="258" r="5"/>
          <circle cx="84" cy="286" r="3"/>
        </g>
        <g fill="${hero.color2}" opacity=".55">
          <path d="M60 330 C72 312 96 318 98 336 C100 354 76 362 66 346Z"/>
        </g>
      </g>
    `)}`;
}

/* ------------------------------------------------------------------ */

const PORTRAIT_RENDERERS = {
  nova: novaPortrait,
  bubblix: bubblixPortrait,
  grizz: grizzPortrait,
  vex: vexPortrait,
  pipette: pipettePortrait,
  cactustito: cactustitoPortrait,
  rokko: rokkoPortrait,
  flicky: flickyPortrait,
  zyra: zyraPortrait,
  sharky: sharkyPortrait,
};

export function portrait(heroId, options = {}) {
  const hero = HEROES[heroId] || HEROES[HeroFallback()] || HEROES.nova;
  const p = safeId(options.uid || `pt${++portraitSequence}`);
  const withBackground = options.background !== false;
  const renderer = PORTRAIT_RENDERERS[hero.id] || PORTRAIT_RENDERERS.nova;
  const className = options.className ? ` class="${options.className}"` : '';
  const viewBox = options.bust ? '58 18 304 304' : '0 0 420 480';
  return `<svg${className} viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${hero.name} — ${hero.title}" preserveAspectRatio="xMidYMid meet">
    ${portraitDefs(hero, p)}
    ${withBackground ? portraitBackground(hero, p) : ''}
    ${renderer(p)}
  </svg>`;
}

export function heroMiniIcon(heroId) {
  const hero = HEROES[heroId] || HEROES.nova;
  const r = rarityOf(hero);
  return `<span class="mini-hero" style="--hero:${hero.color};--hero2:${hero.color2};--rarity:${r.color}">
    <span class="mini-hero-gem"></span>
    <strong>${hero.name}</strong>
  </span>`;
}

function HeroFallback() {
  return Object.keys(HEROES)[0] || 'nova';
}
