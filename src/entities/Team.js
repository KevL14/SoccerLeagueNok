/**
 * src/entities/Team.js
 * 
 * Entidad que representa un equipo completo.
 * Maneja:
 * - Gestión de jugadores (array)
 * - Gestión del arquero
 * - Formación táctica (posiciones iniciales)
 * - Rotación y control de jugadores
 * - Información de equipo (nombre, color)
 */

import Phaser from 'phaser';

export default class Team {
  /**
   * Constructor del equipo.
   * @param {Phaser.Scene} scene - La escena actual
   * @param {string} name - Nombre del equipo
   * @param {string} teamType - 'home' o 'away'
   * @param {GoalKeeper} goalkeeper - Instancia del arquero
   */
  constructor(scene, name, teamType, goalkeeper) {
    this.scene = scene;
    this.name = name;
    this.teamType = teamType; // 'home' o 'away'
    
    // Equipo
    this.goalkeeper = goalkeeper;
    this.players = []; // Array de jugadores
    this.activePlayerIndex = 0; // Índice del jugador actual (para control de entrada)
    
    // Colores del equipo (para identificación visual)
    this.color = teamType === 'home' ? 0x00ff00 : 0xffff00; // Verde o amarillo
    
    // Estadísticas
    this.possessionTime = 0; // Tiempo con posesión de pelota
    this.shotsOnTarget = 0; // Intentos a portería
  }
  
  /**
   * Agrega un jugador al equipo.
   * @param {Player} player - Instancia del jugador
   */
  addPlayer(player) {
    this.players.push(player);
    console.log(`👥 ${this.name}: Jugador ${player.playerNumber} agregado (Total: ${this.players.length})`);
  }
  
  /**
   * Obtiene un jugador específico por índice.
   * @param {number} index - Índice del jugador
   * @returns {Player} El jugador en ese índice
   */
  getPlayer(index) {
    if (index >= 0 && index < this.players.length) {
      return this.players[index];
    }
    return null;
  }
  
  /**
   * Obtiene el jugador actualmente controlable (para entrada del usuario).
   * @returns {Player} El jugador activo
   */
  getActivePlayer() {
    return this.players[this.activePlayerIndex];
  }
  
  /**
   * Cambia el jugador activo (para permitir cambiar entre jugadores).
   * @param {number} index - Nuevo índice del jugador
   */
  setActivePlayer(index) {
    if (index >= 0 && index < this.players.length) {
      this.activePlayerIndex = index;
      console.log(`🎮 ${this.name}: Jugador ${index} ahora activo`);
    }
  }
  
  /**
   * Obtiene todos los jugadores del equipo.
   * @returns {Array} Array de jugadores
   */
  getAllPlayers() {
    return this.players;
  }
  
  /**
   * Obtiene el total de jugadores.
   * @returns {number} Cantidad de jugadores
   */
  getPlayerCount() {
    return this.players.length;
  }
  
  /**
   * Resetea las posiciones iniciales de todos los jugadores.
   * Nota: Requiere posiciones predefinidas por formación.
   */
  resetPositions() {
    // Formación base: 4-3-3 o similar
    const formations = {
      home: [
        { x: 30, y: 30 },  // Defensa izquierda
        { x: 30, y: 60 },  // Defensa central izquierda
        { x: 30, y: 90 },  // Defensa derecha
        { x: 50, y: 45 },  // Mediocampista izquierdo
        { x: 50, y: 60 },  // Mediocampista central
        { x: 50, y: 75 },  // Mediocampista derecho
        { x: 80, y: 30 },  // Delantero izquierdo
        { x: 80, y: 60 },  // Delantero central
        { x: 80, y: 90 }   // Delantero derecho
      ],
      away: [
        { x: 130, y: 30 }, // Defensa izquierda (espejo)
        { x: 130, y: 60 }, // Defensa central izquierda
        { x: 130, y: 90 }, // Defensa derecha
        { x: 110, y: 45 }, // Mediocampista izquierdo
        { x: 110, y: 60 }, // Mediocampista central
        { x: 110, y: 75 }, // Mediocampista derecho
        { x: 80, y: 30 },  // Delantero izquierdo
        { x: 80, y: 60 },  // Delantero central
        { x: 80, y: 90 }   // Delantero derecho
      ]
    };
    
    // Aplicar posiciones iniciales
    const positions = formations[this.teamType];
    for (let i = 0; i < this.players.length && i < positions.length; i++) {
      const player = this.players[i];
      const pos = positions[i];
      player.sprite.setPosition(pos.x, pos.y);
      player.sprite.body.setVelocity(0, 0);
    }
    
    console.log(`🔄 ${this.name}: Posiciones resetadas`);
  }
  
  /**
   * Obtiene el jugador más cercano a una posición.
   * Útil para detección de posesión automática.
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @returns {Player} El jugador más cercano
   */
  getNearestPlayer(x, y) {
    if (this.players.length === 0) return null;
    
    let nearest = this.players[0];
    let minDistance = Phaser.Math.Distance.Between(nearest.sprite.x, nearest.sprite.y, x, y);
    
    for (let i = 1; i < this.players.length; i++) {
      const player = this.players[i];
      const distance = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, x, y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    }
    
    return nearest;
  }
  
  /**
   * Detiene a todos los jugadores (pausa).
   */
  stopAll() {
    this.players.forEach(player => player.stop());
  }
  
  /**
   * Obtiene el nombre del equipo.
   * @returns {string} Nombre del equipo
   */
  getName() {
    return this.name;
  }
  
  /**
   * Obtiene el tipo de equipo.
   * @returns {string} 'home' o 'away'
   */
  getTeamType() {
    return this.teamType;
  }
  
  /**
   * Incrementa estadística de posesión.
   * @param {number} time - Tiempo en ms
   */
  addPossessionTime(time) {
    this.possessionTime += time;
  }
  
  /**
   * Incrementa estadística de intentos a portería.
   */
  addShotOnTarget() {
    this.shotsOnTarget++;
  }
  
  /**
   * Obtiene estadísticas del equipo.
   * @returns {Object} Objeto con estadísticas
   */
  getStats() {
    return {
      name: this.name,
      players: this.players.length,
      possession: this.possessionTime,
      shots: this.shotsOnTarget
    };
  }
  
  /**
   * Destruye todos los sprites del equipo.
   */
  destroy() {
    // Destruir arquero
    if (this.goalkeeper) {
      this.goalkeeper.destroy();
    }
    
    // Destruir jugadores
    this.players.forEach(player => player.destroy());
    this.players = [];
  }
}
