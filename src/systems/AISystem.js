/**
 * src/systems/AISystem.js
 *
 * IA para ambos equipos (HOME y AWAY).
 *
 * Roles por índice (10 jugadores de campo):
 *   0-3 → Defensas
 *   4-6 → Mediocampistas
 *   7-9 → Delanteros
 *
 * AWAY ataca hacia arriba (goal y≈GOAL_TOP).
 * HOME ataca hacia abajo (goal y≈GOAL_BOT).
 *
 * Mejoras v2:
 *  - Movimiento más natural: offsets de posición oscilantes por jugador
 *  - Delanteros rivales se quedan en mitad de campo (no muy atrás) cuando portero saca
 *  - Presión más agresiva en zona rival
 *  - Rotación táctica en mediocampo al atacar
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

const SHOOT_DIST    = 14;  // px — toma el balón si está a menos de esto
const PRESS_RANGE   = 40;  // px — rango de presión al portador

export default class AISystem {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    this.awayTeam = null;
    this.homeTeam = null;
    this.ball     = null;

    this.goalieHolding = null;

    this._frameCounter = 0;
    this._updateEvery  = 2;
  }

  setup(awayTeam, homeTeam, ball) {
    this.awayTeam = awayTeam;
    this.homeTeam = homeTeam;
    this.ball     = ball;
    this.goalieHolding = null;
  }

  setGoalieHolding(teamHolding) {
    this.goalieHolding = teamHolding;
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  /** 0-3: Defensas, 4-6: Medios, 7-9: Delanteros */
  _getRole(index) {
    if (index < 4) return 'defender';
    if (index < 7) return 'midfielder';
    return 'forward';
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  update(delta) {
    if (!this.awayTeam || !this.homeTeam || !this.ball) return;

    this._frameCounter++;
    if (this._frameCounter < this._updateEvery) return;
    this._frameCounter = 0;

    const homeAttacksDown = true;
    this._updateTeamAI(this.homeTeam, this.awayTeam, homeAttacksDown);
    this._updateTeamAI(this.awayTeam, this.homeTeam, !homeAttacksDown);
  }

  // ─── IA de equipo ──────────────────────────────────────────────────────────

  /**
   * @param {import('../entities/Team.js').default} team
   * @param {import('../entities/Team.js').default} opponent
   * @param {boolean} attackingDown  true = HOME (ataca hacia abajo)
   * @param {boolean} attackingDown  true = HOME (ataca hacia abajo)
   */
  _updateTeamAI(team, opponent, attackingDown) {
    const ballPos  = this.ball.getPosition();
    const players  = team.getAllPlayers();
    const ballOwner = this.scene.ballOwner;
    const activePlayerIndex = (team.teamType === 'home') ? team.activePlayerIndex : -1;

    // ── Portero tiene el balón → recolocar formación ──────────────────────
    if (this.goalieHolding) {
      players.forEach((player, index) => {
        this._holdFormation(player, index, team, attackingDown);
      });
      return;
    }

    const teamHasBall = ballOwner && ballOwner.team === team.teamType;

    // Jugador más cercano al balón (excluyendo el activo del jugador humano)
    let nearestPlayer  = null;
    let nearestDist    = Infinity;

    for (let i = 0; i < players.length; i++) {
      if (i === activePlayerIndex) continue;
      const p = players[i];
      const d = Math.hypot(p.sprite.x - ballPos.x, p.sprite.y - ballPos.y);
      if (d < nearestDist) { nearestDist = d; nearestPlayer = p; }
    }

    players.forEach((player, index) => {
      if (index === activePlayerIndex) return;

      const role = this._getRole(index);

      // ── CASO 1: Este jugador tiene la pelota → ATACAR ─────────────────
      if (player.hasBall) {
        this._executeAttack(player, index, role, attackingDown);
        return;
      }

      // ── CASO 2: Balón libre ───────────────────────────────────────────
      if (!ballOwner) {
        if (player.isWaitingForPass) {
          player.stop();
          return;
        }

        const inZone = this._isBallInZone(index, ballPos, attackingDown);
        if (player === nearestPlayer && inZone) {
          this._chaseBall(player, ballPos);
        } else {
          this._passiveSupport(player, index, ballPos, attackingDown, team);
        }
        return;
      }

      // ── CASO 3: Rival tiene la pelota → DEFENDER ──────────────────────
      if (ballOwner.team !== team.teamType) {
        const timeSince = this.scene.time.now - (this.scene.lastPossessionChange || 0);
        const gracePeriod = timeSince < 700;
        const inZone = this._isBallInZone(index, ballPos, attackingDown);
        const distToBall = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ballPos.x, ballPos.y);

        // El jugador más cercano presiona si está en su zona, o si está lo suficientemente cerca (< 90px)
        const shouldPress = player === nearestPlayer && (inZone || distToBall < 90);

        if (shouldPress && !gracePeriod) {
          this._pressOpponent(player, ballOwner, ballPos, attackingDown);
        } else {
          this._defensiveZone(player, ballOwner, ballPos, attackingDown, index, team);
        }
        return;
      }

      // ── CASO 4: Compañero tiene la pelota → APOYO OFENSIVO ───────────
      if (teamHasBall) {
        this._offensiveSupport(player, index, ballPos, attackingDown, team, role);
      } else {
        this._passiveSupport(player, index, ballPos, attackingDown, team);
      }
    });
  }

  // ─── Movimientos ───────────────────────────────────────────────────────────

  /** El jugador tiene el balón: disparar o avanzar */
  _executeAttack(player, index, role, attackingDown) {
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;
    const distToGoal  = Math.abs(targetGoalY - pos.y);

    if (role === 'forward') {
      if (distToGoal < 95) {
        Math.random() < 0.85
          ? this._shootAtGoal(player, attackingDown)
          : this._tryPassToTeammate(player, attackingDown);
      } else {
        // Avanzar con balón, ligero zigzag para parecer más natural
        const zigX = Math.sin(this.scene.time.now * 0.003 + index) * 0.3;
        player.move(zigX, attackingDown ? 1.2 : -1.2);
        // Si hay presión fuerte, intentar pase
        if (Math.random() < 0.04) this._tryPassToTeammate(player, attackingDown);
      }
    } else if (role === 'midfielder') {
      if (distToGoal < 110) {
        Math.random() < 0.6
          ? this._shootAtGoal(player, attackingDown)
          : this._tryPassToTeammate(player, attackingDown);
      } else {
        if (!this._tryPassToTeammate(player, attackingDown)) {
          player.move(0, attackingDown ? 1.1 : -1.1);
        }
      }
    } else {
      // Defensa: intentar pase largo o despeje si hay presión
      if (!this._tryPassToTeammate(player, attackingDown)) {
          player.move(0, attackingDown ? 1 : -1);
      }
    }
  }

  /** Soporte pasivo: mantenerse en posición base con pequeña oscilación humana */
  _passiveSupport(player, index, ballPos, attackingDown, team) {
    const formPos = team.getFormationPos(index);
    if (!formPos) { player.stop(); return; }

    const pos  = player.getPosition();
    const now  = this.scene.time.now;
    const freq = 0.0018 + index * 0.0003; // frecuencia levemente distinta por jugador

    // Oscilación viva (no sincronizada entre jugadores)
    const idleX = Math.sin(now * freq + index * 1.3) * 2.5;
    const idleY = Math.cos(now * freq * 0.7 + index * 0.9) * 2;

    // Ligero pull hacia el balón (15% influencia max 18px)
    const leanX = Phaser.Math.Clamp((ballPos.x - formPos.x) * 0.15, -18, 18);
    const leanY = Phaser.Math.Clamp((ballPos.y - formPos.y) * 0.12, -12, 12);

    const targetX = formPos.x + leanX + idleX;
    const targetY = formPos.y + leanY + idleY;

    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      player.move(dx / dist * 0.65, dy / dist * 0.65);
    } else {
      player.stop();
    }
  }

  /** Ir al balón */
  _chaseBall(player, ballPos) {
    const pos  = player.getPosition();
    const dx   = ballPos.x - pos.x;
    const dy   = ballPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      player.move(dx / dist * 1.25, dy / dist * 1.25);
    } else {
      player.stop();
    }
  }

  /** Presionar al jugador rival que tiene el balón */
  _pressOpponent(player, ballOwner, ballPos, attackingDown) {
    const pos    = player.getPosition();
    const oppPos = ballOwner.getPosition();
    const dx     = oppPos.x - pos.x;
    const dy     = oppPos.y - pos.y;
    const dist   = Math.hypot(dx, dy);

    if (dist < 14) {
      player.tackle(dx, dy);
      return;
    }

    if (dist > 1) {
      player.move(dx / dist * 1.3, dy / dist * 1.3);
    }
  }

  /** Mantener posición defensiva con ligero ajuste al balón */
  _defensiveZone(player, ballOwner, ballPos, attackingDown, index, team) {
    const formPos = team.getFormationPos(index);
    if (!formPos) { player.stop(); return; }

    const pos = player.getPosition();
    const now = this.scene.time.now;

    // En defensa: pequeño zigzag lateral para que no parezcan estatuas
    const micro = Math.sin(now * 0.002 + index * 2.1) * 1.5;
    const leanY = Phaser.Math.Clamp((ballPos.y - formPos.y) * 0.22, -22, 22);
    const leanX = Phaser.Math.Clamp((ballPos.x - formPos.x) * 0.1, -12, 12);

    const targetX = formPos.x + leanX + micro;
    const targetY = formPos.y + leanY;

    const dx   = targetX - pos.x;
    const dy   = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3.5) {
      player.move(dx / dist * 0.75, dy / dist * 0.75);
    } else {
      player.stop();
    }
  }

  /** Apoyo ofensivo cuando un compañero lleva el balón */
  _offensiveSupport(player, index, ballPos, attackingDown, team, role) {
    const formPos = team.getFormationPos(index);
    if (!formPos) { player.stop(); return; }

    const pos = player.getPosition();
    const now = this.scene.time.now;

    // Delanteros y medios se adelantan más; defensas se quedan detrás
    const forwardBias = role === 'forward' ? 30 : role === 'midfielder' ? 18 : 6;
    const advDir      = attackingDown ? 1 : -1;

    // Movimiento lateral oscilante para generar espacios
    const lateralOsc = Math.sin(now * 0.0022 + index * 1.7) * 14;

    // Target: adelantado respecto a formación, con movimiento lateral
    const targetY = Phaser.Math.Clamp(
      formPos.y + advDir * forwardBias + (ballPos.y - formPos.y) * 0.25,
      FIELD.TOP + 12, FIELD.BOTTOM - 12
    );
    const targetX = Phaser.Math.Clamp(
      formPos.x + lateralOsc,
      FIELD.LEFT + 8, FIELD.RIGHT - 8
    );

    const dx   = targetX - pos.x;
    const dy   = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 4) {
      player.move(dx / dist * 0.88, dy / dist * 0.88);
    } else {
      player.stop();
    }
  }

  /**
   * Recolocar la formación mientras el portero tiene el balón.
   * Los rivales se quedan a mitad de campo (no se van muy atrás).
   */
  _holdFormation(player, index, team, attackingDown) {
    const formPos = team.getFormationPos(index);
    if (!formPos) { player.stop(); return; }

    const pos  = player.getPosition();
    const role = this._getRole(index);

    let targetX = formPos.x;
    let targetY = formPos.y;

    if (this.goalieHolding === team.teamType) {
      // MI portero tiene el balón → posiciones de soporte para recibir pase
      if (role === 'defender') {
        targetY = attackingDown ? FIELD.TOP + 40 : FIELD.BOTTOM - 40;
      } else if (role === 'midfielder') {
        targetY = FIELD.CY + (attackingDown ? -25 : 25);
      } else {
        // Delanteros: estirar al rival yendo a zona ofensiva media
        targetY = FIELD.CY + (attackingDown ? 35 : -35);
      }
    } else {
      // EL PORTERO RIVAL tiene el balón → esperar respetando su saque
      if (role === 'forward') {
        // Delanteros NO se van muy atrás: se quedan justo después del centro
        // dejando espacio limpio para el saque pero listos para presionar
        targetY = attackingDown
          ? FIELD.CY - 20   // HOME delanteros: mitad campo, lado rival
          : FIELD.CY + 20;
      } else if (role === 'midfielder') {
        targetY = attackingDown
          ? FIELD.CY - 45
          : FIELD.CY + 45;
      } else {
        // Defensas: volver bien atrás
        targetY = attackingDown ? FIELD.TOP + 55 : FIELD.BOTTOM - 55;
      }
    }

    const dx   = targetX - pos.x;
    const dy   = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      const speed = 1.05;
      player.move(dx / dist * speed, dy / dist * speed);
    } else {
      player.stop();
    }
  }

  // ─── Zona de balón ─────────────────────────────────────────────────────────

  /**
   * ¿Está el balón dentro de la zona de responsabilidad de este jugador?
   * División en 3 franjas verticales con overlap.
   */
  _isBallInZone(index, ballPos, attackingDown) {
    const role   = this._getRole(index);
    const h      = FIELD.BOTTOM - FIELD.TOP;
    const z      = h / 3;
    const margin = 35; // Ampliado para mayor rango de activación

    if (attackingDown) {
      if (role === 'defender')   return ballPos.y < FIELD.TOP + z + margin;
      if (role === 'midfielder') return ballPos.y > FIELD.TOP + z - margin && ballPos.y < FIELD.TOP + 2 * z + margin;
      return ballPos.y > FIELD.TOP + 2 * z - margin;
    } else {
      if (role === 'defender')   return ballPos.y > FIELD.TOP + 2 * z - margin;
      if (role === 'midfielder') return ballPos.y > FIELD.TOP + z - margin && ballPos.y < FIELD.TOP + 2 * z + margin;
      return ballPos.y < FIELD.TOP + z + margin;
    }
  }

  // ─── Tiro y pase ───────────────────────────────────────────────────────────

  /** Disparar al arco */
  _shootAtGoal(player, attackingDown) {
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;

    // IA usa el target dot correspondiente si está atacando esa portería
    const isAttackingBot = attackingDown;
    const targetDot = isAttackingBot ? this.scene.targetDotBot : this.scene.targetDotTop;

    let dx, dy;
    if (targetDot) {
      dx = targetDot.x - pos.x;
      dy = targetDot.y - pos.y;
    } else {
      const spread  = FIELD.GOAL_W / 2 - 3;
      const timeFac = this.scene.time.now * 0.002;
      const targetX = FIELD.X + Math.sin(timeFac + player.playerNumber) * spread;
      dx = targetX - pos.x;
      dy = targetGoalY - pos.y;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    const isForward = attackingDown ? dy > 0 : dy < 0;
    if (isForward) {
      player.kick(this.ball, dx, dy, 1.8); // Más potencia para IA
      this.scene.releaseBallPossession?.();
    } else {
      player.move(0, attackingDown ? 1 : -1);
    }
  }

  /**
   * Pasar a un compañero mejor posicionado.
   * @returns {boolean} true si se ejecutó el pase
   */
  _tryPassToTeammate(player, attackingDown) {
    const team     = player.team === 'home' ? this.homeTeam : this.awayTeam;
    const players  = team.getAllPlayers();
    const pos      = player.getPosition();
    const goalY    = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;

    let best      = null;
    let bestScore = -Infinity;

    for (const mate of players) {
      if (mate === player || mate.isFallen) continue;
      const mPos   = mate.getPosition();
      const dToP   = Math.hypot(mPos.x - pos.x, mPos.y - pos.y);

      // Rango de pase: 10–110px (pases más largos permitidos)
      if (dToP > 110 || dToP < 10) continue;

      // Penalización si hay rivales cerca del compañero (evitar pasar al rival)
      let opponentNear = false;
      const opponentTeam = player.team === 'home' ? this.awayTeam : this.homeTeam;
      const opponents = opponentTeam.getAllPlayers();
      for (const opp of opponents) {
        const dToOpp = Math.hypot(mPos.x - opp.sprite.x, mPos.y - opp.sprite.y);
        if (dToOpp < 12) { opponentNear = true; break; } // Reducido para permitir más pases
      }
      if (opponentNear) continue;

      const dToGoal  = Math.abs(goalY - mPos.y);
      const forward  = (attackingDown ? mPos.y > pos.y : mPos.y < pos.y) ? 200 : 0; // Bonificación agresiva para pases hacia adelante
      const score    = forward - dToGoal * 0.8 - dToP * 0.3;

      if (score > bestScore) { bestScore = score; best = mate; }
    }

    if (best && player._kickCooldown <= 0) {
      const mPos = best.getPosition();
      let dx = mPos.x - pos.x;
      let dy = mPos.y - pos.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) { dx /= len; dy /= len; }
      player.kick(this.ball, dx, dy, 1.1); // Pase más firme
      this.scene.releaseBallPossession?.();
      return true;
    }
    return false;
  }

  // ─── API ───────────────────────────────────────────────────────────────────

  getPlayerState(index) { return 'idle'; }

  increaseDifficulty() { this._updateEvery = Math.max(1, this._updateEvery - 1); }
  decreaseDifficulty() { this._updateEvery = Math.min(20, this._updateEvery + 2); }

  reset() { this._frameCounter = 0; }
}
