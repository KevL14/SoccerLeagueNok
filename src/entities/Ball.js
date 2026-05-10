/**
 * src/entities/Ball.js
 * 
 * Entidad que representa la pelota del partido.
 * Maneja:
 * - Física arcade (velocidad, rebote, fricción)
 * - Colisiones con jugadores, arquero y bordes
 * - Posición y movimiento independiente
 * - Posibilidad de ser pateada (impulso)
 */

import Phaser from 'phaser';

export default class Ball {
  /**
   * Constructor de la pelota.
   * @param {Phaser.Scene} scene - La escena actual
   * @param {number} x - Posición inicial X
   * @param {number} y - Posición inicial Y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Crear sprite de la pelota
    // Nota: Si no existe assets/sprites/ball.png, usaremos un círculo retro
    this.sprite = scene.add.circle(x, y, 2, 0x00ff00);
    
    // Habilitar física arcade
    scene.physics.world.enable(this.sprite);
    
    // Configurar propiedades físicas
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.8); // Rebote retro
    this.sprite.body.setLinearDrag(0.95); // Fricción leve
    this.sprite.body.setDrag(0.95);
    
    // Variables de control
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.maxSpeed = 200; // Velocidad máxima arcade retro
  }
  
  /**
   * Patea la pelota aplicando impulso.
   * @param {number} forceX - Fuerza en eje X
   * @param {number} forceY - Fuerza en eje Y
   */
  kick(forceX, forceY) {
    // Aplicar velocidad a la pelota
    this.sprite.body.setVelocity(forceX * 150, forceY * 150);
    this.isMoving = true;
    
    // Debug: log de la patada
    console.log(`🔵 Pelota pateada: velocidad (${forceX * 150}, ${forceY * 150})`);
  }
  
  /**
   * Obtiene la posición actual de la pelota.
   * @returns {Object} Objeto con propiedades x, y
   */
  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }
  
  /**
   * Obtiene la velocidad actual de la pelota.
   * @returns {Object} Objeto con propiedades x, y
   */
  getVelocity() {
    return {
      x: this.sprite.body.velocity.x,
      y: this.sprite.body.velocity.y
    };
  }
  
  /**
   * Establece la posición de la pelota.
   * @param {number} x - Nueva posición X
   * @param {number} y - Nueva posición Y
   */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }
  
  /**
   * Detiene el movimiento de la pelota.
   */
  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }
  
  /**
   * Obtiene el sprite de la pelota para colisiones.
   * @returns {Phaser.Physics.Arcade.Sprite} El sprite de la pelota
   */
  getSprite() {
    return this.sprite;
  }
  
  /**
   * Actualización cada frame (opcional para lógica de pelota).
   */
  update() {
    // Verificar si la pelota se está moviendo
    const speed = Phaser.Math.Distance.Between(0, 0, this.sprite.body.velocity.x, this.sprite.body.velocity.y);
    this.isMoving = speed > 5;
    
    // Si salió de los límites verticales (gol potencial), resetear
    if (this.sprite.x < 0 || this.sprite.x > 160) {
      this.sprite.body.setVelocity(0, 0);
    }
  }
  
  /**
   * Destruye el sprite de la pelota.
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
