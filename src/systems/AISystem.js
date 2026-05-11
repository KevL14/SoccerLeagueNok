/**
 * src/systems/AISystem.js
 *
 * IA para ambos equipos (HOME y AWAY).
 *
 * Roles por índice:
 *   0-2 → Delanteros
 *   3-5 → Mediocampistas
 *   6-8 → Defensas
 *
 * AWAY ataca hacia arriba (goal y≈13).
 * HOME ataca hacia abajo (goal y≈157).
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

const SHOOT_DIST = 14; // px — dispara si está a menos de esto del balón

export default class AISystem {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    this.awayTeam = null;
    this.homeTeam = null;
    this.ball     = null;

    /** @type {Record<number, 'idle'|'chasing'|'holding'>} */
    this._states = {};

    this._frameCounter = 0;
    this._updateEvery  = 2; // IA más rápida (Antes 4)
  }

  setup(awayTeam, homeTeam, ball) {
    this.awayTeam = awayTeam;
    this.homeTeam = homeTeam;
    this.ball     = ball;
    
    /** @type {'home'|'away'|null} */
    this.goalieHolding = null;
  }

  setGoalieHolding(teamHolding) {
    this.goalieHolding = teamHolding;
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  /**
   * Obtiene el rol del jugador por índice
   * 0-2: Defensas, 3-5: Medios, 6-8: Delanteros
   */
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

    this._updateTeamAI(this.awayTeam, this.homeTeam, false);
    this._updateTeamAI(this.homeTeam, this.awayTeam, true);
  }

  // ─── IA de equipo ──────────────────────────────────────────────────────────

  /**
   * @param {import('../entities/Team.js').default} team
   * @param {import('../entities/Team.js').default} opponent
   * @param {boolean} attackingDown
   */
  _updateTeamAI(team, opponent, attackingDown) {
    const ballPos = this.ball.getPosition();
    const players = team.getAllPlayers();
    const activePlayerIndex = (team.teamType === 'home') ? team.activePlayerIndex : -1;
    const ballOwner = this.scene.ballOwner;

    // Si el portero tiene el balón, todos vuelven a su posición
    if (this.goalieHolding) {
      players.forEach((player, index) => {
        this._holdFormation(player, index, team, attackingDown, true);
      });
      return;
    }

    const teamHasBall = ballOwner && ballOwner.team === team.teamType;

    // Encontrar al jugador más cercano absoluto al balón (excluyendo jugador activo)
    let absoluteNearest = null;
    let absoluteNearestDist = Infinity;
    
    players.forEach((p, i) => {
      if (i === activePlayerIndex) return;
      const d = Math.hypot(p.sprite.x - ballPos.x, p.sprite.y - ballPos.y);
      if (d < absoluteNearestDist) { 
        absoluteNearestDist = d; 
        absoluteNearest = p;
      }
    });

    players.forEach((player, index) => {
      if (index === activePlayerIndex) return;

      const role = this._getRole(index);

      // CASO 1: EL JUGADOR TIENE LA BOLA
      if (player.hasBall) {
        this._executeAttack(player, index, role, attackingDown);
        return;
      }

      // CASO 2: EL BALÓN ESTÁ LIBRE (Nadie lo tiene)
      if (!ballOwner) {
        // Solo el más cercano DENTRO DE SU ZONA va a por el balón
        const isInZone = this._isBallInPlayerZone(player, index, ballPos, attackingDown);
        if (player === absoluteNearest && isInZone) {
          this._chaseBall(player, ballPos, attackingDown);
        } else {
          this._passiveSupport(player, index, ballPos, attackingDown);
        }
        return;
      }

      // CASO 3: EL EQUIPO CONTRARIO TIENE LA BOLA
      if (ballOwner.team !== team.teamType) {
        const timeSincePossession = this.scene.time.now - (this.scene.lastPossessionChange || 0);
        const isGracePeriod = timeSincePossession < 800;

        const isInZone = this._isBallInPlayerZone(player, index, ballPos, attackingDown);
        
        if (player === absoluteNearest && isInZone && !isGracePeriod) {
          this._pressOpponent(player, ballOwner, ballPos, attackingDown);
        } else {
          this._defensiveZone(player, ballOwner, ballPos, attackingDown, index, team);
        }
        return;
      }

      // CASO 4: UN COMPAÑERO TIENE LA BOLA
      if (teamHasBall) {
        this._offensiveSupport(player, ballPos, attackingDown, role);
      } else {
        this._passiveSupport(player, index, ballPos, attackingDown);
      }
    });
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  /**
   * Ataque: el jugador tiene la bola
   */
  _executeAttack(player, index, role, attackingDown) {
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;
    const distToGoal = Math.abs(targetGoalY - pos.y);

    if (role === 'forward') {
      // Delanteros: disparar más agresivamente
      if (distToGoal < 90) {
        if (Math.random() < 0.8) {
          this._shootAtGoal(player, attackingDown);
        } else {
          this._tryPassToTeammate(player, attackingDown);
        }
      } else {
        // Avanzar rápido hacia el arco
        const dy = attackingDown ? 1 : -1;
        player.move(0, dy * 1.2);
      }
    } else if (role === 'midfielder') {
      // Medios: pasar o disparar dependiendo de la posición
      if (distToGoal < 100) {
        if (Math.random() < 0.5) {
          this._shootAtGoal(player, attackingDown);
        } else {
          this._tryPassToTeammate(player, attackingDown);
        }
      } else {
        // Avanzar y buscar pase
        if (!this._tryPassToTeammate(player, attackingDown)) {
          const dy = attackingDown ? 1 : -1;
          player.move(0, dy);
        }
      }
    } else {
      // Defensas: pasar siempre
      this._tryPassToTeammate(player, attackingDown);
    }
  }

  /**
   * Divide la cancha en 3 zonas estrictas (Defensa, Medio, Ataque)
   */
  _isBallInPlayerZone(player, index, ballPos, attackingDown) {
    const role = this._getRole(index);
    const fieldH = FIELD.BOTTOM - FIELD.TOP;
    const zoneH = fieldH / 3;
    
    // Umbral de solapamiento para que no se queden parados en el borde
    const margin = 15;

    if (attackingDown) {
      // Home (Ataca abajo)
      if (role === 'defender')   return ballPos.y < FIELD.TOP + zoneH + margin;
      if (role === 'midfielder') return ballPos.y > FIELD.TOP + zoneH - margin && ballPos.y < FIELD.TOP + 2 * zoneH + margin;
      if (role === 'forward')    return ballPos.y > FIELD.TOP + 2 * zoneH - margin;
    } else {
      // Away (Ataca arriba)
      if (role === 'defender')   return ballPos.y > FIELD.TOP + 2 * zoneH - margin;
      if (role === 'midfielder') return ballPos.y > FIELD.TOP + zoneH - margin && ballPos.y < FIELD.TOP + 2 * zoneH + margin;
      if (role === 'forward')    return ballPos.y < FIELD.TOP + zoneH + margin;
    }
    return true;
  }

  _passiveSupport(player, index, ballPos, attackingDown) {
    const formPos = player.team === 'home' ? this.homeTeam.getFormationPos(index) : this.awayTeam.getFormationPos(index);
    const pos = player.getPosition();
    
    // OSCILACIÓN IDLE (Respiración)
    const idleX = Math.sin(this.scene.time.now * 0.002 + index) * 2;
    const idleY = Math.cos(this.scene.time.now * 0.0015 + index) * 1.5;
    
    // LEAN (Inclinación hacia el balón): Solo un 15% de influencia para no perder el sitio
    // Limitamos cuánto pueden alejarse de su base (máximo 15px)
    const leanX = Phaser.Math.Clamp((ballPos.x - formPos.x) * 0.15, -15, 15);
    const leanY = Phaser.Math.Clamp((ballPos.y - formPos.y) * 0.15, -15, 15);
    
    const targetX = formPos.x + leanX + idleX;
    const targetY = formPos.y + leanY + idleY;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 2) {
      player.move(dx / dist * 0.6, dy / dist * 0.6);
    } else {
      player.stop();
    }
  }

  _chaseBall(player, ballPos, attackingDown) {
    const pos = player.getPosition();
    const dx = ballPos.x - pos.x;
    const dy = ballPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      player.move(dx / dist * 1.2, dy / dist * 1.2);
    } else {
      player.stop();
    }
  }

  _pressOpponent(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    const oppPos = ballOwner.getPosition();
    const dx = oppPos.x - pos.x;
    const dy = oppPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 15) {
      player.tackle(dx, dy);
      return;
    }

    if (dist > 1) {
      // Velocidad de presión (1.1) ligeramente superior
      player.move(dx / dist * 1.1, dy / dist * 1.1);
    } else {
      player.stop();
    }
  }

  _defensiveZone(player, ballOwner, ballPos, attackingDown, index, team) {
    const formPos = team.getFormationPos(index);
    const pos = player.getPosition();
    
    // En defensa: mantener posición pero cerrarse un poco hacia el balón verticalmente
    const leanY = Phaser.Math.Clamp((ballPos.y - formPos.y) * 0.25, -20, 20);
    const targetX = formPos.x; // NO drift lateral en defensa para no dejar huecos
    const targetY = formPos.y + leanY;

    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 4) {
      player.move(dx / dist * 0.7, dy / dist * 0.7);
    } else {
      player.stop();
    }
  }

  _offensiveSupport(player, ballPos, attackingDown, role) {
    const team = player.team === 'home' ? this.homeTeam : this.awayTeam;
    const players = team.getAllPlayers();
    const index = players.indexOf(player);
    const formPos = team.getFormationPos(index);
    const pos = player.getPosition();
    
    // En ataque: adelantarse un poco respecto a la base si el balón sube
    const advanceY = attackingDown ? 25 : -25;
    const targetY = Phaser.Math.Clamp(formPos.y + (ballPos.y - formPos.y) * 0.3, formPos.y - 15, formPos.y + 15);
    const targetX = formPos.x; // Mantener carril

    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 4) {
      player.move(dx / dist * 0.8, dy / dist * 0.8);
    } else {
      player.stop();
    }
  }

  /**
   * Presión del delantero: muy agresiva, persigue al portador
   */
  _forwardPressure(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    const oppPos = ballOwner.getPosition();
    const dx = oppPos.x - pos.x;
    const dy = oppPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    // Rango de presión: 45px (más conservador)
    if (dist < 45 && dist > 1) {
      const mvX = dx / dist;
      const mvY = dy / dist;
      player.move(mvX * 1.3, mvY * 1.3); // Muy rápido
    } else if (dist > 45) {
      // Si está lejos, mantener posición adelantada
      const targetY = attackingDown ? ballPos.y + 15 : ballPos.y - 15;
      const dy2 = targetY - pos.y;
      const dist2 = Math.abs(dy2);
      if (dist2 > 5) {
        player.move(0, Math.sign(dy2) * 0.8);
      } else {
        player.stop();
      }
    } else {
      player.stop();
    }
  }

  /**
   * Presión del medio: moderada, intenta bloquear líneas de pase
   */
  _midfielderPressure(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    const oppPos = ballOwner.getPosition();
    const dx = oppPos.x - pos.x;
    const dy = oppPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    // Rango: 35px (más cercano)
    if (dist < 35 && dist > 1) {
      const mvX = dx / dist;
      const mvY = dy / dist;
      player.move(mvX * 1.1, mvY * 1.1);
    } else if (dist > 35) {
      // Mantener posición intermedia
      const offset = attackingDown ? 25 : -25;
      const targetY = ballPos.y + offset;
      const dy2 = targetY - pos.y;
      const dist2 = Math.abs(dy2);
      if (dist2 > 5) {
        player.move(0, Math.sign(dy2) * 0.7);
      } else {
        player.stop();
      }
    } else {
      player.stop();
    }
  }

  /**
   * Presión del defensa: cubre línea defensiva
   */
  _defenderPressure(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    const oppPos = ballOwner.getPosition();
    const dist = Math.hypot(oppPos.x - pos.x, oppPos.y - pos.y);

    // Rango: 30px, solo cuando está muy cerca
    if (dist < 30 && dist > 1) {
      const dx = oppPos.x - pos.x;
      const dy = oppPos.y - pos.y;
      const len = Math.hypot(dx, dy);
      player.move((dx / len) * 0.9, (dy / len) * 0.9);
    } else {
      // Mantener línea defensiva
      player.stop();
    }
  }

  /**
   * Soporte defensivo del delantero: cobertura sin presionar directamente
   */
  _forwardDefensiveSupport(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    
    // Mantenerse cerca del delantero que presiona pero sin ir directamente al balón
    // Esperar posible recuperación o interceptación
    const offset = attackingDown ? 20 : -20;
    const targetY = Phaser.Math.Clamp(ballPos.y + offset, FIELD.TOP + 15, FIELD.BOTTOM - 15);
    const targetX = FIELD.X; // Centralizado
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      player.move((dx / dist) * 0.6, (dy / dist) * 0.6);
    } else {
      player.stop();
    }
  }

  /**
   * Soporte defensivo del medio: bloquear líneas de pase
   */
  _midfielderDefensiveSupport(player, ballOwner, ballPos, attackingDown) {
    const pos = player.getPosition();
    
    // Posicionarse entre balón y propia portería, bloqueando pases
    const offset = attackingDown ? 30 : -30;
    const targetY = ballPos.y + offset;
    
    // Variar X para no concentrarse todos
    const side = (Math.random() > 0.5) ? 1 : -1;
    const targetX = FIELD.X + side * 25;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      player.move((dx / dist) * 0.7, (dy / dist) * 0.7);
    } else {
      player.stop();
    }
  }

  /**
   * Soporte defensivo del defensa: mantener línea y cobertura
   */
  _defenderDefensiveSupport(player, ballOwner, ballPos, attackingDown, index) {
    const pos = player.getPosition();
    
    // Mantenerse en línea defensiva pero listos para ayudar
    const baseY = attackingDown ? FIELD.TOP + 50 : FIELD.BOTTOM - 50;
    const targetY = baseY + (ballPos.y - FIELD.CY) * 0.3; // Ajustarse ligeramente al balón
    
    // Distribuir lateralmente
    const side = (index % 2 === 0) ? 1 : -1;
    const targetX = FIELD.X + side * 40;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      player.move((dx / dist) * 0.5, (dy / dist) * 0.5);
    } else {
      player.stop();
    }
  }

  /**
   * Soporte del delantero: posicionarse para recibir
   */
  _forwardSupport(player, ballPos, attackingDown) {
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;

    // Posicionarse adelante del balón, buscando espacio para remate
    const advanceY = attackingDown ? 35 : -35;
    const targetY = Phaser.Math.Clamp(ballPos.y + advanceY, FIELD.TOP + 20, FIELD.BOTTOM - 20);
    
    // Moverse hacia los lados para recibir en espacio
    const side = Math.sin(this.scene.time.now * 0.001) > 0 ? 1 : -1;
    const targetX = Phaser.Math.Clamp(ballPos.x + side * 30, FIELD.LEFT + 15, FIELD.RIGHT - 15);
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      player.move((dx / dist) * 0.9, (dy / dist) * 0.9);
    } else {
      player.stop();
    }
  }

  /**
   * Soporte del medio: conectar defensa con ataque
   */
  _midfielderSupport(player, ballPos, attackingDown) {
    const pos = player.getPosition();

    // Posicionarse ligeramente adelante del balón, centralmente
    const advanceY = attackingDown ? 25 : -25;
    const targetY = Phaser.Math.Clamp(ballPos.y + advanceY, FIELD.TOP + 25, FIELD.BOTTOM - 25);
    const targetX = FIELD.X + (Math.random() - 0.5) * 20; // Pequeña variación para evitar aglomeraciones
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      player.move((dx / dist) * 0.8, (dy / dist) * 0.8);
    } else {
      player.stop();
    }
  }

  /**
   * Soporte del defensa: cubrir espacios
   */
  _defenderSupport(player, ballPos, attackingDown) {
    const pos = player.getPosition();

    // Permanecer en zona defensiva, apoyo moderado
    const offset = attackingDown ? 20 : -20;
    const targetY = Phaser.Math.Clamp(ballPos.y + offset, FIELD.TOP + 35, FIELD.BOTTOM - 35);
    const targetX = FIELD.X + (Math.random() - 0.5) * 35;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      player.move((dx / dist) * 0.6, (dy / dist) * 0.6);
    } else {
      player.stop();
    }
  }

  _holdFormation(player, index, team, attackingDown, returningToKickoff = false) {
    const formPos = team.getFormationPos(index);
    if (!formPos) { player.stop(); return; }

    const pos = player.getPosition();
    const role = this._getRole(index);

    let targetX = formPos.x;
    let targetY = formPos.y;

    // Lógica especial cuando un portero tiene el balón
    if (this.goalieHolding) {
      if (this.goalieHolding === team.teamType) {
        // MI EQUIPO TIENE EL BALÓN (El portero va a sacar)
        if (role === 'defender') {
          // Los defensas bajan mucho para recibir en corto si es necesario
          const pullBackY = attackingDown ? FIELD.TOP + 35 : FIELD.BOTTOM - 35;
          targetY = pullBackY;
        } else if (role === 'midfielder') {
          // Los medios se ofrecen en el centro
          targetY = FIELD.CY + (attackingDown ? -20 : 20);
        } else {
          // Los delanteros suben para estirar al rival
          targetY = FIELD.CY + (attackingDown ? 50 : -50);
        }
      } else {
        // EL RIVAL TIENE EL BALÓN (Su portero va a sacar)
        // OBLIGAR a retirarse para no interceptar el saque fácil
        if (role === 'forward') {
          // Los delanteros rivales se quedan cerca del medio campo, no tan lejos
          targetY = FIELD.CY + (attackingDown ? -12 : 12);
        } else if (role === 'midfielder') {
          targetY = formPos.y + (attackingDown ? -30 : 30);
        } else {
          targetY = formPos.y + (attackingDown ? -20 : 20);
        }
      }
    } else if (returningToKickoff) {
      // Regreso estándar (por ejemplo tras un gol)
      const pressDir = attackingDown ? -35 : 35;
      targetY = formPos.y + pressDir;
    }

    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      // Velocidad de recolocación
      const speedMod = this.goalieHolding ? 1.0 : 0.6;
      player.move(dx / dist * speedMod, dy / dist * speedMod);
    } else {
      player.stop();
    }
  }

  /**
   * Disparar hacia la portería contraria.
   */
  _shootAtGoal(player, attackingDown) {
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;
    const canKick = player._kickCooldown <= 0;
    
    // IA apunta a un punto oscilante pero más coherente
    const timeFactor = this.scene.time.now * 0.002;
    const spread = FIELD.GOAL_W / 2 - 3;
    const targetX = FIELD.X + Math.sin(timeFactor + player.playerNumber) * spread;

    let dx = targetX - pos.x;
    let dy = targetGoalY - pos.y;
    
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    const isForward = attackingDown ? (dy > 0) : (dy < 0);
    
    if (canKick && isForward) {
      player.kick(this.ball, dx, dy, 1.4);
      this.scene.releaseBallPossession?.();
    } else {
      // Avanzar hacia el arco
      player.move(0, attackingDown ? 1 : -1);
    }
  }

  /**
   * Intenta pasar a un compañero mejor posicionado.
   * @param {import('../entities/Player.js').default} player
   * @param {boolean} attackingDown
   * @returns {boolean} true si se realizó un pase
   */
  _tryPassToTeammate(player, attackingDown) {
    const team = player.team === 'home' ? this.homeTeam : this.awayTeam;
    const players = team.getAllPlayers();
    const pos = player.getPosition();
    const targetGoalY = attackingDown ? FIELD.GOAL_BOT : FIELD.GOAL_TOP;

    let bestTeammate = null;
    let bestScore = -Infinity;

    players.forEach(teammate => {
      if (teammate === player || teammate.isFallen) return;
      const tPos = teammate.getPosition();
      const distToPlayer = Math.hypot(tPos.x - pos.x, tPos.y - pos.y);
      
      // Rango de pase: 12-55px
      if (distToPlayer > 55 || distToPlayer < 12) return;

      // Puntaje: más cerca al arco, menos distancia al pase, movimiento hacia adelante
      const distToGoal = Math.abs(targetGoalY - tPos.y);
      const isMovingForward = (attackingDown ? (tPos.y > pos.y) : (tPos.y < pos.y)) ? 100 : 0;
      const score = isMovingForward - (distToGoal * 0.8) - (distToPlayer * 0.5);
      
      if (score > bestScore) {
        bestScore = score;
        bestTeammate = teammate;
      }
    });

    if (bestTeammate && player._kickCooldown <= 0) {
      const tPos = bestTeammate.getPosition();
      let dx = tPos.x - pos.x;
      let dy = tPos.y - pos.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) { dx /= len; dy /= len; }
      player.kick(this.ball, dx, dy, 0.85);
      this.scene.releaseBallPossession?.();
      return true;
    }
    return false;
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  /**
   * @param {import('../entities/Player.js').default[]} players
   * @param {{ x:number, y:number }} ballPos
   * @param {import('../entities/Player.js').default|null} exclude
   * @param {number} activePlayerIndex
   */
  _getSecondNearest(players, ballPos, exclude, activePlayerIndex) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p === exclude || i === activePlayerIndex) continue;
      const d = Math.hypot(p.sprite.x - ballPos.x, p.sprite.y - ballPos.y);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }

  // ─── API ───────────────────────────────────────────────────────────────────

  /** @param {number} index */
  getPlayerState(index) { return this._states[index] ?? 'idle'; }

  increaseDifficulty() { this._updateEvery = Math.max(4, this._updateEvery - 1); }
  decreaseDifficulty() { this._updateEvery = Math.min(20, this._updateEvery + 2); }

  reset() {
    this._frameCounter = 0;
    Object.keys(this._states).forEach(k => { this._states[k] = 'idle'; });
  }
}
