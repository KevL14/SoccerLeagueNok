/**
 * src/entities/Player.js
 *
 * Nokia Soccer League — jugador de campo.
 * Sprite: 6×10 px (team_home / team_away generados en BootScene)
 * Velocidad reducida para ritmo Nokia auténtico.
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

const KICK_COOLDOWN_MS = 320;

export default class Player {
  constructor(scene, x, y, team, playerNumber = 1, texture) {
    this.scene        = scene;
    this.team         = team;
    this.playerNumber = playerNumber;

    const tex = texture || (team === 'home' ? 'team_home' : 'team_away');
    this.sprite = scene.add.sprite(x, y, tex);
    this.sprite.setDepth(4);
    scene.physics.world.enable(this.sprite);

    // Cuerpo físico: parte central del sprite 6×10
    this.sprite.body.setSize(5, 7);
    this.sprite.body.setOffset(0, 2);
    this.sprite.body.setCollideWorldBounds(false);
    this.sprite.body.setBounce(0);
    this.sprite.body.setDrag(200);
    this.sprite.body.setMaxSpeed(55);

    this.speed  = 45;   // reducido (era 58) — más Nokia
    this.hasBall       = false;
    this._kickCooldown  = 0;
    this._catchCooldown = 0;
    this.direction     = { x: 0, y: 0 };
    this.isFallen      = false;
    this.isTackling    = false;
    this._walkTimer    = 0;
  }

  // ─── Movimiento ────────────────────────────────────────────────────────────

  move(dirX, dirY) {
    if (this.isFallen) return;
    const len = Math.hypot(dirX, dirY);
    if (len > 0) { dirX /= len; dirY /= len; }
    this.sprite.body.setVelocity(dirX * this.speed, dirY * this.speed);
    if (len > 0) this.direction = { x: dirX, y: dirY };
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.direction = { x: 0, y: 0 };
  }

  // ─── Pelota ────────────────────────────────────────────────────────────────

  kick(ball, dirX = 0, dirY = 1, powerRatio = 1) {
    if (this._kickCooldown > 0 || !this.hasBall) return false;
    ball.kick(dirX, dirY, powerRatio);
    this._kickCooldown  = KICK_COOLDOWN_MS;
    this._catchCooldown = 500;
    this.setBallPossession(false);
    const team = this.team === 'home' ? this.scene.homeTeam : this.scene.awayTeam;
    if (team) team.catchCooldown = 200;
    return true;
  }

  setBallPossession(has) {
    this.hasBall = has;
    if (has) {
      this.sprite.setTint(0xaaffaa); // destello verde al recibir
    } else {
      this.sprite.clearTint();
    }
  }

  syncBallToPlayer(ball) {
    if (!this.hasBall) return;
    const s = ball.getSprite();
    if (!s?.body) return;
    const ox = this.direction.x * 4;
    const oy = this.direction.y === 0 ? 4 : this.direction.y * 4;
    s.setPosition(this.sprite.x + ox, this.sprite.y + oy);
    s.body.setVelocity(0, 0);
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  tackle(dx = 0, dy = 1) {
    if (this.isFallen || this.isTackling || this.hasBall) return;
    this.isTackling = true;
    const len = Math.hypot(dx, dy) || 1;
    this.sprite.body.setVelocity((dx / len) * 70, (dy / len) * 70);
    this.sprite.setTint(0xffaaaa);
    this.scene.time.delayedCall(80, () => {
      if (!this.sprite?.body) return;
      this.isTackling = false;
      this.sprite.clearTint();
      this.stop();
    });
  }

  fallDown() {
    if (this.isFallen) return;
    this.isFallen = true;
    this.stop();
    this.sprite.body.checkCollision.none = true;
    this.sprite.setTint(0x777777);
    this.sprite.setAngle(90);
    this.scene.time.delayedCall(1000, () => {
      if (!this.sprite?.body) return;
      this.isFallen = false;
      this.sprite.body.checkCollision.none = false;
      this.sprite.setAngle(0);
      this.sprite.clearTint();
    });
  }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getSprite()   { return this.sprite; }

  isNearPosition(x, y, dist = 6) {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y) < dist;
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  update(delta) {
    if (this._kickCooldown  > 0) this._kickCooldown  -= delta;
    if (this._catchCooldown > 0) this._catchCooldown -= delta;

    if (this.isFallen) return;

    // Clampear dentro del campo activo
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, FIELD.LEFT + 2,  FIELD.RIGHT - 2);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FIELD.TOP  + 1,  FIELD.BOTTOM - 1);

    // Animación de caminata Nokia: leve oscilación
    const speed = Math.hypot(this.sprite.body.velocity.x, this.sprite.body.velocity.y);
    if (speed > 3) {
      this._walkTimer += delta;
      this.sprite.setAngle(Math.sin(this._walkTimer * 0.018) * 9);
    } else {
      const cur = this.sprite.angle;
      this.sprite.setAngle(Math.abs(cur) > 0.5 ? cur * 0.6 : 0);
      this._walkTimer = 0;
    }
  }

  destroy() { this.sprite?.destroy(); }
}
