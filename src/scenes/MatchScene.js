/**
 * src/scenes/MatchScene.js
 *
 * Nokia Soccer League — escena principal.
 * Mundo: 60×200 px  |  Viewport: 60×85 px  |  Zoom: ×7
 * La cámara SIGUE la bola verticalmente, igual que el Nokia original.
 */

import Phaser from 'phaser';
import InputSystem from '../systems/InputSystem.js';
import AISystem    from '../systems/AISystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import Ball        from '../entities/Ball.js';
import Player      from '../entities/Player.js';
import GoalKeeper  from '../entities/GoalKeeper.js';
import Team        from '../entities/Team.js';
import { FIELD }   from '../config/fieldConstants.js';

export default class MatchScene extends Phaser.Scene {
  constructor() { super({ key: 'MatchScene' }); }

  init() {
    this.homeTeam    = null;
    this.awayTeam    = null;
    this.ball        = null;
    this.inputSystem = null;
    this.aiSystem    = null;
    this.scoreSystem = null;

    this.matchStarted        = false;
    this.matchPaused         = false;
    this.isEntering          = true;
    this.isWaitingForKickoff = false;
    this.isKickoff           = false;
    this.kickoffTeam         = 'home';

    this.ballOwner  = null;
    this.isScoring  = false;

    this._goalieHoldingBall = false;
    this._holdingGoalie     = null;
  }

  create() {
    // Detener música de menú
    const am = this.registry.get('audioManager');
    if (am) am.stop('menu');

    this._drawField();

    this.ball = new Ball(this, FIELD.X, FIELD.CY);
    this._createTeams();

    this.scene.launch('UIScene');

    this.inputSystem = new InputSystem(this);
    this.aiSystem    = new AISystem(this);
    this.scoreSystem = new ScoreSystem(this);

    this.inputSystem.setup(this.homeTeam, this.awayTeam, this.ball);
    this.aiSystem.setup(this.awayTeam, this.homeTeam, this.ball);

    // Física: el mundo cubre TODA la altura incluyendo porterías
    this.physics.world.setBounds(
      FIELD.LEFT, FIELD.GOAL_TOP - 2,
      FIELD.WIDTH, (FIELD.GOAL_BOT + 2) - (FIELD.GOAL_TOP - 2)
    );

    this._setupCollisions();

    // Cámara sigue la bola — Nokia-style scrolling
    this.cameras.main.setBounds(0, 0, FIELD.WORLD_W, FIELD.WORLD_H);
    this.physics.world.setBounds(0, 0, FIELD.WORLD_W, FIELD.WORLD_H);
    this.cameras.main.startFollow(
      this.ball.getSprite(),
      true,   // round pixels
      0.08,   // lerp X — lento para no marear
      0.08    // lerp Y
    );

    // Dianas de tiro oscilantes en las porterías
    this.targetDotBot = this.add.rectangle(FIELD.X, FIELD.BOTTOM, 4, 2, 0xff2200).setDepth(20);
    this.targetDotTop = this.add.rectangle(FIELD.X, FIELD.TOP, 4, 2, 0xff2200).setDepth(20);

    const tweenConfig = {
      x:        { from: FIELD.X - FIELD.GOAL_W / 2 + 3, to: FIELD.X + FIELD.GOAL_W / 2 - 3 },
      duration: 700,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    };

    this.tweens.add({ targets: this.targetDotBot, ...tweenConfig });
    this.tweens.add({ targets: this.targetDotTop, ...tweenConfig });

    this.events.on('pause',  () => this._onPause());
    this.events.on('resume', () => this._onResume());

    this._startEntranceAnimation();
    this.matchStarted = true;
  }

  // ─── Campo ──────────────────────────────────────────────────────────────────

  _drawField() {
    const { X, TOP, BOTTOM, LEFT, RIGHT, WIDTH, HEIGHT, CY,
            GOAL_W, GOAL_H, GOAL_TOP, GOAL_BOT,
            PEN_W, PEN_H, PEN_S_W, PEN_S_H, PEN_ARC, WORLD_W, WORLD_H } = FIELD;

    // Fondo total del mundo (césped)
    this.add.rectangle(X, WORLD_H / 2, WORLD_W, WORLD_H, 0x314a15);

    // Margen trasero porterías (verde oscuro)
    this.add.rectangle(X, (GOAL_TOP + TOP) / 2, WIDTH, TOP - GOAL_TOP, 0x243810);
    this.add.rectangle(X, (GOAL_BOT + BOTTOM) / 2, WIDTH, GOAL_BOT - BOTTOM, 0x243810);

    // Campo activo principal con franjas
    const stripeH = 22;
    for (let i = 0; i < HEIGHT / stripeH; i++) {
      const color = i % 2 === 0 ? 0x4a7a20 : 0x436d1d;
      this.add.rectangle(X, TOP + i * stripeH + stripeH / 2, WIDTH, stripeH, color);
    }

    // ── Líneas del campo ──────────────────────────────────────────────────────
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(1, 0xffffff, 1);

    g.strokeRect(LEFT, TOP, WIDTH, HEIGHT);
    g.lineBetween(LEFT, CY, RIGHT, CY);
    g.strokeCircle(X, CY, 9);

    // Punto central
    g.fillStyle(0xc8e88a, 1);
    g.fillRect(X - 0.5, CY - 0.5, 1, 1);

    // Áreas penales
    g.strokeRect(X - PEN_W / 2, TOP, PEN_W, PEN_H);
    g.strokeRect(X - PEN_S_W / 2, TOP, PEN_S_W, PEN_S_H);
    g.strokeRect(X - PEN_W / 2, BOTTOM - PEN_H, PEN_W, PEN_H);
    g.strokeRect(X - PEN_S_W / 2, BOTTOM - PEN_S_H, PEN_S_W, PEN_S_H);

    // Puntos de penal
    g.fillStyle(0xffffff, 1);
    g.fillRect(X - 0.5, TOP + PEN_H - 10, 1, 1);
    g.fillRect(X - 0.5, BOTTOM - PEN_H + 10, 1, 1);

    // Medias lunas (más prominentes)
    const arcR = 15;
    g.beginPath();
    g.arc(X, TOP + PEN_H - 10, arcR, 0.85, Math.PI - 0.85, false);
    g.strokePath();
    g.beginPath();
    g.arc(X, BOTTOM - PEN_H + 10, arcR, Math.PI + 0.85, -0.85, false);
    g.strokePath();

    // Esquinas y Banderines
    const corR = 5;
    const flagColor = 0xff0000;
    
    // Arcos de esquina
    g.lineStyle(1, 0xffffff, 0.8);
    g.beginPath(); g.arc(LEFT,  TOP,    corR, 0, Math.PI / 2, false); g.strokePath();
    g.beginPath(); g.arc(RIGHT, TOP,    corR, Math.PI / 2, Math.PI, false); g.strokePath();
    g.beginPath(); g.arc(LEFT,  BOTTOM, corR, Math.PI * 1.5, 0, false); g.strokePath();
    g.beginPath(); g.arc(RIGHT, BOTTOM, corR, Math.PI, Math.PI * 1.5, false); g.strokePath();

    // Banderines (visual)
    const drawFlag = (fx, fy) => {
      this.add.line(0, 0, fx, fy, fx, fy - 4, 0xaaaaaa).setOrigin(0).setDepth(10);
      this.add.triangle(fx, fy - 4, 0, 0, 0, 3, 3, 1.5, flagColor).setOrigin(0).setDepth(11);
    };
    drawFlag(LEFT, TOP);
    drawFlag(RIGHT, TOP);
    drawFlag(LEFT, BOTTOM);
    drawFlag(RIGHT, BOTTOM);

    // ── Porterías ─────────────────────────────────────────────────────────────
    this._drawGoal(X, TOP,    GOAL_W, GOAL_H, true);
    this._drawGoal(X, BOTTOM, GOAL_W, GOAL_H, false);
  }

  _drawGoal(x, y, w, h, isTop) {
    const hW  = w / 2;
    const dir = isTop ? -1 : 1;
    const g   = this.add.graphics().setDepth(2);

    // Sombra interior de la red (media malla)
    const gap = 3; 
    g.fillStyle(0x000000, 0.4);
    if (isTop) {
      g.fillRect(x - hW, y - h, w, h - gap);
    } else {
      g.fillRect(x - hW, y + gap, w, h - gap);
    }

    // Líneas de red (gris pálido)
    g.lineStyle(1, 0xcccccc, 0.2);
    for (let i = gap + 1; i < h; i++) {
      const yy = isTop ? y - i : y + i;
      g.lineBetween(x - hW, yy, x + hW, yy);
    }

    // Marco blanco
    g.lineStyle(1, 0xffffff, 1);
    g.lineBetween(x - hW, y, x - hW, y + dir * h);
    g.lineBetween(x + hW, y, x + hW, y + dir * h);
    g.lineBetween(x - hW, y + dir * h, x + hW, y + dir * h);

    // Postes (destellos)
    this.add.circle(x - hW, y, 1, 0xffffff).setDepth(3);
    this.add.circle(x + hW, y, 1, 0xffffff).setDepth(3);
  }

  // ─── Equipos ────────────────────────────────────────────────────────────────

  _createTeams() {
    const homeGKY = FIELD.TOP + 2;
    const awayGKY = FIELD.BOTTOM - 2;

    const homeGK = new GoalKeeper(this, FIELD.X, homeGKY, homeGKY, 'home', 'gk_home');
    this.homeTeam = new Team(this, 'HOME', 'home', homeGK);
    for (let i = 0; i < 10; i++) {
      // Spawn un poco más cerca del borde para asegurar visibilidad en la entrada
      const p = new Player(this, FIELD.WORLD_W + 2 + i * 4, FIELD.CY - 15, 'home', i + 1, 'team_home');
      this.homeTeam.addPlayer(p);
    }

    const awayGK = new GoalKeeper(this, FIELD.X, awayGKY, awayGKY, 'away', 'gk_away');
    this.awayTeam = new Team(this, 'AWAY', 'away', awayGK);
    for (let i = 0; i < 10; i++) {
      // Spawn al lado izquierdo
      const p = new Player(this, -2 - i * 4, FIELD.CY + 15, 'away', i + 1, 'team_away');
      this.awayTeam.addPlayer(p);
    }
  }

  // ─── Animación entrada ───────────────────────────────────────────────────────

  _startEntranceAnimation() {
    const homePlayers = [this.homeTeam.goalkeeper, ...this.homeTeam.getAllPlayers()];
    const awayPlayers = [this.awayTeam.goalkeeper, ...this.awayTeam.getAllPlayers()];
    let arrived = 0;
    const total = homePlayers.length + awayPlayers.length;

    const animateTeam = (entities, isHome) => {
      entities.forEach((entity, i) => {
        const isGK = i === 0;
        let destX, destY;

        if (isGK) {
          destX = FIELD.X;
          destY = isHome ? FIELD.TOP + 2 : FIELD.BOTTOM - 2;
        } else {
          const pos = isHome
            ? this.homeTeam.getFormationPos(i - 1)
            : this.awayTeam.getFormationPos(i - 1);
          destX = pos?.x ?? FIELD.X;
          destY = pos?.y ?? FIELD.CY;
        }

        this.tweens.add({
          targets:  entity.sprite,
          x:        destX,
          y:        destY,
          duration: 850,
          delay:    i * 70,
          ease:     'Quad.easeOut',
          onComplete: () => {
            arrived++;
            if (arrived === total) {
              this.isEntering          = false;
              this.isWaitingForKickoff = true;
              this._prepareKickoff();
            }
          },
        });
      });
    };

    animateTeam(homePlayers, true);
    animateTeam(awayPlayers, false);
  }

  _prepareKickoff() {
    this.isKickoff = true;
    this.ball.reset(FIELD.X, FIELD.CY);
    this.ballOwner = null;

    const team    = this.kickoffTeam === 'home' ? this.homeTeam : this.awayTeam;
    const players = team.getAllPlayers();
    players[7].sprite.setPosition(FIELD.X - 5, FIELD.CY);
    players[8].sprite.setPosition(FIELD.X + 5, FIELD.CY);

    this.events.emit('showAnnouncement', 'PRESS X TO START');
  }

  _executeKickoff() {
    this.isKickoff = true;
    this.homeTeam.setFormation('offensive');
    this.awayTeam.setFormation('offensive');

    const team   = this.kickoffTeam === 'home' ? this.homeTeam : this.awayTeam;
    const kicker = team.getAllPlayers()[7];

    this.ballOwner = kicker;
    kicker.setBallPossession(true);

    this.time.delayedCall(250, () => {
      const dy = kicker.team === 'home' ? 0.5 : -0.5; // Home ataca abajo (+dy)
      kicker.kick(this.ball, (Math.random() - 0.5) * 0.4, dy, 0.45);
      this.isKickoff = false;
    });
  }

  // ─── Colisiones ─────────────────────────────────────────────────────────────

  _setupCollisions() {
    const ballSprite = this.ball.getSprite();
    const allPlayers = [
      ...this.homeTeam.getAllPlayers(),
      ...this.awayTeam.getAllPlayers(),
    ];

    // Pelota vs jugadores
    allPlayers.forEach(player => {
      this.physics.add.overlap(ballSprite, player.getSprite(), () => {
        this._onBallTouchPlayer(player);
      });
    });

    // Jugador vs jugador
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const p1 = allPlayers[i], p2 = allPlayers[j];
        this.physics.add.collider(p1.getSprite(), p2.getSprite());
        this.physics.add.overlap(p1.getSprite(), p2.getSprite(), () => {
          if (p1.team !== p2.team) {
            if (this.ballOwner === p1 && !p2.isFallen) this._applyTackle(p2, p1);
            else if (this.ballOwner === p2 && !p1.isFallen) this._applyTackle(p1, p2);
          }
        });
      }
    }

    // Pelota vs porteros
    this.physics.add.overlap(ballSprite, this.homeTeam.goalkeeper.getSprite(), () => {
      this._onGoalkeeperSave(this.homeTeam.goalkeeper);
    });
    this.physics.add.overlap(ballSprite, this.awayTeam.goalkeeper.getSprite(), () => {
      this._onGoalkeeperSave(this.awayTeam.goalkeeper);
    });

    // ── Zonas de GOL ─────────────────────────────────────────────────────────
    // DENTRO de la portería (detrás de la boca del arco)
    // La bola llega aquí porque Ball.update() no rebota en la boca del arco.
    this._addGoalZone(FIELD.X, FIELD.GOAL_TOP + 2, FIELD.GOAL_W - 2, 4, 'away');
    this._addGoalZone(FIELD.X, FIELD.GOAL_BOT - 2, FIELD.GOAL_W - 2, 4, 'home');
  }

  _addGoalZone(x, y, w, h, scoringTeam) {
    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone);
    this.physics.add.overlap(this.ball.getSprite(), zone, () => {
      if (!this.matchPaused && !this.isScoring && !this._goalieHoldingBall) {
        this.isScoring = true;
        this.scoreSystem.goal(scoringTeam);
      }
    });
  }

  _applyTackle(tackler, victim) {
    if (this.ballOwner === victim) {
      this.releaseBallPossession();
      this._onBallTouchPlayer(tackler);
    }
    victim.fallDown();
  }

  _onBallTouchPlayer(player) {
    if (this._goalieHoldingBall)    return;
    if (this.ballOwner === player)  return;
    if (player._catchCooldown > 0) return;

    const team = player.team === 'home' ? this.homeTeam : this.awayTeam;
    if (this.ballOwner && team.catchCooldown > 0) return;
    if (this.ballOwner && this.ballOwner !== player) return;

    if (this.isKickoff) {
      this.isKickoff = false;
      const dy = player.team === 'home' ? -1 : 1;
      player.kick(this.ball, 0, dy, 0.4);
      return;
    }

    this.ballOwner            = player;
    this.lastPossessionChange = this.time.now;
    player.setBallPossession(true);
    this.events.emit('updatePossession', player.team);

    if (player.team === 'home') {
      const idx = this.homeTeam.getAllPlayers().indexOf(player);
      if (idx !== -1) this.homeTeam.setActivePlayer(idx);
    }
  }

  // ─── Portero atrapa ─────────────────────────────────────────────────────────

  _onGoalkeeperSave(goalkeeper) {
    if (this._goalieHoldingBall)     return;
    if (goalkeeper.saveCooldown > 0) return;

    this._goalieHoldingBall = true;
    this._holdingGoalie     = goalkeeper;
    goalkeeper.holdingBall  = true;

    this.releaseBallPossession();
    goalkeeper.performSave();

    this.ball.stop();
    const offY = goalkeeper.team === 'home' ? 4 : -4;
    this.ball.setPosition(goalkeeper.sprite.x, goalkeeper.sprite.y + offY);

    if (this.inputSystem) this.inputSystem.enabled = false;
    if (this.aiSystem)    this.aiSystem.setGoalieHolding(goalkeeper.team);

    this.time.delayedCall(1200, () => {
      // PASO 1: Limpiar flags ANTES de kick (fix del bug de despeje)
      this._goalieHoldingBall = false;
      this._holdingGoalie     = null;
      goalkeeper.holdingBall  = false;
      goalkeeper.saveCooldown = 800;

      if (this.inputSystem) this.inputSystem.enabled = true;
      if (this.aiSystem)    this.aiSystem.setGoalieHolding(null);

      goalkeeper.sprite.setTint(0xffffaa);
      this.time.delayedCall(70, () => {
        if (goalkeeper.sprite?.active) goalkeeper.sprite.clearTint();
      });

      // PASO 2: Kick
      const kickDir = goalkeeper.team === 'home' ? 1 : -1;
      const lateral = (Math.random() - 0.5) * 0.65;
      this.ball.setPosition(goalkeeper.sprite.x, goalkeeper.sprite.y + kickDir * 10);
      this.ball.kick(lateral, kickDir * 2.0);
    });
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────

  releaseBallPossession() {
    if (this.ballOwner) {
      this.ballOwner.setBallPossession(false);
      this.ballOwner = null;
    }
  }

  resetMatch(scoringTeam) {
    if (scoringTeam) {
      this.kickoffTeam = (scoringTeam === 'home') ? 'away' : 'home';
    }

    this._goalieHoldingBall                   = false;
    this._holdingGoalie                        = null;
    this.homeTeam.goalkeeper.holdingBall       = false;
    this.homeTeam.goalkeeper.saveCooldown      = 0;
    this.awayTeam.goalkeeper.holdingBall       = false;
    this.awayTeam.goalkeeper.saveCooldown      = 0;

    if (this.inputSystem) this.inputSystem.enabled = true;
    if (this.aiSystem)    this.aiSystem.setGoalieHolding(null);

    this.releaseBallPossession();
    this.ball.reset(FIELD.X, FIELD.CY);
    
    // Forzar posición defensiva al reiniciar
    this.homeTeam.setFormation('defensive');
    this.awayTeam.setFormation('defensive');
    this.homeTeam.resetPositions();
    this.awayTeam.resetPositions();
    
    this.isScoring = false;

    this.isWaitingForKickoff = true;
    this.events.emit('showAnnouncement', 'PRESS X TO START');
  }

  // ─── Pausa ───────────────────────────────────────────────────────────────────

  _onPause() {
    this.matchPaused = true;
    this.homeTeam.stopAll();
    this.awayTeam.stopAll();
    this.ball.stop();
  }
  _onResume() { this.matchPaused = false; }

  // ─── Loop ───────────────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.matchStarted || this.matchPaused || this.isEntering) return;

    if (this.isWaitingForKickoff) {
      if (this.inputSystem.isJustPressed('pass')) {
        this.isWaitingForKickoff = false;
        this.events.emit('hideAnnouncement');
        this._executeKickoff();
      }
      return;
    }

    if (!this.inputSystem || !this.aiSystem || !this.ball) return;

    this.events.emit('updateTimer', time);
    this.inputSystem.update();
    this.aiSystem.update(delta);
    this.ball.update();

    // Sincronizar pelota
    if (this.ballOwner?.hasBall) {
      this.ballOwner.syncBallToPlayer(this.ball);
    } else if (this._goalieHoldingBall && this._holdingGoalie?.holdingBall) {
      const g    = this._holdingGoalie;
      const offY = g.team === 'home' ? 4 : -4;
      this.ball.setPosition(g.sprite.x, g.sprite.y + offY);
      this.ball.stop();
    }

    // Jugadores
    const allPlayers = [
      ...this.homeTeam.getAllPlayers(),
      ...this.awayTeam.getAllPlayers(),
    ];
    for (const player of allPlayers) {
      player.update(delta);
      if (player.isTackling) {
        for (const other of allPlayers) {
          if (other.team !== player.team && !other.isFallen) {
            const dist = Phaser.Math.Distance.Between(
              player.sprite.x, player.sprite.y, other.sprite.x, other.sprite.y
            );
            if (dist < 9) this._applyTackle(player, other);
          }
        }
      }
    }

    this.homeTeam.update(delta);
    this.awayTeam.update(delta);
    this.homeTeam.goalkeeper.updateAI(this.ball, delta);
    this.awayTeam.goalkeeper.updateAI(this.ball, delta);
  }

  // ─── Limpieza ────────────────────────────────────────────────────────────────

  shutdown() {
    this.homeTeam?.destroy();
    this.awayTeam?.destroy();
    this.ball?.destroy();
    this.hud?.destroy();
    this.events.off('pause');
    this.events.off('resume');
    this.ballOwner          = null;
    this._goalieHoldingBall = false;
    this._holdingGoalie     = null;
  }
}
