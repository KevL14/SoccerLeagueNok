/**
 * src/scenes/MatchScene.js
 *
 * Escena principal del partido.
 * Canvas vertical: 120 × 160 px (zoom ×4 = 480×640 en pantalla)
 *
 * Layout:
 *   y 0–10   → HUD (marcador / timer)
 *   y 10–160 → Campo (150 px tall)
 *   y 10–16  → Portería HOME (home defiende arriba)
 *   y 154–160→ Portería AWAY (away defiende abajo)
 */

import Phaser from 'phaser';
import InputSystem from '../systems/InputSystem.js';
import AISystem    from '../systems/AISystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import HUD         from '../ui/HUB.js';
import Ball        from '../entities/Ball.js';
import Player      from '../entities/Player.js';
import GoalKeeper  from '../entities/GoalKeeper.js';
import Team        from '../entities/Team.js';
import { FIELD }   from '../config/fieldConstants.js';


export default class MatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MatchScene' });
  }

  init() {
    this.homeTeam     = null;
    this.awayTeam     = null;
    this.ball         = null;
    this.inputSystem  = null;
    this.aiSystem     = null;
    this.scoreSystem  = null;
    this.hud          = null;
    this.matchStarted = false;
    this.matchPaused  = false;

    /** @type {Player|null} Jugador que actualmente controla la pelota */
    this.ballOwner = null;
    
    // Guard para evitar múltiples triggers de gol
    this.isScoring = false;
  }

  create() {
    this._drawField();

    // Entidades (centro del campo)
    this.ball = new Ball(this, FIELD.X, FIELD.CY);
    this._createTeams();

    // HUD (arriba)
    this.hud = new HUD(this);
    this.hud.create();
    this.hud.updateScore(0, 0);
    this.hud.updateTimer(0);

    // Sistemas
    this.inputSystem = new InputSystem(this);
    this.aiSystem    = new AISystem(this);
    this.scoreSystem = new ScoreSystem(this, this.hud);
    
    this.isKickoff = false; // Se activará tras la entrada
    this.isEntering = true;
    this.kickoffTeam = 'home';
    
    this.inputSystem.setup(this.homeTeam, this.awayTeam, this.ball);
    this.aiSystem.setup(this.awayTeam, this.homeTeam, this.ball);

    this._setupCollisions();
    this._startEntranceAnimation();

    this.events.on('pause',  () => this._onPause());
    this.events.on('resume', () => this._onResume());

    // Configurar cámara para hacer scroll
    this.cameras.main.setBounds(0, 0, 120, FIELD.BOTTOM);
    this.cameras.main.startFollow(this.ball.getSprite(), true, 0.1, 0.1);
    this.physics.world.setBounds(0, FIELD.TOP, 120, FIELD.BOTTOM - FIELD.TOP);

    // Diana de tiro (Target Dot) - se mueve en la portería rival (BOTTOM)
    this.targetDot = this.add.rectangle(FIELD.X, FIELD.BOTTOM - 2, 5, 5, 0xff0000);
    this.targetDot.setDepth(20);
    this.tweens.add({
      targets: this.targetDot,
      x: { from: FIELD.X - FIELD.GOAL_W / 2 + 3, to: FIELD.X + FIELD.GOAL_W / 2 - 3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.matchStarted = true;
  }

  // ─── Campo ──────────────────────────────────────────────────────────────────

  _drawField() {
    const { X, TOP, BOTTOM, LEFT, RIGHT, WIDTH, HEIGHT, CY,
            GOAL_W, GOAL_H, PEN_W, PEN_H, PEN_S_W, PEN_S_H } = FIELD;

    // ── Fondo de campo (Nokia LCD Style) ──────────────────
    // Base green
    this.add.rectangle(X, TOP + HEIGHT / 2, WIDTH, HEIGHT, 0x1c6e1c);
    
    // Dot matrix grid (simulando pantalla Nokia)
    const dotG = this.add.graphics();
    dotG.fillStyle(0x000000, 0.1);
    for (let x = LEFT; x <= RIGHT; x += 2) {
      for (let y = TOP; y <= BOTTOM; y += 2) {
        dotG.fillRect(x, y, 1, 1);
      }
    }

    // ── Líneas blancas del campo ─────────────────────────────────────────────
    const lineG = this.add.graphics();
    lineG.lineStyle(1, 0xffffff, 0.8);

    // Borde exterior
    lineG.strokeRect(LEFT, TOP, WIDTH, HEIGHT);

    // Línea de medio campo
    lineG.lineBetween(LEFT, CY, RIGHT, CY);

    // Círculo central
    lineG.strokeCircle(X, CY, 15);
    lineG.fillStyle(0xffffff, 0.8);
    lineG.fillRect(X - 0.5, CY - 0.5, 1, 1); // punto central

    // ── ÁREAS (Penal y Chicas) ────────────────────────────────────────────────
    // Home (Arriba)
    lineG.strokeRect(X - PEN_W / 2, TOP, PEN_W, PEN_H);
    lineG.strokeRect(X - PEN_S_W / 2, TOP, PEN_S_W, PEN_S_H);
    
    // Away (Abajo)
    lineG.strokeRect(X - PEN_W / 2, BOTTOM - PEN_H, PEN_W, PEN_H);
    lineG.strokeRect(X - PEN_S_W / 2, BOTTOM - PEN_S_H, PEN_S_W, PEN_S_H);

    // ── PORTERÍAS (Arcos) ───────────────────────────────────────────────────
    this._drawGoal(X, TOP, GOAL_W, GOAL_H, true);
    this._drawGoal(X, BOTTOM, GOAL_W, GOAL_H, false);

    // ── HUD background (banda superior) ─────────────────────────────────────
    this.add.rectangle(FIELD.X, 5, 120, 10, 0x000000, 0).setStrokeStyle(1, 0x00ff00, 0.8);
  }

  /**
   * Dibuja una portería con estilo de red horizontal (Nokia).
   */
  _drawGoal(x, y, w, h, isTop) {
    const hW = w / 2;
    const dir = isTop ? -1 : 1;
    const goalG = this.add.graphics();
    
    // Profundidad/Sombra interior
    this.add.rectangle(x, y + (dir * h) / 2, w, h, 0x000000, 0.3);

    // Líneas horizontales de la red (Efecto del diseño enviado)
    goalG.lineStyle(1, 0xffffff, 0.4);
    for (let i = 2; i < h; i += 3) {
      goalG.lineBetween(x - hW, y + dir * i, x + hW, y + dir * i);
    }

    // Marco frontal (Postes y travesaño)
    goalG.lineStyle(1, 0xffffff, 1);
    // Postes laterales
    goalG.lineBetween(x - hW, y, x - hW, y + dir * h);
    goalG.lineBetween(x + hW, y, x + hW, y + dir * h);
    // Travesaño trasero
    goalG.lineBetween(x - hW, y + dir * h, x + hW, y + dir * h);
    
    // Destellos en los postes delanteros (esquinas con el campo)
    this.add.circle(x - hW, y, 1.2, 0xffffff);
    this.add.circle(x + hW, y, 1.2, 0xffffff);
  }

  _resetToKickoff(team) {
    this.isKickoff = true;
    this.kickoffTeam = team;
    this.releaseBallPossession();
    this.homeTeam.resetPositions();
    this.awayTeam.resetPositions();
    this.ball.reset(FIELD.X, FIELD.CY);
    
    // Colocar al jugador del saque en el centro
    const kTeam = team === 'home' ? this.homeTeam : this.awayTeam;
    const players = kTeam.getAllPlayers();
    const p = players[players.length - 1]; // Usar el último (delantero)
    if (p) p.sprite.setPosition(FIELD.X, FIELD.CY - (team === 'home' ? 5 : -5));
  }

  // ─── Equipos ────────────────────────────────────────────────────────────────

  _createTeams() {
    // Para el futuro: Puedes elegir equipos desde el menú. Por ahora hardcodeamos:
    // HOME: España (Rojo)
    const homeTexture = 'team_red';
    const homeGKTexture = 'gk_home';
    // Portero HOME: Spawnea en la fila (CY-15), pero su meta es GOAL_TOP+2
    const homeGK = new GoalKeeper(this, 140, FIELD.CY - 15, FIELD.GOAL_TOP + 2, 'home', homeGKTexture);
    this.homeTeam = new Team(this, 'ESPAÑA', 'home', homeGK);
    
    // Fila pre-alineada para HOME
    for (let i = 0; i < 10; i++) {
      const p = new Player(this, 155 + i * 15, FIELD.CY - 15, 'home', i + 1, homeTexture);
      this.homeTeam.addPlayer(p);
    }

    // AWAY: Brasil (Amarillo)
    const awayTexture = 'team_yellow';
    const awayGKTexture = 'gk_away';
    // Portero AWAY: Spawnea en la fila (CY+15), pero su meta es GOAL_BOT-2
    const awayGK = new GoalKeeper(this, 140, FIELD.CY + 15, FIELD.GOAL_BOT - 2, 'away', awayGKTexture);
    this.awayTeam = new Team(this, 'BRASIL', 'away', awayGK);
    
    for (let i = 0; i < 10; i++) {
      const p = new Player(this, 155 + i * 15, FIELD.CY + 15, 'away', i + 1, awayTexture);
      this.awayTeam.addPlayer(p);
    }
  }

  _startEntranceAnimation() {
    const homePlayers = [this.homeTeam.goalkeeper, ...this.homeTeam.getAllPlayers()];
    const awayPlayers = [this.awayTeam.goalkeeper, ...this.awayTeam.getAllPlayers()];
    let arrivedCount = 0;
    const total = homePlayers.length + awayPlayers.length;

    const animateTeam = (players, isHome) => {
      players.forEach((entity, i) => {
        const isGK = i === 0;
        let formPos;
        
        if (isGK) {
          formPos = isHome ? { x: FIELD.X, y: FIELD.GOAL_TOP + 2 } : { x: FIELD.X, y: FIELD.GOAL_BOT - 2 };
        } else {
          formPos = isHome ? this.homeTeam.getFormationPos(i - 1) : this.awayTeam.getFormationPos(i - 1);
        }
        
        const startY = isHome ? FIELD.CY - 15 : FIELD.CY + 15;
        
        // FASE 1: Mantener la fila ordenada hasta llegar cerca de la media cancha (vertical)
        const reachX = 75 + i * 15; // Mantener la distancia entre ellos mientras avanzan

        this.tweens.add({
          targets: entity.sprite,
          x: reachX,
          y: startY,
          duration: 2200,
          ease: 'Linear',
          onComplete: () => {
            // FASE 2: Romper fila y buscar posición caminando natural
            const dist = Phaser.Math.Distance.Between(reachX, startY, formPos.x, formPos.y);
            const walkDuration = (dist / 38) * 1000; // Velocidad normal de caminata

            this.tweens.add({
              targets: entity.sprite,
              x: formPos.x,
              y: formPos.y,
              duration: walkDuration,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                arrivedCount++;
                if (arrivedCount === total) {
                  this.isEntering = false;
                  this.isWaitingForKickoff = true;
                  this._prepareKickoffPositions();
                }
              }
            });
          }
        });
      });
    };

    animateTeam(homePlayers, true);
    animateTeam(awayPlayers, false);
  }

  _prepareKickoffPositions() {
    this.isKickoff = true;
    this.ball.reset(FIELD.X, FIELD.CY);
    this.ballOwner = null;

    const team = this.kickoffTeam === 'home' ? this.homeTeam : this.awayTeam;
    const strikers = team.getAllPlayers().slice(7, 10); // Los últimos 3 son delanteros
    
    // Colocar a 2 delanteros en el punto central
    strikers[0].sprite.setPosition(FIELD.X - 8, FIELD.CY);
    strikers[1].sprite.setPosition(FIELD.X + 8, FIELD.CY);
    
    this.hud.showAnnouncement("PRESS PASS TO START");
  }

  _executeInitialKickoff() {
    this.isKickoff = true;
    const team = this.kickoffTeam === 'home' ? this.homeTeam : this.awayTeam;
    const strikers = team.getAllPlayers().slice(7, 10);
    
    this.homeTeam.setFormation('offensive');
    this.awayTeam.setFormation('offensive');
    
    const p1 = strikers[0];
    const p2 = strikers[1];

    // P1 tiene la bola y patea hacia atrás
    this.ballOwner = p1;
    p1.setBallPossession(true);
    
    this.time.delayedCall(300, () => {
      const dy = p1.team === 'home' ? -1 : 1;
      p1.kick(this.ball, 0, dy, 0.4);
      this.isKickoff = false; // El partido ha comenzado oficialmente
    });
  }

  // ─── Colisiones ─────────────────────────────────────────────────────────────

  _setupCollisions() {
    const ballSprite = this.ball.getSprite();

    const allPlayers = [...this.homeTeam.getAllPlayers(), ...this.awayTeam.getAllPlayers()];

    // Pelota vs jugadores de campo
    allPlayers.forEach(player => {
      this.physics.add.overlap(ballSprite, player.getSprite(), () => {
        this._onBallTouchPlayer(player);
      });
    });

    // Jugador vs Jugador (colisiones físicas y robo de balón)
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const p1 = allPlayers[i];
        const p2 = allPlayers[j];
        // Colisión física para que no se traspasen
        this.physics.add.collider(p1.getSprite(), p2.getSprite());
        
        // Trigger de tackle: si un rival toca al portador de la pelota
        this.physics.add.overlap(p1.getSprite(), p2.getSprite(), () => {
          if (p1.team !== p2.team) {
            if (this.ballOwner === p1 && !p2.isFallen) this._applyTackle(p2, p1);
            else if (this.ballOwner === p2 && !p1.isFallen) this._applyTackle(p1, p2);
          }
        });
      }
    }

    // Pelota vs arqueros
    this.physics.add.overlap(ballSprite, this.homeTeam.goalkeeper.getSprite(), () => {
      this._onGoalkeeperSave(this.homeTeam.goalkeeper);
    });
    this.physics.add.overlap(ballSprite, this.awayTeam.goalkeeper.getSprite(), () => {
      this._onGoalkeeperSave(this.awayTeam.goalkeeper);
    });

    // Zonas de gol (ahora coinciden con la línea de fondo exactamente)
    // Portería HOME (arriba): el equipo AWAY marca aquí
    this._addGoalZone(FIELD.X, FIELD.TOP - 2, FIELD.GOAL_W, 6, 'away');
    // Portería AWAY (abajo): el equipo HOME marca aquí
    this._addGoalZone(FIELD.X, FIELD.BOTTOM + 2, FIELD.GOAL_W, 6, 'home');
  }

  /**
   * @param {Player} tackler
   * @param {Player} victim
   */
  _applyTackle(tackler, victim) {
    if (this.ballOwner === victim) {
      // Liberar primero para que _onBallTouchPlayer no lo bloquee
      this.releaseBallPossession();
      this._onBallTouchPlayer(tackler);
    }
    victim.fallDown();
  }

  /**
   * Un jugador toca la pelota → toma posesión si la pelota está lenta.
   * @param {Player} player
   */
   _onBallTouchPlayer(player) {
    if (this._goalieHoldingBall || this.ballOwner === player || player._catchCooldown > 0) return;

    // Si el equipo acaba de patear, no puede re-atraparla inmediatamente (evita bugs de colisión)
    const team = player.team === 'home' ? this.homeTeam : this.awayTeam;
    if (this.ballOwner && team.catchCooldown > 0) return;

    // Si la bola ya tiene dueño, NO se la pueden quitar solo por chocarla.
    // Solo se roba con barrida (tackle) o si el pase/tiro va suelto.
    if (this.ballOwner && this.ballOwner !== player) {
      return; 
    }

    // Si es saque inicial, realizar pase atrás
    if (this.isKickoff) {
      this.isKickoff = false;
      const dy = player.team === 'home' ? -1 : 1;
      player.kick(this.ball, 0, dy, 0.4);
      return;
    }

    this.ballOwner = player;
    this.lastPossessionChange = this.time.now;
    player.setBallPossession(true);
    this.hud.updatePossession(player.team);

    // Si un jugador de NUESTRO equipo recibe el balón, cambiar el control a él automáticamente
    // Esto evita que la IA dispare automáticamente y te da el control inmediato.
    if (player.team === 'home') {
      const idx = this.homeTeam.getAllPlayers().indexOf(player);
      if (idx !== -1) {
        this.homeTeam.setActivePlayer(idx);
      }
    }
  }

  /**
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {'home'|'away'} scoringTeam
   */
  _addGoalZone(x, y, w, h, scoringTeam) {
    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone);
    this.physics.add.overlap(this.ball.getSprite(), zone, () => {
      // Evitar goles si el portero la tiene o si ya estamos en secuencia de gol
      if (!this.matchPaused && !this.isScoring && !this._goalieHoldingBall) {
        this.isScoring = true;
        this.scoreSystem.goal(scoringTeam);
      }
    });
  }

  /** @param {GoalKeeper} goalkeeper */
  _onGoalkeeperSave(goalkeeper) {
    if (this._goalieHoldingBall) return;
    this._goalieHoldingBall = true;
    this._holdingGoalie = goalkeeper;

    // Quitar posesión si alguien la tiene
    this.releaseBallPossession();
    goalkeeper.performSave();

    // Detener la bola y ponerla en el arquero
    this.ball.stop();
    this.ball.setPosition(goalkeeper.sprite.x, goalkeeper.sprite.y + (goalkeeper.team === 'home' ? 5 : -5));

    // Desactivamos InputSystem temporalmente
    if (this.inputSystem) this.inputSystem.enabled = false;

    // Indicamos a AISystem que prepare posiciones (animación de regreso)
    if (this.aiSystem) this.aiSystem.setGoalieHolding(goalkeeper.team);

    // Después de 2 segundos (dando tiempo a que caminen), el portero despeja
    this.time.delayedCall(2000, () => {
      if (this.inputSystem) this.inputSystem.enabled = true;
      if (this.aiSystem) this.aiSystem.setGoalieHolding(null);

      const kickY = goalkeeper.team === 'home' ? 1 : -1;
      this.ball.setPosition(goalkeeper.sprite.x, goalkeeper.sprite.y + kickY * 15); // Un poco más de margen
      this.ball.kick((Math.random() - 0.5) * 1.2, kickY * 2.8); // Más potencia y dispersión al despeje
      
      // Esperar un poco más para permitir que el balón salga del área antes de habilitar re-atrapadas
      this.time.delayedCall(800, () => {
        this._goalieHoldingBall = false;
        this._holdingGoalie = null;
      });
    });
  }

  // ─── Eventos de pausa ───────────────────────────────────────────────────────

  _onPause() {
    this.matchPaused = true;
    this.homeTeam.stopAll();
    this.awayTeam.stopAll();
    this.ball.stop();
  }

  _onResume() {
    this.matchPaused = false;
  }

  // ─── API pública ────────────────────────────────────────────────────────────

  /** Libera la posesión del balón (llamado por InputSystem al patear). */
  releaseBallPossession() {
    if (this.ballOwner) {
      this.ballOwner.setBallPossession(false);
      this.ballOwner = null;
    }
  }

  /** Resetea pelota y jugadores tras un gol. */
  resetMatch() {
    this.releaseBallPossession();
    this.ball.setPosition(FIELD.X, FIELD.CY);
    this.homeTeam.resetPositions();
    this.awayTeam.resetPositions();
    this.isScoring = false;
  }

  // ─── Loop ───────────────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.matchStarted || this.matchPaused || this.isEntering) return;

    // Esperar a que el usuario presione el botón para iniciar el partido
    if (this.isWaitingForKickoff) {
      if (this.inputSystem.isJustPressed('pass')) {
        this.isWaitingForKickoff = false;
        this.hud.hideAnnouncement();
        this._executeInitialKickoff();
      }
      return;
    }
    if (!this.hud || !this.inputSystem || !this.aiSystem || !this.ball) return;

    this.hud.updateTimer(time);
    
    // El InputSystem decide si procesa el input o solo actualiza visuales basado en this.enabled
    this.inputSystem.update();
    
    this.aiSystem.update(delta);
    this.ball.update();

    // Sincronizar pelota al dueño o al portero que la tiene
    if (this.ballOwner?.hasBall) {
      this.ballOwner.syncBallToPlayer(this.ball);
    } else if (this._goalieHoldingBall && this._holdingGoalie) {
      const g = this._holdingGoalie;
      const offY = g.team === 'home' ? 6 : -6;
      this.ball.setPosition(g.sprite.x, g.sprite.y + offY);
      this.ball.stop();
    }

    // Actualizar todos los jugadores y verificar barridas manuales para 100% efectividad
    const allPlayers = [...this.homeTeam.getAllPlayers(), ...this.awayTeam.getAllPlayers()];
    for (const player of allPlayers) {
      player.update(delta);
      
      // Si el jugador está barriéndose, verificar si toca a un rival
      if (player.isTackling) {
        for (const other of allPlayers) {
          if (other.team !== player.team && !other.isFallen) {
            const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, other.sprite.x, other.sprite.y);
            if (dist < 10) { // Distancia de contacto físico (casi tocando)
              this._applyTackle(player, other);
            }
          }
        }
      }
    }

    // Actualizar arqueros y cooldowns de equipo
    this.homeTeam.update(delta);
    this.awayTeam.update(delta);
    this.homeTeam.goalkeeper.updateAI(this.ball, delta);
    this.awayTeam.goalkeeper.updateAI(this.ball, delta);
  }

  // ─── Limpieza ───────────────────────────────────────────────────────────────

  shutdown() {
    this.homeTeam?.destroy();
    this.awayTeam?.destroy();
    this.ball?.destroy();
    this.hud?.destroy();
    this.events.off('pause');
    this.events.off('resume');
    this.ballOwner = null;
  }
}
