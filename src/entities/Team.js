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
const calcFormation = (isHome, isOffensive, scoreDiff) => {
  const CY   = FIELD.CY;
  const sign = isHome ? 1 : -1;

  // scoreDiff = (my score - enemy score). Si voy ganando (>0), me repliego un poco. Si voy perdiendo (<0), me adelanto.
  const scoreOffset = Math.max(-20, Math.min(20, -scoreDiff * 5)); 

  // Fase defensiva (más equilibrada, no tan profunda)
  const DEF_Y = isHome ? FIELD.TOP  + 40 : FIELD.BOTTOM - 40;
  const MID_Y = CY + sign * (-25); 
  const FWD_Y = CY + sign * (0); 

  // Fase ofensiva (más equilibrada, no se regalan tanto atrás)
  const DEF_Y_O = CY + sign * (-25); 
  const MID_Y_O = CY + sign * 15;    
  const FWD_Y_O = isHome ? FIELD.BOTTOM - 45 : FIELD.TOP  + 45; 

  let defY = isOffensive ? DEF_Y_O : DEF_Y;
  let midY = isOffensive ? MID_Y_O : MID_Y;
  let fwdY = isOffensive ? FWD_Y_O : FWD_Y;

  // Aplicar influencia del marcador
  defY += sign * scoreOffset;
  midY += sign * scoreOffset;
  fwdY += sign * scoreOffset;

  return [
    // 4 Defensas (más separados para el nuevo ancho)
    { x: 25, y: defY }, { x: 55, y: defY }, { x: 105, y: defY }, { x: 135, y: defY },
    // 3 Mediocampistas
    { x: 35, y: midY }, { x: 80, y: midY }, { x: 125, y: midY },
    // 3 Delanteros
    { x: 35, y: fwdY }, { x: 80, y: fwdY }, { x: 125, y: fwdY },
  ];
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
    const isHome = this.teamType === 'home';
    const isOffensive = this.currentFormation === 'offensive';
    const positions = calcFormation(isHome, isOffensive, 0); // En saque inicial no hay offset de score
    
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
    const isHome = this.teamType === 'home';
    const isOffensive = this.currentFormation === 'offensive';
    
    // Calcular scoreDiff
    let scoreDiff = 0;
    if (this.scene && this.scene.scoreSystem) {
      const homeScore = this.scene.scoreSystem.homeScore || 0;
      const awayScore = this.scene.scoreSystem.awayScore || 0;
      scoreDiff = isHome ? (homeScore - awayScore) : (awayScore - homeScore);
    }
    
    // Evitar offset en el saque inicial
    if (this.scene && this.scene.isKickoff) scoreDiff = 0;

    const formation = calcFormation(isHome, isOffensive, scoreDiff);
    return formation[index] ?? null;
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
