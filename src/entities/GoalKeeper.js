/**
 * src/entities/GoalKeeper.js
 * 
 * Entidad que representa al arquero.
 * Maneja:
 * - IA básica de seguimiento de pelota
 * - Posicionamiento defensivo retro
 * - Paradas y reflejos simples (arcade)
 * - Movimiento limitado a área de penal
 * - Interacción con la pelota
 */

import Phaser from 'phaser';

export default class GoalKeeper {
  /**
   * Constructor del arquero.
   * @param {Phaser.Scene} scene - La escena actual
   * @param {number} x - Posición inicial X (normalmente cerca de la portería)
   * @param {number} y - Posición inicial Y (centro vertical)
   * @param {string} team - Equipo: 'home' o 'away'
   */
  constructor(scene, x, y, team) {
    this.scene = scene;
    this.team = team;
    
    // Crear sprite del arquero (rectángulo más grande que un jugador normal)
    // Color: mismo del equipo (verde/amarillo)
    const color = team === 'home' ? 0x00ff00 : 0xffff00;
    this.sprite = scene.add.rectangle(x, y, 6, 8, color);
    
    // Habilitar física arcade
    scene.physics.world.enable(this.sprite);
    
    // Configurar propiedades físicas
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.5);
    this.sprite.body.setDrag(0.99); // Más fricción que jugadores normales
    
    // Variables de control
    this.isMoving = false;
    this.speed = 60; // Velocidad del arquero (más lenta que jugadores)
    
    // Límites del área de penal (donde se puede mover)
    this.minX = team === 'home' ? 5 : 155 - 5;
    this.maxX = team === 'home' ? 20 : 155;
    this.minY = 30;
    this.maxY = 90;
    
    // IA: variables de seguimiento
    this.targetX = x;
    this.targetY = y;
    this.aiReactionTime = 0; // Cooldown de reacción para IA retro
    this.ballLastPosition = { x: 80, y: 60 }; // Referencia de última posición de pelota
  }
  
  /**
   * IA del arquero: sigue la pelota automáticamente.
   * @param {Ball} ball - La instancia de la pelota
   * @param {number} delta - Tiempo en ms desde el último frame
   */
  updateAI(ball, delta) {
    // Reducir cooldown de reacción
    if (this.aiReactionTime > 0) {
      this.aiReactionTime -= delta;
    }
    
    // Solo reacciona después del cooldown
    if (this.aiReactionTime <= 0) {
      const ballPos = ball.getPosition();
      const ballVel = ball.getVelocity();
      
      // Predecir posición de la pelota
      let targetY = ballPos.y;
      
      // Si la pelota se mueve hacia el arquero, anticipa
      if (this.team === 'home' && ballVel.x < 0) {
        targetY = ballPos.y + (ballVel.y * 0.5); // Predicción simple
      } else if (this.team === 'away' && ballVel.x > 0) {
        targetY = ballPos.y + (ballVel.y * 0.5);
      }
      
      // Limitar target Y dentro de los límites
      targetY = Phaser.Math.Clamp(targetY, this.minY, this.maxY);
      
      // Mover hacia la posición objetivo
      const dy = targetY - this.sprite.y;
      
      if (Math.abs(dy) > 3) {
        const moveDir = dy > 0 ? 1 : -1;
        this.sprite.body.setVelocityY(moveDir * this.speed);
        this.isMoving = true;
      } else {
        this.sprite.body.setVelocityY(0);
        this.isMoving = false;
      }
      
      // Mantener X fijo (posición de portería)
      this.sprite.body.setVelocityX(0);
      
      // Establecer cooldown de reacción (IA retro con retraso)
      this.aiReactionTime = 200; // 200ms entre reacciones
    }
  }
  
  /**
   * Obtiene la posición actual del arquero.
   * @returns {Object} Objeto con propiedades x, y
   */
  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }
  
  /**
   * Obtiene el sprite del arquero para colisiones.
   * @returns {Phaser.Physics.Arcade.Sprite} El sprite del arquero
   */
  getSprite() {
    return this.sprite;
  }
  
  /**
   * Realiza una parada (animación visual retro).
   * Nota: Función para eventos visuales.
   */
  performSave() {
    // Parpadeo visual (cambio de color temporal)
    const originalColor = this.sprite.fillColor;
    this.sprite.setFillStyle(0xffffff); // Blanco temporalmente
    
    // Volver al color original después de 100ms
    this.scene.time.delayedCall(100, () => {
      const color = this.team === 'home' ? 0x00ff00 : 0xffff00;
      this.sprite.setFillStyle(color);
    });
  }
  
  /**
   * Verifica si el arquero puede alcanzar la pelota.
   * @param {Ball} ball - La instancia de la pelota
   * @param {number} reachDistance - Distancia de alcance (píxeles)
   * @returns {boolean} True si puede alcanzar
   */
  canReachBall(ball, reachDistance = 12) {
    const ballPos = ball.getPosition();
    const dx = this.sprite.x - ballPos.x;
    const dy = this.sprite.y - ballPos.y;
    return Math.sqrt(dx * dx + dy * dy) < reachDistance;
  }
  
  /**
   * Reinicia la posición del arquero al centro de la portería.
   */
  resetPosition() {
    const initialX = this.team === 'home' ? 10 : 150;
    const initialY = 60;
    this.sprite.setPosition(initialX, initialY);
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }
  
  /**
   * Destruye el sprite del arquero.
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
