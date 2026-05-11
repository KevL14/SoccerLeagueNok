/**
 * src/entities/GoalKeeper.js
 *
 * Nokia Soccer League — portero.
 * Solo se desliza en su línea. Sin dive. Nokia-faithful.
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

export default class GoalKeeper {
  constructor(scene, x, y, goalY, team, texture) {
    this.scene  = scene;
    this.team   = team;
    this.fixedY = goalY;

    const tex = texture || (team === 'home' ? 'gk_home' : 'gk_away');
    this.sprite = scene.add.sprite(x, y, tex);
    this.sprite.setDepth(4);
    scene.physics.world.enable(this.sprite);

    this.sprite.body.setSize(5, 7);
    this.sprite.body.setOffset(0, 2);
    this.sprite.body.setCollideWorldBounds(false);
    this.sprite.body.setBounce(0);
    this.sprite.body.setDrag(500);

    this.speed = 42;    // Reducido (antes 55)

    const halfW = FIELD.GOAL_W / 2;
    this.minX   = FIELD.X - halfW + 2;
    this.maxX   = FIELD.X + halfW - 2;

    this.holdingBall  = false;
    this.saveCooldown = 0;
    this._aiTimer = 0;
    this._targetX = x;
  }

  updateAI(ball, delta) {
    if (this.saveCooldown > 0) this.saveCooldown -= delta;

    if (this.holdingBall) { this._clamp(); return; }

    this._aiTimer -= delta;
    if (this._aiTimer <= 0) {
      this._aiTimer = 130;
      const { x: bx, y: by } = ball.getPosition();
      const { x: vx }        = ball.getVelocity();

      let tx = bx + vx * 0.08;
      if (Math.abs(this.fixedY - by) > 55) tx = tx * 0.2 + FIELD.X * 0.8;

      this._targetX = Phaser.Math.Clamp(tx, this.minX, this.maxX);
    }

    const dx  = this._targetX - this.sprite.x;
    const vel = Phaser.Math.Clamp(dx * 6, -this.speed, this.speed);
    this.sprite.body.setVelocityX(Math.abs(dx) > 1 ? vel : 0);
    this._clamp();
  }

  _clamp() {
    this.sprite.body.setVelocityY(0);
    this.sprite.y = this.fixedY;
    if (this.sprite.x < this.minX) { this.sprite.x = this.minX; this.sprite.body.setVelocityX(0); }
    if (this.sprite.x > this.maxX) { this.sprite.x = this.maxX; this.sprite.body.setVelocityX(0); }
  }

  performSave() {
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (this.sprite?.active) this.sprite.clearTint();
    });
  }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getSprite()   { return this.sprite; }

  resetPosition() {
    this.sprite.setPosition(FIELD.X, this.fixedY);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.setAngle(0);
    this.sprite.setScale(1, 1);
    this.sprite.clearTint();
    this.holdingBall  = false;
    this.saveCooldown = 0;
  }

  destroy() { this.sprite?.destroy(); }
}
