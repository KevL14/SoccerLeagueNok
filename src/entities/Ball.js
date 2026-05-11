/**
 * src/entities/Ball.js
 *
 * Pelota con física arcade estilo Nokia.
 * - Poca fricción para que ruede naturalmente
 * - Rebote bajo para que no vuele
 * - Velocidad máxima controlada
 */

import Phaser from 'phaser';

const STOP_THRESHOLD = 5;    // px/s → detener pelota completamente
const MAX_SPEED      = 180;   // px/s máximo
const KICK_SCALE     = 130;   // potencia base de pateo
const DRAG           = 40;    // px/s² de fricción (cuánto se frena por segundo)
const BOUNCE         = 0.25; // rebote al chocar con bordes del mundo

export default class Ball {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;

    // Sprite: pequeño círculo blanco/negro estilo Nokia
    this.sprite = scene.add.circle(x, y, 3, 0xffffff);
    this.sprite.setStrokeStyle(1, 0x333333);
    scene.physics.world.enable(this.sprite);

    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(BOUNCE);
    this.sprite.body.setDrag(DRAG);
    this.sprite.body.setMaxSpeed(MAX_SPEED);

    this.isMoving = false;
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Aplica un impulso normalizado a la pelota.
   * @param {number} forceX
   * @param {number} forceY
   */
  kick(dirX, dirY, powerRatio = 1) {
    const len = Math.hypot(dirX, dirY);
    let vx = 0, vy = 1;
    if (len > 0) {
      vx = dirX / len;
      vy = dirY / len;
    }
    
    this.isMoving = true;
    this.sprite.body.setVelocity(vx * KICK_SCALE * powerRatio, vy * KICK_SCALE * powerRatio);
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }

  // ─── Getters / Setters ─────────────────────────────────────────────────────

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getVelocity() {
    return { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y };
  }

  /** @param {number} x @param {number} y */
  reset(x, y) {
    this.stop();
    this.sprite.setPosition(x, y);
    if (this.sprite.body) {
      this.sprite.body.reset(x, y);
    }
  }

  /** @param {number} x @param {number} y */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    if (this.sprite.body) {
      this.sprite.body.reset(x, y); // Sync inmediato del motor de física
    }
  }

  getSprite() { return this.sprite; }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  update() {
    const { x: vx, y: vy } = this.sprite.body.velocity;
    const speed = Math.hypot(vx, vy);

    if (speed < STOP_THRESHOLD) {
      this.stop();
    } else {
      this.isMoving = true;
      // Animación de rotación del balón
      this.sprite.angle += speed * 0.1;
    }
  }

  // ─── Limpieza ──────────────────────────────────────────────────────────────

  destroy() { this.sprite?.destroy(); }
}
