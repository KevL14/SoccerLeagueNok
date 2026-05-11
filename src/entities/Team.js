/**
 * src/entities/Team.js
 *
 * Formaciones alineadas con el campo vertical (120×160).
 *
 * HOME defiende arriba (portería y≈10), ataca abajo.
 * AWAY defiende abajo (portería y≈157), ataca arriba.
 */

import Phaser from 'phaser';

import { FIELD } from '../config/fieldConstants.js';

// isHome: true si es el equipo que empieza arriba (defiende arriba).
// isOffensive: true para posiciones de ataque (4-3-3 agresivo), false para inicio (todos en su campo).
const calcFormation = (isHome, isOffensive) => {
  const dy = isHome ? 1 : -1;
  const midY = FIELD.CY;
  
  // Defensa: Bien atrás
  const defY = isOffensive ? (isHome ? FIELD.TOP + 35 : FIELD.BOTTOM - 35) : (midY - dy * 65);
  // Medio: Espaciado
  const midY_pos = isOffensive ? midY : (midY - dy * 35);
  
  // Ataque: 
  // Si es ofensivo, van al área rival. 
  // Si es defensivo, los dejamos un poco antes de la línea media (12px de margen)
  const fwdY = isOffensive 
    ? (isHome ? FIELD.BOTTOM - 35 : FIELD.TOP + 35)
    : (midY - dy * 12); 

  return [
    // 4 Defensas
    { x: 15, y: defY }, { x: 45, y: defY }, { x: 75, y: defY }, { x: 105, y: defY },
    // 3 Medios
    { x: 25, y: midY_pos }, { x: 60, y: midY_pos }, { x: 95, y: midY_pos },
    // 3 Delanteros
    { x: 25, y: fwdY }, { x: 60, y: fwdY }, { x: 95, y: fwdY }
  ];
};

const FORMATIONS = {
  home: {
    offensive: calcFormation(true, true),
    defensive: calcFormation(true, false)
  },
  away: {
    offensive: calcFormation(false, true),
    defensive: calcFormation(false, false)
  }
};

export default class Team {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} name
   * @param {'home'|'away'} teamType
   * @param {import('./GoalKeeper.js').default} goalkeeper
   */
  constructor(scene, name, teamType, goalkeeper) {
    this.scene    = scene;
    this.name     = name;
    this.teamType = teamType;

    this.goalkeeper        = goalkeeper;
    /** @type {import('./Player.js').default[]} */
    this.players           = [];
    this.activePlayerIndex = 0;

    this.possessionTime = 0;
    this.shotsOnTarget  = 0;
    this.catchCooldown  = 0; 
    this.currentFormation = 'defensive';
  }

  setFormation(type) {
    if (type === 'offensive' || type === 'defensive') {
      this.currentFormation = type;
    }
  }

  update(delta) {
    if (this.catchCooldown > 0) {
      this.catchCooldown -= delta;
    }
  }

  // ─── Jugadores ─────────────────────────────────────────────────────────────

  /** @param {import('./Player.js').default} player */
  addPlayer(player) {
    this.players.push(player);
  }

  /** @param {number} index @returns {import('./Player.js').default|null} */
  getPlayer(index) {
    return this.players[index] ?? null;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIndex] ?? null;
  }

  /** @param {number} index */
  setActivePlayer(index) {
    if (index >= 0 && index < this.players.length) {
      this.activePlayerIndex = index;
    }
  }

  getAllPlayers() { return this.players; }

  getPlayerCount() { return this.players.length; }

  // ─── Formación ─────────────────────────────────────────────────────────────

  resetPositions() {
    const positions = FORMATIONS[this.teamType][this.currentFormation];
    this.players.forEach((player, i) => {
      const pos = positions[i];
      if (!pos) return;
      player.sprite.setPosition(pos.x, pos.y);
      player.sprite.body.setVelocity(0, 0);
      player.setBallPossession(false);
    });
    this.goalkeeper.resetPosition();
  }

  /** @returns {{x:number,y:number}|null} Posición de formación para el índice dado */
  getFormationPos(index) {
    return FORMATIONS[this.teamType][this.currentFormation]?.[index] ?? null;
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  /**
   * Jugador más cercano a (x, y).
   * @param {number} x @param {number} y
   */
  getNearestPlayer(x, y) {
    if (!this.players.length) return null;
    return this.players.reduce((best, p) => {
      const d1 = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, x, y);
      const d2 = Phaser.Math.Distance.Between(best.sprite.x, best.sprite.y, x, y);
      return d1 < d2 ? p : best;
    });
  }

  stopAll() {
    this.players.forEach(p => p.stop());
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  /** @param {number} ms */
  addPossessionTime(ms) { this.possessionTime += ms; }
  addShotOnTarget()      { this.shotsOnTarget++; }

  getStats() {
    return { name: this.name, players: this.players.length,
             possession: this.possessionTime, shots: this.shotsOnTarget };
  }

  // ─── Limpieza ──────────────────────────────────────────────────────────────

  destroy() {
    this.goalkeeper?.destroy();
    this.players.forEach(p => p.destroy());
    this.players = [];
  }
}
