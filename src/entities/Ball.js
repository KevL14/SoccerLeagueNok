/**
 * src/entities/Ball.js
 *
 * Nokia Soccer League — pelota pixel-art.
 * - Rebote manual (NO usa collideWorldBounds) para poder entrar en las porterías
 * - Velocidades ajustadas para ritmo Nokia auténtico (no tan rápido)
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

const STOP_THRESHOLD = 3;
const MAX_SPEED      = 95;   
const KICK_SCALE     = 70;   
const DRAG           = 32;
const WALL_BOUNCE    = 0.6;

const HALF_GOAL = FIELD.GOAL_W / 2;

export default class Ball {
  constructor(scene, x, y) {
    this.scene = scene;

    // Usamos sprite con la textura generada en BootScene
    this.sprite = scene.add.sprite(x, y, 'ball_tex');
    this.sprite.setDepth(5);

    scene.physics.world.enable(this.sprite);
    this.sprite.body.setCollideWorldBounds(false);
    this.sprite.body.setBounce(0);
    this.sprite.body.setDrag(DRAG);
    this.sprite.body.setMaxSpeed(MAX_SPEED);
    
    // Cuerpo físico cuadrado de 4×4
    this.sprite.body.setSize(4, 4);
    this.sprite.body.setOffset(0, 0);

    this.isMoving = false;
  }

  kick(dirX, dirY, powerRatio = 1) {
    const len = Math.hypot(dirX, dirY);
    let vx = 0, vy = 1;
    if (len > 0) { vx = dirX / len; vy = dirY / len; }
    this.isMoving = true;
    this.sprite.body.setVelocity(
      vx * KICK_SCALE * powerRatio,
      vy * KICK_SCALE * powerRatio
    );
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }

  update() {
    const bx = this.sprite.x;
    const by = this.sprite.y;
    let   vx = this.sprite.body.velocity.x;
    let   vy = this.sprite.body.velocity.y;
    const speed = Math.hypot(vx, vy);

    if (speed < STOP_THRESHOLD) { 
      this.stop(); 
      this.sprite.angle = 0;
      return; 
    }
    this.isMoving = true;

    // Animación de rotación basada en velocidad
    this.sprite.angle += speed * 0.15;

    // Paredes laterales — siempre rebotan
    if (bx <= FIELD.LEFT + 1 && vx < 0) {
      this.sprite.body.setVelocityX(-vx * WALL_BOUNCE);
      this.sprite.x = FIELD.LEFT + 1;
    } else if (bx >= FIELD.RIGHT - 1 && vx > 0) {
      this.sprite.body.setVelocityX(-vx * WALL_BOUNCE);
      this.sprite.x = FIELD.RIGHT - 1;
    }

    // Paredes TOP/BOTTOM — solo si NO está en la boca del arco
    const inGoalMouth = bx > FIELD.X - HALF_GOAL && bx < FIELD.X + HALF_GOAL;

    if (by <= FIELD.TOP && !inGoalMouth && vy < 0) {
      this.sprite.body.setVelocityY(-vy * WALL_BOUNCE);
      this.sprite.y = FIELD.TOP;
    }
    if (by >= FIELD.BOTTOM && !inGoalMouth && vy > 0) {
      this.sprite.body.setVelocityY(-vy * WALL_BOUNCE);
      this.sprite.y = FIELD.BOTTOM;
    }

    // Seguridad: si la bola sale demasiado lejos, recentrar
    if (bx < FIELD.LEFT  - 6) this.sprite.x = FIELD.LEFT + 1;
    if (bx > FIELD.RIGHT + 6) this.sprite.x = FIELD.RIGHT - 1;
  }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getVelocity() { return { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y }; }

  reset(x, y) {
    this.stop();
    this.sprite.setPosition(x, y);
    if (this.sprite.body) this.sprite.body.reset(x, y);
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    if (this.sprite.body) this.sprite.body.reset(x, y);
  }

  getSprite() { return this.sprite; }
  destroy()   { this.sprite?.destroy(); }
}
