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
const MAX_SPEED      = 45;   
const KICK_SCALE     = 60;   
const DRAG           = 180;

export default class Player {
  constructor(scene, x, y, team, playerNumber = 1, texture) {
    this.scene        = scene;
    this.team         = team;
    this.playerNumber = playerNumber;

    this.baseTexture = texture || (team === 'home' ? 'team_home' : 'team_away');
    this.sprite = scene.add.sprite(x, y, `${this.baseTexture}_front_0`);
    this.sprite.setDepth(4);
    scene.physics.world.enable(this.sprite);

    // Cuerpo físico: parte central del sprite 6×10
    this.sprite.body.setSize(4, 6);
    this.sprite.body.setOffset(1, 3);
    this.sprite.body.setCollideWorldBounds(false);
    this.sprite.body.setBounce(0);
    this.sprite.body.setDrag(DRAG);
    this.sprite.body.setMaxSpeed(MAX_SPEED);

    this.speed  = 28;   // Aún más lento para control total (antes 35)
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
    this.sprite.body.setVelocity((dx / len) * KICK_SCALE, (dy / len) * KICK_SCALE);
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
  
  startCelebration(duration = 1500) {
    if (this.isCelebrating) return;
    this.isCelebrating = true;
    this.stop();
    
    const basePos = { x: this.sprite.x, y: this.sprite.y };
    const startTime = this.scene.time.now;
    
    // Animación de salto y "brazos" (usando frames y escala)
    const timer = this.scene.time.addEvent({
      delay: 100,
      repeat: Math.floor(duration / 100),
      callback: () => {
        const elapsed = this.scene.time.now - startTime;
        if (elapsed >= duration || !this.isCelebrating) {
          timer.remove();
          return;
        }
        
        // Saltar (oscilación relativa a la posición base)
        const jumpY = (Math.floor(elapsed / 200) % 2 === 0) ? -4 : 0;
        this.sprite.y = basePos.y + jumpY;
        
        // Mover brazos (alternar frames de textura)
        const frame = (Math.floor(elapsed / 100) % 2);
        this.sprite.setTexture(`${this.baseTexture}_front_${frame}`);
        
        // Escalar un poco para dar sensación de estiramiento
        this.sprite.setScale(1, 1.2);
      }
    });

    this.scene.time.delayedCall(duration, () => {
      this.isCelebrating = false;
      this.sprite.setScale(1, 1);
      this.sprite.setTexture(`${this.baseTexture}_front_0`);
    });
  }

  update(delta) {
    if (this._kickCooldown  > 0) this._kickCooldown  -= delta;
    if (this._catchCooldown > 0) this._catchCooldown -= delta;

    if (this.isCelebrating) return; // Bloquear update normal si celebra
    if (this.isFallen) return;

    // Clampear dentro del campo activo
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, FIELD.LEFT, FIELD.RIGHT);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, FIELD.TOP, FIELD.BOTTOM);
    // ... rest of update logic ...

    // Animación de caminata Nokia: leve oscilación y rebote
    const velocity = this.sprite.body.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    
    // ─── Gestión de Textura Direccional y Animación ──────────────────────────
    if (speed > 1) {
      this._walkTimer += delta;
      const frame = (Math.floor(this._walkTimer / 120) % 2); // 120ms por frame
      let view = 'front';

      if (Math.abs(velocity.x) > Math.abs(velocity.y) * 1.2) {
        view = 'side';
        this.sprite.setFlipX(velocity.x < 0);
      } else if (velocity.y > 0) {
        view = 'front';
        this.sprite.setFlipX(false);
      } else {
        view = 'back';
        this.sprite.setFlipX(false);
      }

      this.sprite.setTexture(`${this.baseTexture}_${view}_${frame}`);

      // Rotación lateral
      this.sprite.setAngle(Math.sin(this._walkTimer * 0.02) * 12);
      // Rebote vertical sutil
      const bob = Math.abs(Math.sin(this._walkTimer * 0.02)) * 0.15;
      this.sprite.setScale(1, 1 - bob);
    } else {
      const cur = this.sprite.angle;
      this.sprite.setAngle(Math.abs(cur) > 0.5 ? cur * 0.6 : 0);
      this.sprite.setScale(1, 1);
      this._walkTimer = 0;
      this.sprite.setTexture(`${this.baseTexture}_front_0`);
    }
  }

  destroy() { this.sprite?.destroy(); }
}
