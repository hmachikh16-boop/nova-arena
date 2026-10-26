import { ARENAS, HERO_ORDER } from './data.js';

const STORAGE_KEY = 'nova-arena-save-v1';
const ARENA_IDS = ARENAS.map((arena) => arena.id);

export const QUESTS = Object.freeze([
  {
    id: 'daily-win',
    title: 'أول انتصار اليوم',
    description: 'اربح مباراة واحدة في ساحة نوفا.',
    stat: 'wins',
    target: 1,
    reward: { coins: 150, gems: 0 },
    tone: 'gold',
    icon: 'trophy',
  },
  {
    id: 'daily-gems',
    title: 'صائد الجواهر',
    description: 'اجمع 20 جوهرة خلال مبارياتك.',
    stat: 'gems',
    target: 20,
    reward: { coins: 0, gems: 25 },
    tone: 'cyan',
    icon: 'gem',
  },
  {
    id: 'daily-damage',
    title: 'قوة الساحة',
    description: 'ألحق 15,000 نقطة ضرر بأعدائك.',
    stat: 'damage',
    target: 15000,
    reward: { coins: 120, gems: 10 },
    tone: 'pink',
    icon: 'flame',
  },
  {
    id: 'daily-kills',
    title: 'مطاردة النجوم',
    description: 'أقصِ 8 أبطال أعداء.',
    stat: 'kills',
    target: 8,
    reward: { coins: 90, gems: 0 },
    tone: 'violet',
    icon: 'target',
  },
]);

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function freshDaily() {
  return {
    date: todayKey(),
    progress: { wins: 0, gems: 0, damage: 0, kills: 0 },
    claimed: [],
  };
}

function defaultState() {
  return {
    version: 1,
    player: { name: 'قائد نوفا' },
    selectedHero: 'nova',
    selectedArena: ARENA_IDS[0],
    trophies: Object.fromEntries(HERO_ORDER.map((id) => [id, 0])),
    currency: { coins: 850, gems: 120 },
    stats: { matches: 0, wins: 0, kills: 0, deaths: 0, gems: 0, damage: 0 },
    daily: freshDaily(),
    settings: { sound: true },
  };
}

function clampNumber(value, fallback = 0, min = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, number) : fallback;
}

function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  const state = {
    ...base,
    ...raw,
    player: { ...base.player, ...(raw.player || {}) },
    currency: { ...base.currency, ...(raw.currency || {}) },
    stats: { ...base.stats, ...(raw.stats || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    trophies: { ...base.trophies, ...(raw.trophies || {}) },
    daily: raw.daily && typeof raw.daily === 'object' ? raw.daily : freshDaily(),
  };

  state.player.name =
    typeof state.player.name === 'string' && state.player.name.trim()
      ? state.player.name.trim().slice(0, 22)
      : base.player.name;
  state.selectedHero = HERO_ORDER.includes(state.selectedHero) ? state.selectedHero : 'nova';
  state.selectedArena = ARENA_IDS.includes(state.selectedArena) ? state.selectedArena : ARENA_IDS[0];

  state.currency.coins = clampNumber(state.currency.coins, 850);
  state.currency.gems = clampNumber(state.currency.gems, 120);

  for (const id of HERO_ORDER) {
    state.trophies[id] = clampNumber(state.trophies[id], 0);
  }

  for (const key of ['matches', 'wins', 'kills', 'deaths', 'gems', 'damage']) {
    state.stats[key] = clampNumber(state.stats[key], 0);
  }

  if (!state.daily || state.daily.date !== todayKey()) {
    state.daily = freshDaily();
  } else {
    state.daily.progress = { ...freshDaily().progress, ...(state.daily.progress || {}) };
    state.daily.claimed = Array.isArray(state.daily.claimed) ? state.daily.claimed : [];
  }

  state.settings.sound = state.settings.sound !== false;
  return state;
}

let state = loadState();

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The game remains fully playable when storage is unavailable.
  }
}

export function getState() {
  ensureToday();
  return state;
}

export function totalTrophies() {
  return HERO_ORDER.reduce((sum, id) => sum + (Number(state.trophies[id]) || 0), 0);
}

export function ensureToday() {
  if (state.daily.date !== todayKey()) {
    state.daily = freshDaily();
    persist();
  }
}

export function selectHero(heroId) {
  if (!HERO_ORDER.includes(heroId)) return;
  state.selectedHero = heroId;
  persist();
}

export function selectArena(arenaId) {
  if (!ARENA_IDS.includes(arenaId)) return;
  state.selectedArena = arenaId;
  persist();
}

export function setSoundEnabled(enabled) {
  state.settings.sound = Boolean(enabled);
  persist();
}

export function renamePlayer(name) {
  const clean = String(name || '').trim().slice(0, 22);
  if (!clean) return;
  state.player.name = clean;
  persist();
}

export function getQuestEntries() {
  ensureToday();
  return QUESTS.map((quest) => {
    const progress = Math.min(quest.target, Number(state.daily.progress[quest.stat]) || 0);
    const complete = progress >= quest.target;
    const claimed = state.daily.claimed.includes(quest.id);
    return { ...quest, progress, complete, claimed };
  });
}

export function claimQuest(questId) {
  ensureToday();
  const quest = QUESTS.find((entry) => entry.id === questId);
  if (!quest) return { ok: false, reason: 'missing' };
  const progress = Math.min(quest.target, Number(state.daily.progress[quest.stat]) || 0);
  if (progress < quest.target) return { ok: false, reason: 'incomplete' };
  if (state.daily.claimed.includes(quest.id)) return { ok: false, reason: 'claimed' };

  state.daily.claimed.push(quest.id);
  state.currency.coins += quest.reward.coins || 0;
  state.currency.gems += quest.reward.gems || 0;
  persist();
  return { ok: true, reward: quest.reward };
}

export function recordMatch({ heroId, won, kills = 0, deaths = 0, gems = 0, damage = 0 }) {
  ensureToday();
  const safeHero = HERO_ORDER.includes(heroId) ? heroId : state.selectedHero;
  const victory = Boolean(won);
  const trophyDelta = victory ? 8 : -3;
  const beforeTrophies = state.trophies[safeHero] || 0;
  const afterTrophies = Math.max(0, beforeTrophies + trophyDelta);
  const realTrophyDelta = afterTrophies - beforeTrophies;

  const coinReward = victory
    ? 45 + Math.min(60, Math.round(gems) * 3) + Math.min(25, Math.round(kills) * 4)
    : 18 + Math.min(35, Math.round(gems) * 2);
  const gemReward = victory ? 3 : 0;

  state.trophies[safeHero] = afterTrophies;
  state.currency.coins += coinReward;
  state.currency.gems += gemReward;
  state.stats.matches += 1;
  state.stats.wins += victory ? 1 : 0;
  state.stats.kills += Math.max(0, Math.round(kills));
  state.stats.deaths += Math.max(0, Math.round(deaths));
  state.stats.gems += Math.max(0, Math.round(gems));
  state.stats.damage += Math.max(0, Math.round(damage));

  state.daily.progress.wins += victory ? 1 : 0;
  state.daily.progress.gems += Math.max(0, Math.round(gems));
  state.daily.progress.kills += Math.max(0, Math.round(kills));
  state.daily.progress.damage += Math.max(0, Math.round(damage));

  for (const id of HERO_ORDER) {
    state.trophies[id] = Math.max(0, Number(state.trophies[id]) || 0);
  }

  persist();
  return {
    trophyDelta: realTrophyDelta,
    coinReward,
    gemReward,
    beforeTrophies,
    afterTrophies,
    totalTrophies: totalTrophies(),
  };
}

export function updatePlayerName(name) {
  renamePlayer(name);
  return state.player.name;
}

export function resetSave() {
  state = defaultState();
  persist();
  return state;
}
