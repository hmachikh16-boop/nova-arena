import { HEROES, arenaById, rarityOf } from './data.js';
import { getState, recordMatch } from './store.js';
import { icon, portrait } from './art.js';
import { audio } from './audio.js';
import { ArenaGame } from './game/engine.js';

const numberFormat = new Intl.NumberFormat('en-US');
const formatNumber = (value) => numberFormat.format(Math.round(Number(value) || 0));
const formatTime = (seconds) => {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};
const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const SUPER_ICON = {
  quake: 'zap',
  beam: 'crosshair',
  heal: 'heart',
  dash: 'sword',
};

const $ = (id) => document.getElementById(id);

export class MatchController {
  constructor(options = {}) {
    this.options = options;
    this.game = null;
    this.isActive = false;
    this.paused = false;
    this.recorded = false;
    this.heroId = 'nova';
    this.playerName = 'قائد نوفا';
    this.touchMode = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    this.timeouts = new Set();
    this.lastHud = null;
    this.lastScores = { ally: 0, enemy: 0 };
    this.faceSignatures = { ally: '', enemy: '' };
    this.killFeedTimers = new Set();
    this.stickState = new Map();
    this.shooting = false;
    this.attackHeld = false;
    this.aimHeld = false;
    this.boundPointerUp = (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return;
      this.stopMouseShooting();
    };
    this.cacheDom();
    this.bindStaticEvents();
    this.setupJoysticks();
  }

  cacheDom() {
    this.screens = {
      lobby: $('lobbyScreen'),
      roster: $('rosterScreen'),
      missions: $('missionsScreen'),
      match: $('matchScreen'),
    };
    this.stage = $('matchStage');
    this.canvas = $('arenaCanvas');
    this.pauseButton = $('pauseButton');
    this.timer = $('matchTimer');
    this.matchMode = $('matchMode');
    this.allyScore = $('allyScore');
    this.enemyScore = $('enemyScore');
    this.allyFaces = $('allyFaces');
    this.enemyFaces = $('enemyFaces');
    this.scoreboard = $('scoreboard');
    this.allyBlock = document.querySelector('.ally-block');
    this.enemyBlock = document.querySelector('.enemy-block');
    this.overtimePill = $('overtimePill');
    this.overtimeNumber = $('overtimeNumber');
    this.objectiveHint = $('objectiveHint');
    this.killFeed = $('killFeed');
    this.centerAnnouncement = $('centerAnnouncement');
    this.countdownSplash = $('countdownSplash');
    this.countdownNumber = $('countdownNumber');
    this.respawnPanel = $('respawnPanel');
    this.respawnTime = $('respawnTime');
    this.playerCard = $('matchPlayerCard');
    this.playerAvatar = $('matchPlayerAvatar');
    this.playerNameEl = $('matchPlayerName');
    this.playerHealthText = $('matchPlayerHealthText');
    this.healthBar = $('matchHealthBar');
    this.ammoPips = [...document.querySelectorAll('#ammoPips i')];
    this.gemCount = $('matchGemCount');
    this.desktopHint = $('desktopHint');
    this.moveJoystick = $('moveJoystick');
    this.aimJoystick = $('aimJoystick');
    this.moveKnob = $('moveKnob');
    this.aimKnob = $('aimKnob');
    this.superButton = $('superButton');
    this.attackButton = $('attackButton');
    this.superIcon = $('superIconHud');
    this.pauseOverlay = $('pauseOverlay');
    this.resumeButton = $('resumeButton');
    this.exitMatchButton = $('exitMatchButton');
    this.pauseSoundToggle = $('pauseSoundToggle');
    this.resultOverlay = $('resultOverlay');
    this.resultKicker = $('resultKicker');
    this.resultTitle = $('resultTitle');
    this.resultSubtitle = $('resultSubtitle');
    this.resultScore = $('resultScore');
    this.resultStats = $('resultStats');
    this.resultRewards = $('resultRewards');
    this.resultHero = $('resultHero');
    this.resultConfetti = $('resultConfetti');
    this.rematchButton = $('rematchButton');
    this.resultHomeButton = $('resultHomeButton');
  }

  bindStaticEvents() {
    this.pauseButton?.addEventListener('click', () => this.pause());
    this.resumeButton?.addEventListener('click', () => this.resume());
    this.exitMatchButton?.addEventListener('click', () => this.returnHome());
    this.pauseSoundToggle?.addEventListener('click', () => {
      this.options.onToggleSound?.();
      this.syncSound();
    });
    this.rematchButton?.addEventListener('click', () => this.rematch());
    this.resultHomeButton?.addEventListener('click', () => this.returnHome());
    this.superButton?.addEventListener('click', () => this.fireSuper());
    this.attackButton?.addEventListener('pointerdown', (event) => this.startAttackButton(event));
    this.attackButton?.addEventListener('pointerup', (event) => this.stopAttackButton(event));
    this.attackButton?.addEventListener('pointercancel', (event) => this.stopAttackButton(event));
    this.attackButton?.addEventListener('lostpointercapture', () => this.stopAttackButton());
    this.stage?.addEventListener('contextmenu', (event) => event.preventDefault());
    this.stage?.addEventListener('pointermove', (event) => this.handleStagePointerMove(event));
    this.canvas?.addEventListener('pointerdown', (event) => this.handleStagePointerDown(event));
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
    document.addEventListener('keydown', (event) => {
      if (!this.isActive || event.key !== 'Escape') return;
      event.preventDefault();
      if (this.paused) this.resume();
      else if (this.game?.phase !== 'ended') this.pause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isActive && !this.paused && this.game?.phase !== 'ended') {
        this.pause();
      }
    });
  }

  schedule(callback, delay) {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  clearTimers() {
    for (const id of this.timeouts) window.clearTimeout(id);
    this.timeouts.clear();
    for (const id of this.killFeedTimers) window.clearTimeout(id);
    this.killFeedTimers.clear();
  }

  start(heroId, playerName, arenaId = getState().selectedArena) {
    if (!HEROES[heroId]) heroId = 'nova';
    this.disposeMatch();
    this.heroId = heroId;
    this.arenaId = arenaId || getState().selectedArena;
    this.playerName = playerName || getState().player.name || 'قائد نوفا';    this.recorded = false;
    this.isActive = true;
    this.paused = false;
    this.shooting = false;
    this.attackHeld = false;
    this.aimHeld = false;
    this.touchMode = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    document.body.classList.add('in-match');
    document.body.classList.toggle('has-touch', this.touchMode);

    for (const screen of Object.values(this.screens)) {
      screen?.classList.add('is-hidden');
    }
    this.screens.match?.classList.remove('is-hidden');
    this.resetMatchUi();
    this.syncSound();

    requestAnimationFrame(() => {
      if (!this.isActive) return;
      try {
        this.game = new ArenaGame(this.canvas, {
          heroId: this.heroId,
          arenaId: this.arenaId,
          playerName: this.playerName,
          onHud: (payload) => this.applyHud(payload),
          onEvent: (payload) => this.handleGameEvent(payload),
          onEnd: (result) => this.handleResult(result),
        });
      } catch (error) {
        console.error('Nova Arena failed to start:', error);
        this.options.toast?.('تعذر بدء المعركة. حاول مرة أخرى.', {
          icon: icon('info'),
          tone: 'danger',
        });
        this.returnHome();
      }
    });
  }

  resetMatchUi() {
    const hero = HEROES[this.heroId] || HEROES.nova;
    const arena = arenaById(this.arenaId);
    if (this.matchMode) this.matchMode.textContent = arena.name;
    this.lastHud = null;
    this.lastScores = { ally: 0, enemy: 0 };
    this.faceSignatures = { ally: '', enemy: '' };
    this.screens.match?.style.setProperty('--hero', hero.color);
    this.screens.match?.style.setProperty('--hero-2', hero.color2);

    if (this.timer) this.timer.textContent = '2:30';
    if (this.timer) this.timer.classList.remove('is-danger');
    if (this.allyScore) this.allyScore.textContent = '0';
    if (this.enemyScore) this.enemyScore.textContent = '0';
    if (this.allyFaces) this.allyFaces.innerHTML = '';
    if (this.enemyFaces) this.enemyFaces.innerHTML = '';
    if (this.allyBlock) this.allyBlock.classList.remove('is-featured');
    if (this.enemyBlock) this.enemyBlock.classList.remove('is-featured');
    if (this.overtimePill) this.overtimePill.classList.add('is-hidden');
    if (this.objectiveHint) this.objectiveHint.textContent = 'وثبّت تفوقك 15 ثانية';
    if (this.killFeed) this.killFeed.innerHTML = '';
    if (this.centerAnnouncement) {
      this.centerAnnouncement.classList.remove('is-visible');
      this.centerAnnouncement.innerHTML = '';
    }
    if (this.respawnPanel) this.respawnPanel.classList.add('is-hidden');
    if (this.countdownSplash) {
      this.countdownSplash.classList.add('is-hidden');
      this.countdownSplash.classList.remove('is-go');
    }
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.add('is-hidden');
      this.pauseOverlay.classList.remove('is-visible');
    }
    if (this.resultOverlay) {
      this.resultOverlay.classList.add('is-hidden');
      this.resultOverlay.classList.remove('is-visible', 'is-win', 'is-loss', 'is-draw');
    }
    if (this.resultConfetti) this.resultConfetti.innerHTML = '';
    if (this.playerCard) this.playerCard.classList.remove('is-dead');
    if (this.playerNameEl) this.playerNameEl.textContent = hero.name;
    if (this.playerHealthText) this.playerHealthText.textContent = formatNumber(hero.hp);
    if (this.healthBar) {
      this.healthBar.style.width = '100%';
      this.healthBar.classList.remove('is-low');
    }
    if (this.gemCount) this.gemCount.textContent = '0';
    this.ammoPips?.forEach((pip) => pip.classList.add('is-full'));
    if (this.playerAvatar) {
      this.playerAvatar.innerHTML = portrait(hero.id, {
        uid: `hud-${hero.id}-${Date.now()}`,
        background: true,
        bust: true,
      });
    }
    if (this.superIcon) this.superIcon.innerHTML = icon(SUPER_ICON[hero.super.type] || 'zap');
    if (this.superButton) {
      this.superButton.style.setProperty('--charge', '0%');
      this.superButton.classList.remove('is-ready', 'is-denied');
    }
    this.attackButton?.classList.remove('is-pressed');
    this.resetJoysticks();
  }

  applyHud(payload) {
    if (!payload || !this.isActive) return;
    this.lastHud = payload;
    const { player, phase } = payload;
    if (this.timer) {
      this.timer.textContent = formatTime(payload.timeLeft);
      this.timer.classList.toggle('is-danger', phase === 'playing' && payload.timeLeft <= 30 && payload.overtimeTeam === null);
    }

    this.updateScore(this.allyScore, payload.scores.ally, 'ally');
    this.updateScore(this.enemyScore, payload.scores.enemy, 'enemy');
    this.updateFaces(this.allyFaces, payload.allyTeam, 'ally');
    this.updateFaces(this.enemyFaces, payload.enemyTeam, 'enemy');

    if (this.overtimePill) {
      const active = payload.overtimeTeam !== null && payload.overtimeTeam !== undefined;
      this.overtimePill.classList.toggle('is-hidden', !active);
      if (active) {
        this.overtimePill.classList.toggle('is-ally', payload.overtimeTeam === 0);
        this.overtimePill.classList.toggle('is-enemy', payload.overtimeTeam === 1);
        this.overtimeNumber.textContent = Math.max(0, Math.ceil(payload.overtimeTimer));
      }
    }
    if (this.allyBlock) this.allyBlock.classList.toggle('is-featured', payload.overtimeTeam === 0);
    if (this.enemyBlock) this.enemyBlock.classList.toggle('is-featured', payload.overtimeTeam === 1);
    if (this.objectiveHint) {
      this.objectiveHint.textContent =
        payload.overtimeTeam !== null && payload.overtimeTeam !== undefined
          ? `ثبّت الجواهر ${Math.max(0, Math.ceil(payload.overtimeTimer))} ث`
          : 'وثبّت تفوقك 15 ثانية';
    }

    if (this.playerHealthText) this.playerHealthText.textContent = formatNumber(player.hp);
    if (this.healthBar) {
      const ratio = Math.max(0, Math.min(1, player.hp / player.maxHp));
      this.healthBar.style.width = `${ratio * 100}%`;
      this.healthBar.classList.toggle('is-low', ratio < 0.32);
    }
    this.ammoPips?.forEach((pip, index) => {
      pip.classList.toggle('is-full', index < player.ammo);
    });
    if (this.gemCount) this.gemCount.textContent = formatNumber(player.gems);
    this.playerCard?.classList.toggle('is-dead', !player.alive);
    this.superButton?.classList.toggle('is-ready', player.superReady && player.alive);
    this.superButton?.style.setProperty('--charge', `${Math.round(player.superCharge * 100)}%`);

    if (this.respawnPanel) {
      const showRespawn = phase === 'playing' && !player.alive;
      this.respawnPanel.classList.toggle('is-hidden', !showRespawn);
      if (showRespawn && this.respawnTime) this.respawnTime.textContent = Math.max(1, Math.ceil(player.respawn));
    }
  }

  updateScore(element, value, team) {
    if (!element) return;
    const current = Number(element.textContent) || 0;
    element.textContent = formatNumber(value);
    if (value !== current) {
      const block = team === 'ally' ? this.allyBlock : this.enemyBlock;
      if (block) {
        block.classList.remove('is-scoring');
        void block.offsetWidth;
        block.classList.add('is-scoring');
        this.schedule(() => block.classList.remove('is-scoring'), 360);
      }
    }
  }

  updateFaces(container, roster, team) {
    if (!container || !roster) return;
    const signature = roster.map((entry) => `${entry.heroId}:${entry.name}:${entry.isPlayer ? 1 : 0}`).join('|');
    if (this.faceSignatures[team] !== signature) {
      this.faceSignatures[team] = signature;
      container.innerHTML = roster
        .map((entry) => {
          const hero = HEROES[entry.heroId] || HEROES.nova;
          const status = entry.isPlayer ? 'أنت' : entry.name;
          return `
            <span class="team-face ${entry.isPlayer ? 'is-player' : ''}" data-face="${entry.heroId}"
              style="--face:${hero.color};--face-2:${hero.color2}" title="${escapeHtml(status)} — ${hero.name}">
              <span class="face-orb">${hero.name.charAt(0)}</span>
              <i class="face-gems"></i>
              ${entry.isPlayer ? '<em class="face-you">★</em>' : ''}
            </span>
          `;
        })
        .join('');
    }
    const faces = [...container.querySelectorAll('.team-face')];
    faces.forEach((face, index) => {
      const entry = roster[index];
      if (!entry) return;
      face.classList.toggle('is-down', !entry.alive);
      const badge = face.querySelector('.face-gems');
      if (badge) {
        badge.textContent = entry.gems > 0 ? formatNumber(entry.gems) : '';
        badge.classList.toggle('has-gems', entry.gems > 0);
      }
    });
  }

  handleStagePointerMove(event) {
    if (!this.game || !this.isActive || this.paused) return;
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    this.updateAimFromEvent(event);
  }

  handleStagePointerDown(event) {
    if (!this.game || !this.isActive || this.paused) return;
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    if (event.button === 2) {
      event.preventDefault();
      this.fireSuper();
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    audio.unlock();
    this.updateAimFromEvent(event);
    this.shooting = true;
    this.game.setShooting(true);
    // Click-to-shoot must feel instant instead of waiting for the next tick.
    if (this.game.player?.alive) this.game.tryAttack(this.game.player, this.game.player.aim);
  }

  updateAimFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (
      event.clientX < rect.left ||
      event.clientY < rect.top ||
      event.clientX > rect.right ||
      event.clientY > rect.bottom
    ) {
      return;
    }
    const point = this.game.screenToWorld(event.clientX, event.clientY);
    if (point.x < 0 || point.y < 0 || point.x > 1280 || point.y > 720) return;
    this.game.setAimWorld(point.x, point.y);
  }

  stopMouseShooting() {
    this.shooting = false;
    if (!this.attackHeld && !this.aimHeld) this.game?.setShooting(false);
  }

  startAttackButton(event) {
    if (!this.game || !this.isActive || this.paused) return;
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    event.stopPropagation();
    audio.unlock();
    if (this.game.phase !== 'playing') return;
    if (!this.game.player?.alive) return;
    this.attackButton?.classList.add('is-pressed');
    this.attackButton?.setPointerCapture?.(event.pointerId);
    if (!this.game.touchAim.active) this.game.aimNearestEnemy();
    this.attackHeld = true;
    this.game.setShooting(true);
    // A short tap must fire immediately; holding the button keeps auto-fire on.
    this.game.tryAttack(this.game.player, this.game.player.aim);
  }

  stopAttackButton(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.attackButton?.classList.remove('is-pressed');
    this.attackHeld = false;
    if (!this.aimHeld && !this.shooting) this.game?.setShooting(false);
  }

  setupJoysticks() {
    if (!this.moveJoystick || !this.aimJoystick) return;
    this.attachJoystick({
      element: this.moveJoystick,
      knob: this.moveKnob,
      onStart: () => {
        this.game?.setTouchMove(0, 0, true);
      },
      onMove: (x, y, magnitude) => {
        this.game?.setTouchMove(x * magnitude, y * magnitude, true);
      },
      onEnd: () => {
        this.game?.setTouchMove(0, 0, false);
      },
    });
    this.attachJoystick({
      element: this.aimJoystick,
      knob: this.aimKnob,
      onStart: () => {
        if (!this.game) return;
        this.aimHeld = true;
        this.game.aimNearestEnemy();
        this.game.setTouchAim(0, 0, false);
        this.game.setShooting(true);
      },
      onMove: (x, y, magnitude) => {
        if (!this.game) return;
        if (magnitude < 0.18) this.game.setTouchAim(0, 0, false);
        else this.game.setTouchAim(x, y, true);
        this.game.setShooting(true);
      },
      onEnd: () => {
        this.aimHeld = false;
        if (!this.attackHeld && !this.shooting) this.game?.setShooting(false);
        this.game?.setTouchAim(0, 0, false);
      },
    });
  }

  attachJoystick({ element, knob, onStart, onMove, onEnd }) {
    let pointerId = null;
    let center = { x: 0, y: 0 };
    let maxTravel = 38;

    const updateKnob = (dx, dy) => {
      if (!knob) return;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const reset = () => {
      pointerId = null;
      updateKnob(0, 0);
      element.classList.remove('is-dragging');
      onEnd?.();
    };

    const handleMove = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      event.preventDefault();
      let dx = event.clientX - center.x;
      let dy = event.clientY - center.y;
      const length = Math.hypot(dx, dy);
      if (length > maxTravel) {
        dx = (dx / length) * maxTravel;
        dy = (dy / length) * maxTravel;
      }
      updateKnob(dx, dy);
      const magnitude = Math.min(1, length / maxTravel);
      const normalized = length > 0.001 ? { x: dx / (maxTravel || 1), y: dy / (maxTravel || 1) } : { x: 0, y: 0 };
      const normalizedLength = Math.hypot(normalized.x, normalized.y) || 1;
      onMove?.(normalized.x / normalizedLength, normalized.y / normalizedLength, magnitude);
    };

    const handleUp = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      event.preventDefault();
      reset();
    };

    element.addEventListener('pointerdown', (event) => {
      if (!this.isActive || this.paused || pointerId !== null) return;
      if (event.pointerType === 'mouse') return;
      event.preventDefault();
      event.stopPropagation();
      pointerId = event.pointerId;
      const rect = element.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      maxTravel = rect.width * 0.33;
      element.setPointerCapture?.(pointerId);
      element.classList.add('is-dragging');
      updateKnob(0, 0);
      onStart?.();
      handleMove(event);
    });
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerup', handleUp);
    element.addEventListener('pointercancel', handleUp);
    element.addEventListener('lostpointercapture', () => {
      if (pointerId !== null) reset();
    });
    this.stickState.set(element, reset);
  }

  resetJoysticks() {
    if (this.moveKnob) this.moveKnob.style.transform = 'translate(0px, 0px)';
    if (this.aimKnob) this.aimKnob.style.transform = 'translate(0px, 0px)';
    this.moveJoystick?.classList.remove('is-dragging');
    this.aimJoystick?.classList.remove('is-dragging');
    this.attackButton?.classList.remove('is-pressed');
    this.attackHeld = false;
    this.aimHeld = false;
    if (this.game) {
      this.game.setTouchMove(0, 0, false);
      this.game.setTouchAim(0, 0, false);
      this.game.setShooting(false);
    }
  }

  fireSuper() {
    if (!this.game || !this.isActive || this.paused) return;
    if (this.game.phase === 'ended') return;
    if (this.game.phase !== 'playing') {
      this.options.toast?.('انتظر بدء المعركة', { icon: icon('clock'), tone: 'neutral', duration: 1200 });
      return;
    }
    if (!this.game.player.alive) {
      this.options.toast?.('ستعود إلى الساحة بعد الإحياء', { icon: icon('heart'), tone: 'danger', duration: 1400 });
      return;
    }
    if (this.touchMode) this.game.aimNearestEnemy();
    const result = this.game.triggerSuper();
    if (!result.ok) {
      audio.play('error');
      this.superButton?.classList.add('is-denied');
      this.schedule(() => this.superButton?.classList.remove('is-denied'), 360);
      if (result.reason === 'charge') {
        this.options.toast?.('قدرة السوبر غير جاهزة بعد', {
          icon: icon(SUPER_ICON[this.game.player.hero.super.type] || 'zap'),
          tone: 'violet',
          duration: 1300,
        });
      }
    }
  }

  handleGameEvent(event) {
    if (!event || !this.isActive) return;
    if (event.type === 'start') {
      this.showCountdown('3');
      return;
    }
    if (event.type === 'countdown') {
      this.showCountdown(String(event.value));
      return;
    }
    if (event.type === 'go') {
      this.showGo();
      return;
    }
    if (event.type === 'overtime') {
      const team = event.team === 0 ? 'فريقك' : 'فريق الخصم';
      this.announce(
        'العد التنازلي!',
        event.team === 0 ? 'ثبّت الجواهر حتى النهاية!' : 'أوقف فريق الخصم قبل فوات الأوان!',
        event.team === 0 ? 'gold' : 'danger',
        2200,
        `${event.seconds} ثانية`,
      );
      return;
    }
    if (event.type === 'overtime-cancel') {
      this.announce('عادت المعركة!', 'انخفض عدد جواهر الخصم — استمروا', 'cyan', 1500);
      return;
    }
    if (event.type === 'kill') {
      this.addKillFeed(event);
      if (event.playerDied) {
        this.announce('لقد سقطت!', 'ستعود إلى الساحة خلال لحظات', 'danger', 1500);
      }
      return;
    }
    if (event.type === 'respawn') {
      this.announce('عدت إلى الساحة!', 'استعد للمعركة', 'cyan', 1100);
      return;
    }
    if (event.type === 'super' && event.player) {
      const hero = HEROES[this.heroId];
      if (hero) {
        this.announce(hero.super.name, hero.name, 'gold', 800, '', true);
      }
      return;
    }
    if (event.type === 'match-end') {
      if (this.respawnPanel) this.respawnPanel.classList.add('is-hidden');
      return;
    }
  }

  showCountdown(value) {
    if (!this.countdownSplash) return;
    this.countdownSplash.classList.remove('is-hidden', 'is-go');
    const kicker = this.countdownSplash.querySelector('.countdown-kicker');
    if (kicker) kicker.textContent = 'استعد للمعركة';
    if (this.countdownNumber) this.countdownNumber.textContent = value;
    this.countdownSplash.classList.remove('is-pop');
    void this.countdownSplash.offsetWidth;
    this.countdownSplash.classList.add('is-pop');
    this.schedule(() => {
      if (!this.countdownSplash || this.countdownSplash.classList.contains('is-go')) return;
      this.countdownSplash.classList.add('is-hidden');
    }, 760);
  }

  showGo() {
    if (!this.countdownSplash) return;
    this.countdownSplash.classList.remove('is-hidden', 'is-pop');
    this.countdownSplash.classList.add('is-go');
    const kicker = this.countdownSplash.querySelector('.countdown-kicker');
    if (kicker) kicker.textContent = 'المعركة بدأت';
    if (this.countdownNumber) this.countdownNumber.textContent = 'انطلق!';
    this.schedule(() => this.countdownSplash?.classList.add('is-hidden'), 900);
  }

  announce(title, subtitle = '', tone = 'gold', duration = 1600, kicker = '', compact = false) {
    if (!this.centerAnnouncement) return;
    const element = this.centerAnnouncement;
    element.classList.remove('is-visible');
    element.innerHTML = `
      ${kicker ? `<span class="announce-kicker">${escapeHtml(kicker)}</span>` : ''}
      <strong>${escapeHtml(title)}</strong>
      ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ''}
    `;
    element.className = `center-announcement announce-${tone} ${compact ? 'is-compact' : ''}`;
    void element.offsetWidth;
    element.classList.add('is-visible');
    this.schedule(() => {
      element.classList.remove('is-visible');
    }, duration);
  }

  addKillFeed(event) {
    if (!this.killFeed) return;
    const killer = event.killer || 'الساحة';
    const item = document.createElement('div');
    const playerClass = event.playerKilled ? 'is-player-kill' : event.playerDied ? 'is-player-death' : '';
    item.className = `kill-feed-item ${playerClass}`;
    item.innerHTML = `
      <span class="feed-name feed-killer team-${event.killerTeam === 0 ? 'ally' : 'enemy'}">${escapeHtml(killer)}</span>
      <span class="feed-icon">${icon('sword')}</span>
      <span class="feed-name feed-victim team-${event.victimTeam === 0 ? 'ally' : 'enemy'}">${escapeHtml(event.victim)}</span>
    `;
    this.killFeed.appendChild(item);
    while (this.killFeed.children.length > 4) this.killFeed.firstElementChild?.remove();
    requestAnimationFrame(() => item.classList.add('is-visible'));
    const timer = window.setTimeout(() => {
      this.killFeedTimers.delete(timer);
      item.classList.remove('is-visible');
      window.setTimeout(() => item.remove(), 260);
    }, 3400);
    this.killFeedTimers.add(timer);
  }

  pause() {
    if (!this.game || !this.isActive || this.paused || this.game.phase === 'ended') return;
    this.paused = true;
    this.game.pause();
    this.stopMouseShooting();
    this.resetJoysticks();
    this.pauseOverlay?.classList.remove('is-hidden');
    requestAnimationFrame(() => this.pauseOverlay?.classList.add('is-visible'));
    this.syncSound();
    audio.play('click');
  }

  resume() {
    if (!this.game || !this.paused) return;
    this.paused = false;
    this.pauseOverlay?.classList.remove('is-visible');
    this.pauseOverlay?.classList.add('is-hidden');
    this.game.resume();
    this.syncSound();
    audio.play('click');
  }

  syncSound() {
    const enabled = audio.isEnabled();
    if (this.pauseSoundToggle) {
      this.pauseSoundToggle.innerHTML = `${icon(enabled ? 'soundOn' : 'soundOff')} <span id="pauseSoundLabel">${enabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>`;
    }
  }

  handleResult(result) {
    if (!this.isActive || this.recorded) return;
    this.recorded = true;
    this.stopMouseShooting();
    this.resetJoysticks();
    const playerStats = result.playerStats || {};
    const rewards = recordMatch({
      heroId: this.heroId,
      won: Boolean(result.playerWon),
      kills: playerStats.kills || 0,
      deaths: playerStats.deaths || 0,
      gems: playerStats.gems || 0,
      damage: playerStats.damage || 0,
    });
    this.options.onProgressChanged?.();
    this.renderResult(result, rewards);
  }

  renderResult(result, rewards) {
    const win = result.playerWon;
    const draw = result.draw || result.winner === null;
    const hero = HEROES[this.heroId] || HEROES.nova;
    const arena = arenaById(this.arenaId);
    const title = draw ? 'تعادل مثير!' : win ? 'فوز ساحق!' : 'خسارة قريبة';
    const kicker = draw ? 'تعادل' : win ? 'انتصار' : 'هزيمة';
    const subtitle = draw
      ? 'الآن كل نقطة تصنع الفارق'
      : win
        ? `سيطرت على ${arena.name} بثبات`
        : 'المعركة لم تنتهِ... عُد أقوى';
    const stats = result.playerStats || {};

    if (this.resultKicker) this.resultKicker.textContent = kicker;
    if (this.resultTitle) this.resultTitle.textContent = title;
    if (this.resultSubtitle) this.resultSubtitle.textContent = subtitle;
    if (this.resultScore) {
      this.resultScore.innerHTML = `
        <span class="ally">${formatNumber(result.scores?.ally || 0)}</span>
        <span class="score-divider">—</span>
        <span class="enemy">${formatNumber(result.scores?.enemy || 0)}</span>
      `;
    }
    if (this.resultHero) {
      this.resultHero.innerHTML = portrait(hero.id, {
        uid: `result-${hero.id}-${Date.now()}`,
        background: false,
        bust: true,
      });
    }
    if (this.resultStats) {
      this.resultStats.innerHTML = `
        <span class="result-stat">${icon('sword')}<b>${formatNumber(stats.kills)}</b><small>إقصاء</small></span>
        <span class="result-stat">${icon('shield')}<b>${formatNumber(stats.deaths)}</b><small>سقوط</small></span>
        <span class="result-stat">${icon('gem')}<b>${formatNumber(stats.gems)}</b><small>جوهرة</small></span>
        <span class="result-stat">${icon('flame')}<b>${formatNumber(stats.damage)}</b><small>ضرر</small></span>
      `;
    }
    if (this.resultRewards) {
      this.resultRewards.innerHTML = `
        <span class="result-reward trophy ${rewards.trophyDelta < 0 ? 'is-negative' : ''}">
          ${icon('trophy')}<b>${rewards.trophyDelta > 0 ? '+' : ''}${formatNumber(rewards.trophyDelta)}</b><small>كأس</small>
        </span>
        <span class="result-reward coin">
          ${icon('coin')}<b>+${formatNumber(rewards.coinReward)}</b><small>عملة</small>
        </span>
        <span class="result-reward gem">
          ${icon('gem')}<b>+${formatNumber(rewards.gemReward)}</b><small>جوهرة</small>
        </span>
      `;
    }
    if (this.resultOverlay) {
      this.resultOverlay.classList.remove('is-hidden', 'is-visible', 'is-win', 'is-loss', 'is-draw');
      this.resultOverlay.classList.add(win ? 'is-win' : draw ? 'is-draw' : 'is-loss');
      if (this.resultConfetti) this.renderConfetti(win ? 30 : 0);
      void this.resultOverlay.offsetWidth;
      this.resultOverlay.classList.add('is-visible');
    }
    if (this.respawnPanel) this.respawnPanel.classList.add('is-hidden');
    if (this.centerAnnouncement) this.centerAnnouncement.classList.remove('is-visible');
    if (this.game?.phase === 'ended') {
      this.paused = false;
      this.pauseOverlay?.classList.add('is-hidden');
    }
  }

  renderConfetti(count) {
    if (!this.resultConfetti) return;
    const colors = ['#ffd45e', '#42e7ff', '#ff5ca8', '#49f7a8', '#b574ff'];
    this.resultConfetti.innerHTML = Array.from({ length: count }, (_, index) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.9;
      const duration = 2.4 + Math.random() * 1.7;
      const size = 5 + Math.random() * 8;
      const color = colors[index % colors.length];
      const rotate = Math.random() * 360;
      return `<i style="--x:${left}%;--delay:${delay}s;--duration:${duration}s;--size:${size}px;--color:${color};--rotate:${rotate}deg"></i>`;
    }).join('');
  }

  rematch() {
    const heroId = this.heroId;
    const playerName = this.playerName;
    const arenaId = this.arenaId;
    this.disposeMatch();
    this.start(heroId, playerName, arenaId);
  }

  returnHome() {
    if (!this.isActive) {
      this.options.onHome?.();
      return;
    }
    this.disposeMatch();
    this.options.onHome?.();
  }

  disposeMatch() {
    this.clearTimers();
    this.resetJoysticks();
    this.stopMouseShooting();
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    this.isActive = false;
    this.paused = false;
    this.lastHud = null;
    this.pauseOverlay?.classList.remove('is-visible');
    this.pauseOverlay?.classList.add('is-hidden');
    this.resultOverlay?.classList.remove('is-visible');
    this.resultOverlay?.classList.add('is-hidden');
    this.screens.match?.classList.add('is-hidden');
    document.body.classList.remove('in-match', 'has-touch');
    if (this.killFeed) this.killFeed.innerHTML = '';
    if (this.resultConfetti) this.resultConfetti.innerHTML = '';
    if (this.centerAnnouncement) {
      this.centerAnnouncement.classList.remove('is-visible');
      this.centerAnnouncement.innerHTML = '';
    }
  }
}
