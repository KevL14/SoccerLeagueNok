/**
 * src/entities/GoalKeeper.js
 *
 * Arquero: se mueve horizontalmente a lo largo de su línea de gol.
 * HOME: defiende portería superior (y≈13), se mueve en X.
 * AWAY: defiende portería inferior (y≈155), se mueve en X.
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

const REACTION_MS = 180; // Slower reaction time to make scoring easier

export default class GoalKeeper {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x      Spawn X
   * @param {number} y      Spawn Y
   * @param {number} goalY  Y fija de la portería (donde defiende)
   * @param {'home'|'away'} team
   * @param {string} [texture]
   */
  constructor(scene, x, y, goalY, team, texture) {
    this.scene  = scene;
    this.team   = team;
    this.fixedY = goalY; // El arquero defenderá esta Y

    const tex = texture || (team === 'home' ? 'gk_home' : 'gk_away');
    this.sprite = scene.add.sprite(x, y, tex);
    scene.physics.world.enable(this.sprite);

    this.sprite.body.setSize(8, 12);
    this.sprite.body.setOffset(0, 0);

    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.1);
    this.sprite.body.setDrag(200);

    this.speed = 58; // Slower movement

    const halfW = FIELD.GOAL_W / 2;
    this.minX = FIELD.X - halfW + 3; 
    this.maxX = FIELD.X + halfW - 3;

    this.isDiving = false;
    this._aiTimer = 0;
    this._targetX = x; // Para suavizado
  }

  // ─── IA ────────────────────────────────────────────────────────────────────

  /**
   * Mueve el arquero siguiendo la posición X de la pelota.
   * @param {import('./Ball.js').default} ball
   * @param {number} delta  ms
   */
  updateAI(ball, delta) {
    this._aiTimer -= delta;
    if (this._aiTimer > 0) return;
    this._aiTimer = REACTION_MS;

    const ballPos = ball.getPosition();
    const ballVel = ball.getVelocity();

    // Predecir posición futura de la pelota
    let targetX = ballPos.x + ballVel.x * 0.15; // Menos predicción
    
    const distY = Math.abs(this.fixedY - ballPos.y);

    // Si la bola está lejos, el portero se queda más al centro
    if (distY > 100) {
      targetX = (targetX + FIELD.X) / 2;
    }

    this._targetX = Phaser.Math.Clamp(targetX, this.minX, this.maxX);

    if (this.isDiving) return;

    const dx = this._targetX - this.sprite.x;

    // Dive logic: Solo si es muy necesario y con margen de error
    const ballSpeed = Math.hypot(ballVel.x, ballVel.y);
    if (ballSpeed > 140 && distY < 25 && Math.abs(dx) > 18) {
        this.dive(Math.sign(dx));
        return;
    }

    if (Math.abs(dx) > 2) {
      // Movimiento más suave usando velocidad gradual
      const targetVel = Math.sign(dx) * this.speed;
      const currentVel = this.sprite.body.velocity.x;
      this.sprite.body.setVelocityX(currentVel * 0.8 + targetVel * 0.2);
    } else {
      this.sprite.body.setVelocityX(this.sprite.body.velocity.x * 0.8);
    }
    this.sprite.body.setVelocityY(0);
    this.sprite.y = this.fixedY;

    // Forzar límites físicos
    if (this.sprite.x < this.minX) {
      this.sprite.x = this.minX;
      this.sprite.body.setVelocityX(0);
    } else if (this.sprite.x > this.maxX) {
      this.sprite.x = this.maxX;
      this.sprite.body.setVelocityX(0);
    }
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  /** Lanzarse lateralmente para atajar un tiro difícil */
  dive(direction) {
    if (this.isDiving) return;
    this.isDiving = true;
    
    const diveSpeed = 180; // Reducido de 220
    this.sprite.body.setVelocityX(direction * diveSpeed);
    
    // Animación visual de lanzarse (inclinar y estirar)
    this.sprite.setAngle(direction * 75); 
    this.sprite.setScale(1.2, 0.8);
    
    this.scene.time.delayedCall(450, () => {
      if (!this.sprite?.body) return;
      this.isDiving = false;
      this.sprite.setAngle(0);
      this.sprite.setScale(1);
      this.sprite.body.setVelocityX(0);
    });
  }

  /** Flash blanco al realizar una parada. */
  performSave() {
    this.sprite.setTint(0xffffff);
    this.isDiving = false; // Reset dive on save
    this.sprite.setAngle(0);
    this.sprite.setScale(1, 1); // Reset scale to prevent animation jump
    this.scene.time.delayedCall(120, () => {
      if (this.sprite?.active) this.sprite.clearTint();
    });
  }

  // ─── API ───────────────────────────────────────────────────────────────────

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }

  getSprite() { return this.sprite; }

  resetPosition() {
    this.sprite.setPosition(60, this.fixedY);
    this.sprite.body.setVelocity(0, 0);
  }

  destroy() { this.sprite?.destroy(); }
}
