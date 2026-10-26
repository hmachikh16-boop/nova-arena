import { ARENAS, HEROES, HERO_ORDER, RARITIES, arenaById, rarityOf } from './data.js';
import {
  getQuestEntries,
  getState,
  claimQuest,
  selectArena,
  selectHero,
  setSoundEnabled,
  totalTrophies,
  updatePlayerName,
} from './store.js';
import { icon, mapThumb, portrait, roleIcon } from './art.js';
import { audio } from './audio.js';
import { MatchController } from './match-ui.js';

const dom = {};
const numberFormat = new Intl.NumberFormat('en-US');

function cacheDom() {
  const ids = [
    'lobbyScreen', 'rosterScreen', 'missionsScreen', 'matchScreen',
    'profileChip', 'profileInitial', 'profileName', 'lobbyTrophyCount',
    'profileLevel', 'profileXpBar', 'profileXpText', 'rankTier',
    'clubChip', 'openShopBtn', 'openEventsBtn', 'openFriendsBtn',
    'coinValue', 'gemValue', 'soundToggle', 'coinIcon', 'gemIcon',
    'openRoster', 'openQuests', 'questDot', 'fullscreenBtn',
    'lobbyMenuButton', 'lobbyMenu', 'menuProfile', 'menuQuests', 'menuHelp', 'menuFullscreen',
    'questCard', 'lobbyQuestCount', 'lobbyQuestFill', 'lobbyQuestDots', 'lobbyQuestReady',
    'seasonLevel', 'seasonXpBar', 'seasonXpText', 'mapTimer',
    'heroShowcase', 'showcaseAura', 'heroPortrait', 'heroRarityChip',
    'heroLatin', 'heroName', 'heroTitleText', 'heroRole', 'heroDesc',
    'heroBarMain', 'heroBarChange', 'heroBarTrophies', 'heroBarPower',
    'heroBarRarity', 'heroBarName', 'heroBarTitle', 'heroBarRole',
    'statHpBar', 'statHpValue', 'statDamageBar', 'statDamageValue',
    'statSpeedBar', 'statSpeedValue', 'superIcon', 'superName', 'superDesc',
    'superCard', 'heroTip', 'mapThumb', 'mapCard', 'mapName', 'mapBadge',
    'heroCarousel', 'playButton', 'playHeroName', 'lobbyHeroCount',
    'heroDetailsOpen', 'heroDetailsOverlay', 'heroDetailsClose', 'heroDetailsPlay',
    'heroDetailsSelect', 'heroModalPortrait', 'heroModalAura', 'heroModalName',
    'heroModalTitle', 'heroModalLatin', 'heroModalRole', 'heroModalRarity',
    'openProfileBtn', 'openMapBtn', 'openHelpBtn',
    'helpOverlay', 'helpClose', 'helpPlay',
    'rosterBack', 'rosterGrid', 'filterChips', 'rosterDetail',
    'rosterTrophies', 'rosterGems',
    'missionsBack', 'questList', 'questsSummary', 'questsReset',
    'toastLayer',
  ];
  for (const id of ids) dom[id] = document.getElementById(id);
}

const state = () => getState();
let selectedHeroId = getState().selectedHero;
let rosterSelectedId = selectedHeroId;
let selectedArenaId = getState().selectedArena || ARENAS[0].id;
let profileOverlay = null;
let mapPickerOverlay = null;
let switchToken = 0;

function formatNumber(value) {
  return numberFormat.format(Math.round(Number(value) || 0));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function formatDuration(hours, minutes) {
  if (hours > 0) return `${hours}س ${minutes}د`;
  return `${minutes}د`;
}

function showToast(message, options = {}) {
  if (!dom.toastLayer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${options.tone ? `toast-${options.tone}` : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${options.icon || icon('info')}</span>
    <span class="toast-copy">${escapeHtml(message)}</span>
  `;
  dom.toastLayer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  const duration = options.duration || 2600;
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 240);
  }, duration);
}

function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}

function syncSoundUI() {
  const enabled = audio.isEnabled();
  if (dom.soundToggle) {
    dom.soundToggle.innerHTML = icon(enabled ? 'soundOn' : 'soundOff');
    dom.soundToggle.classList.toggle('is-muted', !enabled);
    dom.soundToggle.setAttribute('aria-label', enabled ? 'إيقاف الصوت' : 'تشغيل الصوت');
    dom.soundToggle.title = enabled ? 'الصوت مفعّل' : 'الصوت مكتوم';
  }
  const pauseButton = document.getElementById('pauseSoundToggle');
  const pauseLabel = document.getElementById('pauseSoundLabel');
  if (pauseButton) {
    pauseButton.innerHTML = `${icon(enabled ? 'soundOn' : 'soundOff')} <span id="pauseSoundLabel">${enabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>`;
  }
  if (pauseLabel) pauseLabel.textContent = enabled ? 'الصوت مفعّل' : 'الصوت مكتوم';
}

function toggleSound() {
  const enabled = !audio.isEnabled();
  audio.setEnabled(enabled);
  setSoundEnabled(enabled);
  audio.play(enabled ? 'click' : 'tick');
  syncSoundUI();
  matchController?.syncSound();
  showToast(enabled ? 'تم تشغيل الصوت' : 'تم كتم الصوت', {
    icon: icon(enabled ? 'soundOn' : 'soundOff'),
    tone: enabled ? 'cyan' : 'neutral',
    duration: 1600,
  });
}

function rankFor(total) {
  if (total >= 2000) return { name: 'أسطوري', color: '#b574ff' };
  if (total >= 1200) return { name: 'بلاتيني', color: '#8ff4ff' };
  if (total >= 700) return { name: 'ذهبي', color: '#ffd33d' };
  if (total >= 300) return { name: 'فضي', color: '#d9e4ff' };
  if (total >= 100) return { name: 'برونزي', color: '#ffb16d' };
  return { name: 'مبتدئ', color: '#8fffc3' };
}

function refreshMapTimer() {
  if (!dom.mapTimer) return;
  dom.mapTimer.textContent = `${ARENAS.length} خرائط`;
}

function refreshHeader() {
  const current = state();
  const hero = HEROES[current.selectedHero] || HEROES.nova;
  const playerName = current.player.name;
  const total = totalTrophies();
  const levelSize = 80;
  const level = 1 + Math.floor(total / levelSize);
  const xp = total % levelSize;
  const rank = rankFor(total);
  const heroTrophies = current.trophies[hero.id] || 0;
  const heroPower = 1 + Math.min(10, Math.floor(heroTrophies / 40));
  if (dom.profileInitial) dom.profileInitial.textContent = playerName.trim().charAt(0) || 'ن';
  if (dom.profileName) dom.profileName.textContent = playerName;
  if (dom.profileLevel) dom.profileLevel.textContent = String(level);
  if (dom.seasonLevel) dom.seasonLevel.textContent = String(level);
  if (dom.profileXpBar) dom.profileXpBar.style.width = `${Math.max(4, (xp / levelSize) * 100)}%`;
  if (dom.seasonXpBar) dom.seasonXpBar.style.width = `${Math.max(4, (xp / levelSize) * 100)}%`;
  if (dom.profileXpText) dom.profileXpText.textContent = `${formatNumber(xp)} / ${levelSize}`;
  if (dom.seasonXpText) dom.seasonXpText.textContent = `${formatNumber(xp)} / ${levelSize} XP`;
  if (dom.lobbyTrophyCount) dom.lobbyTrophyCount.textContent = formatNumber(total);
  if (dom.heroBarTrophies) dom.heroBarTrophies.textContent = formatNumber(heroTrophies);
  if (dom.heroBarPower) dom.heroBarPower.textContent = String(heroPower);
  refreshMapTimer();
  if (dom.rankTier) {
    dom.rankTier.textContent = rank.name;
    dom.rankTier.style.color = rank.color;
  }
  if (dom.coinValue) dom.coinValue.textContent = formatNumber(current.currency.coins);
  if (dom.gemValue) dom.gemValue.textContent = formatNumber(current.currency.gems);
  if (dom.rosterTrophies) dom.rosterTrophies.textContent = formatNumber(total);
  if (dom.rosterGems) dom.rosterGems.textContent = formatNumber(current.currency.gems);
  if (dom.coinIcon && !dom.coinIcon.innerHTML) dom.coinIcon.innerHTML = icon('coin');
  if (dom.gemIcon && !dom.gemIcon.innerHTML) dom.gemIcon.innerHTML = icon('gem');
  if (dom.lobbyScreen) {
    dom.lobbyScreen.style.setProperty('--hero', hero.color);
    dom.lobbyScreen.style.setProperty('--hero-2', hero.color2);
    dom.lobbyScreen.style.setProperty('--hero-dark', hero.dark);
  }
  refreshQuestDot();
  refreshLobbyQuests();
}

function refreshLobbyQuests() {
  if (!dom.questList && !dom.lobbyQuestCount) return;
  const quests = getQuestEntries();
  const completed = quests.filter((quest) => quest.complete).length;
  const claimable = quests.filter((quest) => quest.complete && !quest.claimed).length;
  const progress = quests.reduce((sum, quest) => {
    const share = Math.min(1, quest.progress / Math.max(1, quest.target));
    return sum + (quest.claimed ? 1 : share);
  }, 0) / Math.max(1, quests.length);
  if (dom.lobbyQuestCount) dom.lobbyQuestCount.textContent = `${completed} / ${quests.length}`;
  if (dom.lobbyQuestFill) dom.lobbyQuestFill.style.width = `${Math.max(2, progress * 100)}%`;
  if (dom.lobbyQuestDots) {
    dom.lobbyQuestDots.innerHTML = quests.map((quest) => {
      const stateClass = quest.claimed ? 'is-claimed' : quest.complete ? 'is-complete' : '';
      const title = quest.claimed ? `${quest.title} — تم الاستلام` : quest.complete ? `${quest.title} — جاهزة` : quest.title;
      return `<span class="la-quest-dot ${stateClass}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${icon(quest.icon)}</span>`;
    }).join('');
  }
  if (dom.lobbyQuestReady) dom.lobbyQuestReady.classList.toggle('is-hidden', claimable === 0);
  if (dom.questCard) dom.questCard.classList.toggle('has-ready', claimable > 0);
}


function refreshQuestDot() {
  if (!dom.questDot) return;
  const claimable = getQuestEntries().some((quest) => quest.complete && !quest.claimed);
  dom.questDot.classList.toggle('is-hidden', !claimable);
}

function superIconName(type) {
  return {
    quake: 'zap',
    beam: 'crosshair',
    heal: 'heart',
    dash: 'sword',
  }[type] || 'bolt';
}

function renderHome(animate = false) {
  const current = state();
  const hero = HEROES[selectedHeroId] || HEROES.nova;
  const rarity = rarityOf(hero);
  if (dom.lobbyScreen) {
    dom.lobbyScreen.style.setProperty('--hero', hero.color);
    dom.lobbyScreen.style.setProperty('--hero-2', hero.color2);
    dom.lobbyScreen.style.setProperty('--hero-dark', hero.dark);
  }

  const paintPortrait = () => {
    if (!dom.heroPortrait) return;
    dom.heroPortrait.innerHTML = portrait(hero.id, {
      uid: `showcase-${hero.id}-${Date.now()}`,
      background: false,
      className: 'showcase-svg',
    });
    dom.heroPortrait.classList.remove('is-switching');
  };

  if (animate) {
    switchToken += 1;
    const token = switchToken;
    dom.heroPortrait?.classList.add('is-switching');
    window.setTimeout(() => {
      if (token === switchToken) paintPortrait();
    }, 140);
  } else {
    paintPortrait();
  }

  if (dom.heroRarityChip) {
    dom.heroRarityChip.textContent = rarity.name;
    dom.heroRarityChip.style.color = rarity.color;
  }
  if (dom.heroLatin) dom.heroLatin.textContent = hero.latin;
  if (dom.heroName) dom.heroName.textContent = hero.name;
  if (dom.heroTitleText) dom.heroTitleText.textContent = hero.title;
  if (dom.heroRole) {
    dom.heroRole.innerHTML = `<span class="role-badge">${roleIcon(hero.roleKey)}</span><span>${hero.role}</span>`;
  }
  if (dom.heroBarName) dom.heroBarName.textContent = hero.name;
  if (dom.heroBarTitle) dom.heroBarTitle.textContent = hero.title;
  if (dom.heroBarRarity) {
    dom.heroBarRarity.textContent = rarity.name;
    dom.heroBarRarity.style.color = rarity.color;
  }
  if (dom.heroBarRole) {
    dom.heroBarRole.innerHTML = `<span class="role-badge">${roleIcon(hero.roleKey)}</span><span>${hero.role}</span>`;
  }
  if (dom.heroDesc) dom.heroDesc.textContent = hero.desc;
  if (dom.heroTip) dom.heroTip.textContent = hero.tip;

  const damage = hero.attack.damage * hero.attack.count;
  const stats = [
    [dom.statHpBar, dom.statHpValue, hero.hp, 6400, formatNumber(hero.hp)],
    [dom.statDamageBar, dom.statDamageValue, damage, 1600, formatNumber(damage)],
    [dom.statSpeedBar, dom.statSpeedValue, hero.speed, 270, formatNumber(hero.speed)],
  ];
  for (const [bar, value, raw, maximum, label] of stats) {
    if (bar) bar.style.width = `${Math.max(8, Math.min(100, (raw / maximum) * 100))}%`;
    if (value) value.textContent = label;
  }

  if (dom.superIcon) dom.superIcon.innerHTML = icon(superIconName(hero.super.type));
  if (dom.superName) dom.superName.textContent = hero.super.name;
  if (dom.superDesc) dom.superDesc.textContent = hero.super.brief;
  if (dom.playHeroName) dom.playHeroName.textContent = hero.name;
  if (dom.heroDetailsOverlay?.classList.contains('is-visible')) renderHeroModal(hero);

  if (dom.heroCarousel) {
    dom.heroCarousel.innerHTML = HERO_ORDER.map((id) => {
      const entry = HEROES[id];
      const entryRarity = rarityOf(entry);
      const trophies = state().trophies[id] || 0;
      return `
        <button
          class="brawler-card ${id === selectedHeroId ? 'is-selected' : ''}"
          type="button"
          data-hero-id="${id}"
          role="option"
          aria-selected="${id === selectedHeroId}"
          style="--card-hero:${entry.color};--card-hero2:${entry.color2}"
          title="${escapeHtml(entry.name)} — ${escapeHtml(entry.role)}"
        >
          <span class="brawler-card-art">${portrait(id, { uid: `card-${id}-${Date.now()}`, background: true, bust: true })}</span>
          <span class="brawler-card-trophy">${formatNumber(trophies)}</span>
          <span class="brawler-card-info">
            <small>${entry.role} · ${entryRarity.name}</small>
            <b>${entry.name}</b>
          </span>
        </button>
      `;
    }).join('');
  }
  if (dom.lobbyHeroCount) dom.lobbyHeroCount.textContent = `${HERO_ORDER.length} أبطال`;
  refreshHeader();
}

function renderMapCard(arena = arenaById(selectedArenaId)) {
  if (dom.mapThumb) dom.mapThumb.innerHTML = mapThumb(arena);
  if (dom.mapName) dom.mapName.textContent = arena.name;
  if (dom.mapBadge) dom.mapBadge.textContent = arena.badge;
  if (dom.mapTimer) dom.mapTimer.textContent = `${ARENAS.length} خرائط`;
  if (dom.mapCard) {
    dom.mapCard.setAttribute('aria-label', `اختيار الخريطة — ${arena.name}`);
    dom.mapCard.style.setProperty('--map-accent', arena.palette.mine);
    dom.mapCard.style.setProperty('--map-edge', arena.palette.wallEdge);
  }
}

function mapPickerCard(arena) {
  const selected = arena.id === selectedArenaId;
  return `
    <button class="map-pick-card ${selected ? 'is-selected' : ''}" type="button" data-map-id="${arena.id}" aria-pressed="${selected}" style="--map-accent:${arena.palette.mine};--map-ground:${arena.palette.ground};--map-edge:${arena.palette.wallEdge}">
      <span class="map-pick-thumb">
        ${mapThumb(arena)}
        <span class="map-pick-badge">${escapeHtml(arena.badge)}</span>
        <span class="map-pick-check">${icon('check')}</span>
      </span>
      <span class="map-pick-copy">
        <b>${escapeHtml(arena.name)}</b>
        <small>${escapeHtml(arena.subtitle)}</small>
        <span class="map-pick-desc">${escapeHtml(arena.description)}</span>
      </span>
    </button>
  `;
}

function paintMapPicker() {
  if (!mapPickerOverlay) return;
  const grid = mapPickerOverlay.querySelector('#mapPickerGrid');
  const summary = mapPickerOverlay.querySelector('#mapPickerSummary');
  const arena = arenaById(selectedArenaId);
  if (grid) grid.innerHTML = ARENAS.map(mapPickerCard).join('');
  if (summary) {
    summary.innerHTML = `
      <span class="map-pick-summary-icon">${icon('map')}</span>
      <span class="map-pick-summary-copy">
        <b>${escapeHtml(arena.name)} <em>${escapeHtml(arena.badge)}</em></b>
        <small>${escapeHtml(arena.description)}</small>
      </span>
    `;
  }
}

function openMapPicker() {
  if (mapPickerOverlay) return;
  mapPickerOverlay = document.createElement('div');
  mapPickerOverlay.className = 'modal-layer map-picker-layer';
  mapPickerOverlay.id = 'mapPickerOverlay';
  mapPickerOverlay.innerHTML = `
    <div class="modal-backdrop" data-map-close></div>
    <section class="map-picker-panel" role="dialog" aria-modal="true" aria-labelledby="mapPickerTitle">
      <button class="modal-close" type="button" data-map-close aria-label="إغلاق">${icon('close')}</button>
      <header class="map-picker-head">
        <span class="map-picker-kicker">${icon('map')} ساحات نوفا</span>
        <h2 id="mapPickerTitle">اختر خريطتك</h2>
        <p>خمس ساحات أصلية بتصاميم وأجواء مختلفة. اختر الساحة التي تناسب أسلوبك ثم انطلق إلى المعركة.</p>
      </header>
      <div class="map-picker-grid" id="mapPickerGrid" aria-label="قائمة الخرائط"></div>
      <footer class="map-picker-foot">
        <div class="map-pick-summary" id="mapPickerSummary"></div>
        <div class="map-picker-actions">
          <span class="map-picker-mode"><i class="la-mode-gem"></i> جمع الجواهر · 3 ضد 3</span>
          <button class="map-picker-play" id="mapPickerPlay" type="button">
            ${icon('play')} ابدأ المعركة
          </button>
        </div>
      </footer>
    </section>
  `;
  document.getElementById('app').appendChild(mapPickerOverlay);
  paintMapPicker();
  requestAnimationFrame(() => mapPickerOverlay?.classList.add('is-visible'));
  mapPickerOverlay.addEventListener('click', (event) => {
    if (event.target.closest('[data-map-close]')) {
      closeMapPicker();
      return;
    }
    const card = event.target.closest('[data-map-id]');
    if (card) {
      const arenaId = card.dataset.mapId;
      if (arenaId && arenaId !== selectedArenaId) {
        selectedArenaId = arenaId;
        selectArena(arenaId);
        audio.play('click');
        renderMapCard();
        paintMapPicker();
        const summary = mapPickerOverlay.querySelector('#mapPickerSummary');
        summary?.animate(
          [{ transform: 'translateY(6px)', opacity: 0.35 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 180, easing: 'ease-out' },
        );
      }
      return;
    }
    if (event.target.closest('#mapPickerPlay')) {
      closeMapPicker();
      matchController.start(selectedHeroId, state().player.name, selectedArenaId);
    }
  });
}

function closeMapPicker() {
  if (!mapPickerOverlay) return;
  const overlay = mapPickerOverlay;
  mapPickerOverlay = null;
  overlay.classList.remove('is-visible');
  window.setTimeout(() => overlay.remove(), 230);
}

function selectHeroById(heroId, options = {}) {
  if (!HEROES[heroId]) return;
  selectedHeroId = heroId;
  rosterSelectedId = heroId;
  selectHero(heroId);
  audio.play('click');
  renderHome(true);
  if (dom.rosterScreen && !dom.rosterScreen.classList.contains('is-hidden')) renderRoster();
  if (options.toast) {
    showToast(`تم اختيار ${HEROES[heroId].name}`, {
      icon: roleIcon(HEROES[heroId].roleKey),
      tone: 'gold',
      duration: 1600,
    });
  }
}

let heroCloseTimer = null;
let helpCloseTimer = null;

function renderHeroModal(hero = HEROES[selectedHeroId] || HEROES.nova) {
  if (!dom.heroDetailsOverlay) return;
  const rarity = rarityOf(hero);
  const damage = hero.attack.damage * hero.attack.count;
  dom.heroDetailsOverlay.style.setProperty('--hero', hero.color);
  dom.heroDetailsOverlay.style.setProperty('--hero-2', hero.color2);
  if (dom.heroModalPortrait) {
    dom.heroModalPortrait.innerHTML = portrait(hero.id, {
      uid: `hero-modal-${hero.id}-${Date.now()}`,
      background: false,
      className: 'modal-hero-svg',
    });
  }
  if (dom.heroModalRarity) {
    dom.heroModalRarity.textContent = rarity.name;
    dom.heroModalRarity.style.color = rarity.color;
  }
  if (dom.heroModalName) dom.heroModalName.textContent = hero.name;
  if (dom.heroModalTitle) dom.heroModalTitle.textContent = hero.title;
  if (dom.heroModalLatin) dom.heroModalLatin.textContent = hero.latin;
  if (dom.heroModalRole) {
    dom.heroModalRole.innerHTML = `<span class="role-badge">${roleIcon(hero.roleKey)}</span><span>${hero.role}</span>`;
  }
  if (dom.heroDesc) dom.heroDesc.textContent = hero.desc;
  if (dom.heroTip) dom.heroTip.textContent = hero.tip;
  const stats = [
    [dom.statHpBar, dom.statHpValue, hero.hp, 6400, formatNumber(hero.hp)],
    [dom.statDamageBar, dom.statDamageValue, damage, 1600, formatNumber(damage)],
    [dom.statSpeedBar, dom.statSpeedValue, hero.speed, 270, formatNumber(hero.speed)],
  ];
  for (const [bar, value, raw, maximum, label] of stats) {
    if (bar) bar.style.width = `${Math.max(8, Math.min(100, (raw / maximum) * 100))}%`;
    if (value) value.textContent = label;
  }
  if (dom.superIcon) dom.superIcon.innerHTML = icon(superIconName(hero.super.type));
  if (dom.superName) dom.superName.textContent = hero.super.name;
  if (dom.superDesc) dom.superDesc.textContent = hero.super.brief;
  if (dom.heroDetailsSelect) {
    dom.heroDetailsSelect.disabled = true;
    dom.heroDetailsSelect.innerHTML = `${icon('check')} البطل المختار`;
  }
}

function openHeroDetails() {
  if (!dom.heroDetailsOverlay) return;
  if (heroCloseTimer) {
    window.clearTimeout(heroCloseTimer);
    heroCloseTimer = null;
  }
  renderHeroModal(HEROES[selectedHeroId] || HEROES.nova);
  dom.heroDetailsOverlay.classList.remove('is-hidden');
  requestAnimationFrame(() => dom.heroDetailsOverlay.classList.add('is-visible'));
  audio.play('click');
}

function closeHeroDetails(immediate = false) {
  if (!dom.heroDetailsOverlay) return;
  dom.heroDetailsOverlay.classList.remove('is-visible');
  if (heroCloseTimer) window.clearTimeout(heroCloseTimer);
  if (immediate) {
    dom.heroDetailsOverlay.classList.add('is-hidden');
    return;
  }
  heroCloseTimer = window.setTimeout(() => {
    if (!dom.heroDetailsOverlay.classList.contains('is-visible')) {
      dom.heroDetailsOverlay.classList.add('is-hidden');
    }
    heroCloseTimer = null;
  }, 240);
}

function setLobbyMenu(open) {
  if (!dom.lobbyMenu || !dom.lobbyMenuButton) return;
  dom.lobbyMenu.classList.toggle('is-hidden', !open);
  dom.lobbyMenuButton.setAttribute('aria-expanded', String(open));
}

function openHelp() {
  if (!dom.helpOverlay) return;
  if (helpCloseTimer) {
    window.clearTimeout(helpCloseTimer);
    helpCloseTimer = null;
  }
  setLobbyMenu(false);
  dom.helpOverlay.classList.remove('is-hidden');
  requestAnimationFrame(() => dom.helpOverlay.classList.add('is-visible'));
  audio.play('click');
}

function closeHelp(immediate = false) {
  if (!dom.helpOverlay) return;
  dom.helpOverlay.classList.remove('is-visible');
  if (helpCloseTimer) window.clearTimeout(helpCloseTimer);
  if (immediate) {
    dom.helpOverlay.classList.add('is-hidden');
    return;
  }
  helpCloseTimer = window.setTimeout(() => {
    if (!dom.helpOverlay.classList.contains('is-visible')) {
      dom.helpOverlay.classList.add('is-hidden');
    }
    helpCloseTimer = null;
  }, 240);
}


function renderRoster() {
  if (!dom.rosterGrid || !dom.rosterDetail) return;
  const current = state();
  const selected = HEROES[rosterSelectedId] || HEROES.nova;
  const rarity = rarityOf(selected);
  dom.rosterDetail.style.setProperty('--hero', selected.color);
  dom.rosterDetail.style.setProperty('--hero-2', selected.color2);
  dom.rosterDetail.style.setProperty('--rarity', rarity.color);

  if (dom.filterChips) {
    const seenRoles = new Set();
    const roleEntries = HERO_ORDER.map((id) => HEROES[id]).filter((hero) => {
      if (seenRoles.has(hero.roleKey)) return false;
      seenRoles.add(hero.roleKey);
      return true;
    });
    dom.filterChips.innerHTML = roleEntries.map((hero) => {
      return `
        <button class="filter-chip ${hero.roleKey === selected.roleKey ? 'is-active' : ''}" type="button" data-role="${hero.roleKey}">
          ${roleIcon(hero.roleKey)}
          <span>${hero.role}</span>
        </button>
      `;
    }).join('');
  }

  dom.rosterGrid.innerHTML = HERO_ORDER.map((id) => {
    const hero = HEROES[id];
    const heroRarity = rarityOf(hero);
    const trophies = current.trophies[id] || 0;
    return `
      <button
        class="roster-card ${id === rosterSelectedId ? 'is-selected' : ''}"
        type="button"
        data-roster-hero="${id}"
        style="--hero:${hero.color};--hero-2:${hero.color2};--rarity:${heroRarity.color}"
        aria-pressed="${id === rosterSelectedId}"
      >
        <span class="roster-card-art">${portrait(id, { uid: `roster-card-${id}-${Date.now()}`, background: false, bust: true })}</span>
        <span class="roster-card-shade"></span>
        <span class="roster-card-rarity">${heroRarity.name}</span>
        <span class="roster-card-trophies">${icon('trophy')}<b>${formatNumber(trophies)}</b></span>
        <span class="roster-card-copy">
          <small>${hero.role}</small>
          <strong>${hero.name}</strong>
          <em>${hero.latin}</em>
        </span>
        ${id === rosterSelectedId ? `<span class="roster-card-check">${icon('check')}</span>` : ''}
      </button>
    `;
  }).join('');

  dom.rosterDetail.innerHTML = `
    <div class="roster-detail-art">
      <div class="roster-detail-glow"></div>
      ${portrait(selected.id, { uid: `roster-detail-${selected.id}-${Date.now()}`, background: false })}
      <div class="roster-detail-name">
        <span style="color:${rarity.color}">${rarity.name} · ${selected.role}</span>
        <h2>${selected.name}</h2>
        <p>${selected.latin} — ${selected.title}</p>
      </div>
    </div>
    <div class="roster-detail-body">
      <p class="roster-detail-desc">${selected.desc}</p>
      <div class="roster-mini-stats">
        <span>${icon('heart')}<b>${formatNumber(selected.hp)}</b><small>صحة</small></span>
        <span>${icon('sword')}<b>${formatNumber(selected.attack.damage * selected.attack.count)}</b><small>ضرر</small></span>
        <span>${icon('speed')}<b>${formatNumber(selected.speed)}</b><small>سرعة</small></span>
      </div>
      <div class="roster-super">
        <span class="roster-super-icon">${icon(superIconName(selected.super.type))}</span>
        <div>
          <small>قدرة السوبر</small>
          <b>${selected.super.name}</b>
          <p>${selected.super.brief}</p>
        </div>
      </div>
      <div class="roster-detail-actions">
        <button class="primary-action small" id="rosterPlayButton" type="button" data-roster-action="play">
          ${icon('play')} العب بهذا البطل
        </button>
        <button class="secondary-action small" id="rosterSelectButton" type="button" data-roster-action="select" ${selectedHeroId === selected.id ? 'disabled' : ''}>
          ${selectedHeroId === selected.id ? `${icon('check')} البطل المختار` : `${icon('star')} اختر البطل`}
        </button>
      </div>
    </div>
  `;
}

function questRewardMarkup(quest) {
  const parts = [];
  if (quest.reward.coins) parts.push(`<span class="reward-coin">${icon('coin')} ${formatNumber(quest.reward.coins)}</span>`);
  if (quest.reward.gems) parts.push(`<span class="reward-gem">${icon('gem')} ${formatNumber(quest.reward.gems)}</span>`);
  return parts.join('');
}

function renderQuests() {
  if (!dom.questList) return;
  const quests = getQuestEntries();
  const completed = quests.filter((quest) => quest.complete).length;
  const claimed = quests.filter((quest) => quest.claimed).length;
  const claimable = quests.filter((quest) => quest.complete && !quest.claimed).length;

  if (dom.questsSummary) {
    dom.questsSummary.innerHTML = `
      <div class="summary-ring" style="--quest-progress:${(claimed / quests.length) * 360}deg">
        <span><b>${claimed}</b><small>من ${quests.length}</small></span>
      </div>
      <div class="summary-copy">
        <b>${completed === quests.length ? 'أنجزت كل مهام اليوم!' : 'واصل التقدم'}</b>
        <span>${claimable > 0 ? `${claimable} ${claimable === 1 ? 'مكافأة' : 'مكافآت'} جاهزة للاستلام` : `${completed} من ${quests.length} مكتملة`}</span>
      </div>
    `;
  }

  dom.questList.innerHTML = quests.map((quest) => {
    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
    let button;
    if (quest.claimed) {
      button = `<button class="claim-button is-claimed" type="button" disabled>${icon('check')} تم الاستلام</button>`;
    } else if (quest.complete) {
      button = `<button class="claim-button is-ready" type="button" data-quest-id="${quest.id}">${icon('gem')} استلام</button>`;
    } else {
      button = `<button class="claim-button" type="button" disabled>${icon('lock')} قيد التقدم</button>`;
    }
    return `
      <article class="quest-card quest-${quest.tone} ${quest.complete ? 'is-complete' : ''} ${quest.claimed ? 'is-claimed' : ''}">
        <span class="quest-emblem">${icon(quest.icon)}</span>
        <div class="quest-body">
          <div class="quest-top">
            <div>
              <h3>${quest.title}</h3>
              <p>${quest.description}</p>
            </div>
            <div class="quest-reward">${questRewardMarkup(quest)}</div>
          </div>
          <div class="quest-progress-row">
            <div class="quest-progress"><i style="width:${percent}%"></i></div>
            <span>${formatNumber(quest.progress)} / ${formatNumber(quest.target)}</span>
          </div>
        </div>
        <div class="quest-action">${button}</div>
      </article>
    `;
  }).join('');

  refreshResetTimer();
  refreshQuestDot();
  refreshLobbyQuests();
}

function refreshResetTimer() {
  if (!dom.questsReset) return;
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const minutes = Math.max(1, Math.round((next - now) / 60000));
  dom.questsReset.textContent = formatDuration(Math.floor(minutes / 60), minutes % 60);
}

function showScreen(id) {
  const screens = [dom.lobbyScreen, dom.rosterScreen, dom.missionsScreen, dom.matchScreen];
  for (const screen of screens) {
    if (!screen) continue;
    screen.classList.toggle('is-hidden', screen.id !== id);
  }
  document.body.classList.toggle('in-match', id === 'matchScreen');
}

function goLobby() {
  if (matchController?.isActive) matchController.returnHome(false);
  showScreen('lobbyScreen');
  renderHome();
  refreshHeader();
}

function openRoster() {
  rosterSelectedId = selectedHeroId;
  showScreen('rosterScreen');
  renderRoster();
  audio.play('click');
}

function openMissions() {
  showScreen('missionsScreen');
  renderQuests();
  audio.play('click');
}

function openProfile() {
  if (profileOverlay) return;
  const current = state();
  const hero = HEROES[current.selectedHero] || HEROES.nova;
  profileOverlay = document.createElement('div');
  profileOverlay.className = 'modal-layer profile-layer';
  profileOverlay.id = 'profileOverlay';
  profileOverlay.innerHTML = `
    <div class="modal-backdrop" data-profile-close></div>
    <section class="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
      <button class="modal-close" type="button" data-profile-close aria-label="إغلاق">${icon('close')}</button>
      <span class="modal-kicker">ملف اللاعب</span>
      <h2 id="profileTitle">قائد نوفا</h2>
      <div class="profile-stats-line">
        <span>${icon('trophy')} <b>${formatNumber(totalTrophies())}</b> كأس</span>
        <span>${icon('users3')} <b>${formatNumber(current.stats.matches)}</b> مباراة</span>
        <span>${icon('crown')} <b>${formatNumber(current.stats.wins)}</b> انتصار</span>
      </div>
      <label class="profile-name-field">
        <span>اسم اللاعب</span>
        <input id="playerNameInput" type="text" maxlength="22" value="${escapeHtml(current.player.name)}" autocomplete="off" />
      </label>
      <div class="profile-hero-line" style="--hero:${hero.color};--hero-2:${hero.color2}">
        <span class="profile-hero-glyph">${roleIcon(hero.roleKey)}</span>
        <span>بطل اليوم <b>${hero.name}</b></span>
        <small>${hero.role}</small>
      </div>
      <div class="profile-actions">
        <button class="primary-action" type="button" id="saveProfileButton">${icon('check')} حفظ التغييرات</button>
        <button class="secondary-action" type="button" data-profile-close>إغلاق</button>
      </div>
    </section>
  `;
  document.getElementById('app').appendChild(profileOverlay);
  requestAnimationFrame(() => profileOverlay.classList.add('is-visible'));
  const input = profileOverlay.querySelector('#playerNameInput');
  input?.focus();
  input?.select();
  profileOverlay.addEventListener('click', (event) => {
    if (event.target.closest('[data-profile-close]')) closeProfile();
  });
  profileOverlay.querySelector('#saveProfileButton')?.addEventListener('click', () => {
    const clean = updatePlayerName(input.value);
    audio.play('claim');
    closeProfile();
    refreshHeader();
    renderQuests();
    showToast(`أهلاً ${clean}!`, { icon: icon('star'), tone: 'gold' });
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') profileOverlay.querySelector('#saveProfileButton')?.click();
  });
}

function closeProfile() {
  if (!profileOverlay) return;
  profileOverlay.classList.remove('is-visible');
  const overlay = profileOverlay;
  profileOverlay = null;
  window.setTimeout(() => overlay.remove(), 220);
}

function toggleFullscreen() {
  const element = document.documentElement;
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        showToast('تم تفعيل ملء الشاشة', { icon: icon('expand'), tone: 'cyan', duration: 1600 });
      }).catch(() => {
        showToast('ملء الشاشة غير متاح في هذا العرض', { icon: icon('info'), tone: 'neutral' });
      });
    } else {
      showToast('ملء الشاشة غير متاح في هذا العرض', { icon: icon('info'), tone: 'neutral' });
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function bindEvents() {
  dom.heroBarMain?.addEventListener('click', openHeroDetails);
  dom.heroPortrait?.addEventListener('click', openHeroDetails);
  dom.heroBarChange?.addEventListener('click', openRoster);
  dom.heroDetailsOpen?.addEventListener('click', openHeroDetails);
  dom.heroDetailsClose?.addEventListener('click', () => closeHeroDetails());
  dom.heroDetailsOverlay?.addEventListener('click', (event) => {
    if (event.target.closest('[data-hero-close]')) closeHeroDetails();
  });
  dom.heroDetailsPlay?.addEventListener('click', () => {
    closeHeroDetails(true);
    audio.play('click');
    matchController.start(selectedHeroId, state().player.name, selectedArenaId);
  });
  dom.heroDetailsSelect?.addEventListener('click', () => {
    closeHeroDetails();
    openRoster();
  });

  dom.helpClose?.addEventListener('click', () => closeHelp());
  dom.helpOverlay?.addEventListener('click', (event) => {
    if (event.target.closest('[data-help-close]')) closeHelp();
  });
  dom.helpPlay?.addEventListener('click', () => {
    closeHelp(true);
    audio.play('click');
    matchController.start(selectedHeroId, state().player.name, selectedArenaId);
  });
  dom.openHelpBtn?.addEventListener('click', openHelp);
  dom.openProfileBtn?.addEventListener('click', openProfile);
  dom.openMapBtn?.addEventListener('click', () => {
    audio.play('click');
    openMapPicker();
  });
  dom.openShopBtn?.addEventListener('click', () => {
    audio.play('click');
    showToast('المتجر يُفتح قريباً — اجمع العملات والجواهر من المهام.', {
      icon: icon('coin'),
      tone: 'gold',
      duration: 3000,
    });
  });
  dom.openEventsBtn?.addEventListener('click', () => {
    audio.play('click');
    openMissions();
  });
  dom.openFriendsBtn?.addEventListener('click', () => {
    audio.play('click');
    showToast('قائمة الأصدقاء ستصل قريباً. شارك الساحة مع فريقك!', {
      icon: icon('users'),
      tone: 'violet',
      duration: 3000,
    });
  });
  dom.clubChip?.addEventListener('click', () => {
    audio.play('click');
    showToast('فريق NOVA — 3 أعضاء. اربح المزيد من الكؤوس لترقية النادي.', {
      icon: icon('shield'),
      tone: 'cyan',
      duration: 3200,
    });
  });

  dom.lobbyMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    audio.play('click');
    setLobbyMenu(dom.lobbyMenu?.classList.contains('is-hidden'));
  });
  dom.menuProfile?.addEventListener('click', () => {
    setLobbyMenu(false);
    openProfile();
  });
  dom.menuQuests?.addEventListener('click', () => {
    setLobbyMenu(false);
    openMissions();
  });
  dom.menuHelp?.addEventListener('click', () => {
    setLobbyMenu(false);
    openHelp();
  });
  dom.menuFullscreen?.addEventListener('click', () => {
    setLobbyMenu(false);
    toggleFullscreen();
  });

  dom.heroCarousel?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-hero-id]');
    if (card) selectHeroById(card.dataset.heroId);
  });

  dom.playButton?.addEventListener('click', () => {
    audio.play('click');
    matchController.start(selectedHeroId, state().player.name, selectedArenaId);
  });

  dom.profileChip?.addEventListener('click', () => {
    audio.play('click');
    openProfile();
  });

  dom.openRoster?.addEventListener('click', openRoster);
  dom.openQuests?.addEventListener('click', openMissions);
  dom.rosterBack?.addEventListener('click', () => {
    audio.play('click');
    showScreen('lobbyScreen');
    renderHome();
  });
  dom.missionsBack?.addEventListener('click', () => {
    audio.play('click');
    showScreen('lobbyScreen');
    renderHome();
  });
  dom.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  dom.soundToggle?.addEventListener('click', toggleSound);

  dom.filterChips?.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-role]');
    if (!chip) return;
    const hero = HERO_ORDER.map((id) => HEROES[id]).find((entry) => entry.roleKey === chip.dataset.role);
    if (hero) selectHeroById(hero.id);
  });

  dom.rosterGrid?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-roster-hero]');
    if (!card) return;
    collectSelectedRoster(card.dataset.rosterHero);
  });

  dom.rosterDetail?.addEventListener('click', (event) => {
    const action = event.target.closest('[data-roster-action]')?.dataset.rosterAction;
    if (action === 'play') {
      matchController.start(rosterSelectedId, state().player.name, selectedArenaId);
    } else if (action === 'select') {
      collectSelectedRoster(rosterSelectedId, true);
    }
  });

  dom.questList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-quest-id]');
    if (!button) return;
    const result = claimQuest(button.dataset.questId);
    if (result.ok) {
      audio.play('claim');
      const parts = [];
      if (result.reward.coins) parts.push(`${formatNumber(result.reward.coins)} عملة`);
      if (result.reward.gems) parts.push(`${formatNumber(result.reward.gems)} جوهرة`);
      showToast(`حصلت على ${parts.join(' و ')}`, { icon: icon('gem'), tone: 'cyan' });
      refreshHeader();
      renderQuests();
    } else {
      audio.play('error');
      showToast('هذه المكافأة غير جاهزة بعد', { icon: icon('lock'), tone: 'danger' });
    }
  });

  dom.superCard?.addEventListener('click', () => {
    const hero = HEROES[selectedHeroId];
    audio.play('click');
    showToast(`${hero.super.name}: ${hero.super.brief}`, {
      icon: icon(superIconName(hero.super.type)),
      tone: 'violet',
      duration: 3600,
    });
  });

  dom.mapCard?.addEventListener('click', () => {
    audio.play('click');
    openMapPicker();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#lobbyMenu') && !event.target.closest('#lobbyMenuButton')) {
      setLobbyMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (mapPickerOverlay) {
      closeMapPicker();
      return;
    }
    if (profileOverlay) {
      closeProfile();
      return;
    }
    if (dom.heroDetailsOverlay?.classList.contains('is-visible')) {
      closeHeroDetails();
      return;
    }
    if (dom.helpOverlay?.classList.contains('is-visible')) {
      closeHelp();
      return;
    }
    setLobbyMenu(false);
    if (!dom.rosterScreen.classList.contains('is-hidden')) {
      showScreen('lobbyScreen');
      renderHome();
    } else if (!dom.missionsScreen.classList.contains('is-hidden')) {
      showScreen('lobbyScreen');
      renderHome();
    }
  });

  document.addEventListener('pointerdown', () => audio.unlock(), { once: true, capture: true });
  window.setInterval(() => {
    if (!dom.missionsScreen.classList.contains('is-hidden')) refreshResetTimer();
    refreshMapTimer();
  }, 30000);
}

function collectSelectedRoster(heroId, withToast = false) {
  if (!HEROES[heroId]) return;
  rosterSelectedId = heroId;
  selectedHeroId = heroId;
  selectHero(heroId);
  audio.play('click');
  renderRoster();
  renderHome();
  if (withToast) {
    showToast(`تم اختيار ${HEROES[heroId].name}`, {
      icon: icon('check'),
      tone: 'gold',
      duration: 1600,
    });
  }
}

const matchController = new MatchController({
  onHome: () => {
    showScreen('lobbyScreen');
    renderHome();
    refreshHeader();
  },
  onProgressChanged: () => {
    refreshHeader();
    renderHome();
    renderQuests();
  },
  onToggleSound: toggleSound,
  toast: showToast,
});

// Lets the standalone Android shell use the system back gesture without
// closing the app in the middle of a match. Returns true when it handled it.
window.NovaArenaAndroidBack = () => {
  if (!matchController?.isActive) return false;
  if (matchController.game?.phase === 'ended') {
    matchController.returnHome();
    return true;
  }
  if (matchController.paused) matchController.resume();
  else matchController.pause();
  return true;
};

function init() {
  cacheDom();
  injectIcons();
  const current = state();
  selectedHeroId = current.selectedHero;
  rosterSelectedId = selectedHeroId;
  audio.setEnabled(current.settings.sound);
  syncSoundUI();
  selectedArenaId = current.selectedArena || ARENAS[0].id;
  const params = new URLSearchParams(window.location.search);
  const previewArena = params.get('arena');
  if (previewArena && ARENAS.some((arena) => arena.id === previewArena)) {
    selectedArenaId = previewArena;
    selectArena(previewArena);
  }
  renderMapCard();
  renderHome();
  renderRoster();
  renderQuests();
  refreshHeader();
  bindEvents();
  showScreen('lobbyScreen');
  if (params.get('maps') === '1') {
    openMapPicker();
  }
  if (params.get('play') === '1') {
    window.setTimeout(() => {
      matchController.start(selectedHeroId, state().player.name, selectedArenaId);
    }, 500);
  }
}

init();
