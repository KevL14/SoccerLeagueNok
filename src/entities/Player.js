/**
 * src/entities/Player.js
 * 
 * Entidad que representa un jugador en el campo.
 * Maneja:
 * - Movimiento en el campo (limitado a bordes)
 * - Pateo de la pelota
 * - Animaciones básicas (retro)
 * - Detección de posesión de pelota
 * - Dirección y velocidad de movimiento
 */

import Phaser from 'phaser';

export default class Player {
  /**
   * Constructor del jugador.
   * @param {Phaser.Scene} scene - La escena actual
   * @param {number} x - Posición inicial X
   * @param {number} y - Posición inicial Y
   * @param {string} team - Equipo: 'home' o 'away'
   * @param {number} playerNumber - Número del jugador (1-11)
   */
  constructor(scene, x, y, team, playerNumber = 1) {
    this.scene = scene;
    this.team = team; // 'home' o 'away'
    this.playerNumber = playerNumber;
    
    // Crear sprite del jugador (rectángulo retro para simplificar)
    // Color: equipo home = verde, equipo away = amarillo
    const color = team === 'home' ? 0x00ff00 : 0xffff00;
    this.sprite = scene.add.rectangle(x, y, 4, 6, color);
    
    // Habilitar física arcade
    scene.physics.world.enable(this.sprite);
    
    // Configurar propiedades físicas
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.3);
    this.sprite.body.setDrag(0.98); // Fricción para movimiento más realista
    this.sprite.body.setMaxSpeed(100); // Velocidad máxima retro
    
    // Variables de control de movimiento
    this.isMoving = false;
    this.direction = { x: 0, y: 0 }; // Dirección de movimiento
    this.speed = 80; // Velocidad de movimiento estándar
    
    // Variables de interacción con pelota
    this.hasBall = false;
    this.kickPower = 150; // Potencia de pateo
    this.kickCooldown = 0; // Cooldown entre pateos (en ms)
  }
  
  /**
   * Mueve el jugador en una dirección.
   * @param {number} dirX - Dirección en eje X (-1, 0, 1)
   * @param {number} dirY - Dirección en eje Y (-1, 0, 1)
   */
  move(dirX, dirY) {
    // Normalizar dirección diagonal
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX = dirX / length;
      dirY = dirY / length;
    }
    
    // Aplicar velocidad
    this.sprite.body.setVelocity(dirX * this.speed, dirY * this.speed);
    
    // Guardar dirección para referencias futuras
    this.direction = { x: dirX, y: dirY };
    this.isMoving = length > 0;
  }
  
  /**
   * Detiene el movimiento del jugador.
   */
  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
    this.direction = { x: 0, y: 0 };
  }
  
  /**
   * Patea la pelota si está en posesión.
   * @param {Ball} ball - La instancia de la pelota
   * @param {number} dirX - Dirección del pateo eje X
   * @param {number} dirY - Dirección del pateo eje Y
   */
  kick(ball, dirX = 1, dirY = 0) {
    // Verificar cooldown
    if (this.kickCooldown > 0) {
      return;
    }
    
    // Patea la pelota
    ball.kick(dirX, dirY);
    
    // Establecer cooldown para evitar pateos continuos
    this.kickCooldown = 300; // 300ms entre pateos
    
    // Debug
    console.log(`⚽ ${this.team} Player ${this.playerNumber} pateó hacia (${dirX}, ${dirY})`);
  }
  
  /**
   * Obtiene la posición actual del jugador.
   * @returns {Object} Objeto con propiedades x, y
   */
  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }
  
  /**
   * Establece si el jugador tiene la pelota.
   * @param {boolean} has - True si tiene la pelota
   */
  setBallPossession(has) {
    this.hasBall = has;
    // Cambiar color ligeramente si tiene la pelota
    if (has) {
      this.sprite.setStrokeStyle(2, 0xffffff); // Borde blanco cuando tiene pelota
    } else {
      this.sprite.setStrokeStyle(0);
    }
  }
  
  /**
   * Verifica si el jugador está cerca de una posición (para detección de posesión).
   * @param {number} x - Posición X a verificar
   * @param {number} y - Posición Y a verificar
   * @param {number} distance - Distancia en píxeles para considerar "cerca"
   * @returns {boolean} True si está cerca
   */
  isNearPosition(x, y, distance = 8) {
    const dx = this.sprite.x - x;
    const dy = this.sprite.y - y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }
  
  /**
   * Actualización cada frame.
   * @param {number} delta - Tiempo en ms desde el último frame
   */
  update(delta) {
    // Reducir cooldown de pateo
    if (this.kickCooldown > 0) {
      this.kickCooldown -= delta;
    }
  }
  
  /**
   * Obtiene el sprite del jugador para colisiones.
   * @returns {Phaser.Physics.Arcade.Sprite} El sprite del jugador
   */
  getSprite() {
    return this.sprite;
  }
  
  /**
   * Destruye el sprite del jugador.
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
