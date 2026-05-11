/**
 * src/entities/Team.js
 *
 * Formaciones para campo 60×200 px.
 * HOME defiende portería superior (y=GOAL_TOP), ataca portería inferior.
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

/**
 * @param {boolean} isHome
 * @param {boolean} isOffensive
 */
const calcFormation = (isHome, isOffensive) => {
  const CY   = FIELD.CY;
  const sign = isHome ? 1 : -1;

  // Fase defensiva (Saque inicial o repliegue): todos estrictamente en su mitad
  const DEF_Y = isHome ? FIELD.TOP  + 30 : FIELD.BOTTOM - 30;
  const MID_Y = CY + sign * (-40); // Mitad de su propio campo
  const FWD_Y = CY + sign * (-10); // Justo detrás de la línea de medio campo

  // Fase ofensiva: 4-3-3 proyectado ocupando todo el campo
  const DEF_Y_O = CY + sign * (-30); // Defensas suben casi a medio campo
  const MID_Y_O = CY + sign * 25;    // Medios suben a apoyar al campo rival
  const FWD_Y_O = isHome ? FIELD.BOTTOM - 35 : FIELD.TOP  + 35; // Delanteros cerca del área rival

  const defY = isOffensive ? DEF_Y_O : DEF_Y;
  const midY = isOffensive ? MID_Y_O : MID_Y;
  const fwdY = isOffensive ? FWD_Y_O : FWD_Y;

  return [
    // 4 Defensas (ocupan todo el ancho)
    { x: 15, y: defY }, { x: 45, y: defY }, { x: 75, y: defY }, { x: 105, y: defY },
    // 3 Mediocampistas
    { x: 25, y: midY }, { x: 60, y: midY }, { x: 95, y: midY },
    // 3 Delanteros
    { x: 25, y: fwdY }, { x: 60, y: fwdY }, { x: 95, y: fwdY },
  ];
};

const FORMATIONS = {
  home: {
    offensive: calcFormation(true,  true),
    defensive: calcFormation(true,  false),
  },
  away: {
    offensive: calcFormation(false, true),
    defensive: calcFormation(false, false),
  },
};

export default class Team {
  constructor(scene, name, teamType, goalkeeper) {
    this.scene    = scene;
    this.name     = name;
    this.teamType = teamType;

    this.goalkeeper        = goalkeeper;
    this.players           = [];
    this.activePlayerIndex = 0;

    this.possessionTime   = 0;
    this.shotsOnTarget    = 0;
    this.catchCooldown    = 0;
    this.currentFormation = 'defensive';
  }

  setFormation(type) {
    if (type === 'offensive' || type === 'defensive') this.currentFormation = type;
  }

  update(delta) {
    if (this.catchCooldown > 0) this.catchCooldown -= delta;
  }

  addPlayer(player) { this.players.push(player); }
  getPlayer(i)      { return this.players[i] ?? null; }
  getAllPlayers()    { return this.players; }
  getPlayerCount()  { return this.players.length; }

  getActivePlayer() { return this.players[this.activePlayerIndex] ?? null; }
  setActivePlayer(i) {
    if (i >= 0 && i < this.players.length) this.activePlayerIndex = i;
  }

  resetPositions() {
    const positions = FORMATIONS[this.teamType][this.currentFormation];
    this.players.forEach((player, i) => {
      const pos = positions[i];
      if (!pos) return;
      
      let finalX = pos.x;
      let finalY = pos.y;

      player.sprite.setPosition(finalX, finalY);
      player.sprite.body.setVelocity(0, 0);
      player.setBallPossession(false);
      player.isCelebrating = false;
      player.isFallen      = false;
      player.isTackling    = false;
      player.sprite.setAngle(0);
      player.sprite.setScale(1, 1);
      player.sprite.clearTint();
    });
    this.goalkeeper.resetPosition();
  }

  getFormationPos(index) {
    return FORMATIONS[this.teamType][this.currentFormation]?.[index] ?? null;
  }

  getNearestPlayer(x, y) {
    if (!this.players.length) return null;
    return this.players.reduce((best, p) => {
      const d1 = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, x, y);
      const d2 = Phaser.Math.Distance.Between(best.sprite.x, best.sprite.y, x, y);
      return d1 < d2 ? p : best;
    });
  }

  stopAll() { this.players.forEach(p => p.stop()); }

  destroy() {
    this.goalkeeper?.destroy();
    this.players.forEach(p => p.destroy());
    this.players = [];
  }
}
