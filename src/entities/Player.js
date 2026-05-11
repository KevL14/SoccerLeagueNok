/**
 * src/entities/Player.js
 *
 * Jugador de campo: movimiento, pateo y posesión.
 */

import Phaser from 'phaser';

const KICK_COOLDOWN_MS = 350; // ms entre pateos

export default class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'home'|'away'} team
   * @param {string} [texture]
   */
  constructor(scene, x, y, team, playerNumber = 1, texture) {
    this.scene        = scene;
    this.team         = team;
    this.playerNumber = playerNumber;

    const tex = texture || (team === 'home' ? 'player_home' : 'player_away');
    this.sprite = scene.add.sprite(x, y, tex);
    scene.physics.world.enable(this.sprite);

    // Ajustar caja de colisión para el nuevo sprite de 8x12 (enfocado en torso y pies)
    this.sprite.body.setSize(6, 8);
    this.sprite.body.setOffset(1, 4);

    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.1);
    this.sprite.body.setDrag(120);   // frenado natural al soltar tecla
    this.sprite.body.setMaxSpeed(55);

    this.speed         = 50; // (Antes 45)
    this.hasBall       = false;
    this._kickCooldown = 0;
    this._catchCooldown = 0;
    this.direction     = { x: 0, y: 0 };
    this.isFallen      = false;
    this.isTackling    = false;
    this._walkTimer    = 0;
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Realiza una barrida (tackle) física corta pero rápida.
   * @param {number} dx
   * @param {number} dy
   */
  tackle(dx, dy) {
    if (this.isFallen || this.isTackling || this.hasBall) return;
    
    this.isTackling = true;
    
    // Dash corto (5px solicitado por usuario) pero rápido (100px/s)
    const len = Math.hypot(dx, dy);
    const vx = dx / len * 100;
    const vy = dy / len * 100;
    
    this.sprite.body.setVelocity(vx, vy);
    this.sprite.setAngle(45 * Math.sign(dx));
    this.sprite.setTint(0xffaaaa);

    this.scene.time.delayedCall(50, () => {
      if (!this.sprite?.body) return;
      this.isTackling = false;
      this.sprite.clearTint();
      this.sprite.setAngle(0);
      this.stop();
    });
  }

  // ─── Movimiento ────────────────────────────────────────────────────────────

  /**
   * @param {number} dirX  -1 · 0 · 1
   * @param {number} dirY  -1 · 0 · 1
   */
  move(dirX, dirY) {
    if (this.isFallen) return;

    const len = Math.hypot(dirX, dirY);
    if (len > 0) { dirX /= len; dirY /= len; }

    this.sprite.body.setVelocity(dirX * this.speed, dirY * this.speed);
    this.direction = { x: dirX, y: dirY };
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.direction = { x: 0, y: 0 };
  }

  // ─── Pelota ────────────────────────────────────────────────────────────────

  /**
   * Patea la pelota. Retorna true si el pateo fue exitoso.
   * @param {import('./Ball.js').default} ball
   * @param {number} [dirX=0]
   * @param {number} [dirY=1]
   * @param {number} [powerRatio=1]
   * @returns {boolean}
   */
  kick(ball, dirX = 0, dirY = 1, powerRatio = 1) {
    if (this._kickCooldown > 0 || !this.hasBall) return false;
    ball.kick(dirX, dirY, powerRatio);
    this._kickCooldown = KICK_COOLDOWN_MS;
    this._catchCooldown = 500; // No puede re-atraparla por 0.5s
    this.setBallPossession(false);

    // Cooldown de equipo: evita que compañeros atrapen el balón por error al disparar
    const team = (this.team === 'home') ? this.scene.homeTeam : this.scene.awayTeam;
    if (team) {
      team.catchCooldown = 250; // 250ms de "gracia" para el equipo
    }
    return true;
  }

  /** @param {boolean} has */
  setBallPossession(has) {
    this.hasBall = has;
    if (has) {
      // Usar un tinte para indicar posesión o dejarlo así
      this.sprite.setTint(0xaaffaa);
    } else {
      this.sprite.clearTint();
    }
  }

  /**
   * Mantiene la pelota pegada al jugador.
   * @param {import('./Ball.js').default} ball
   */
  syncBallToPlayer(ball) {
    if (!this.hasBall) return;
    const s = ball.getSprite();
    if (!s?.body) return;

    // Bola pegada estáticamente al jugador sin saltar o girar
    const finalOX = this.direction.x === 0 && this.direction.y === 0 ? 0 : this.direction.x * 4;
    const finalOY = this.direction.x === 0 && this.direction.y === 0 ? 4 : this.direction.y * 4;

    s.setPosition(this.sprite.x + finalOX, this.sprite.y + finalOY);
    s.body.setVelocity(0, 0);
    s.setAngle(0); // Forzar que la bola no gire visualmente
  }

  // ─── Acciones Especiales ───────────────────────────────────────────────────

  fallDown() {
    this.isFallen = true;
    this.stop();
    this.sprite.body.checkCollision.none = true; // Permite que otros pasen por encima
    this.sprite.setAngle(90); // Acostado
    this.sprite.setTint(0x555555); // Oscurecido
    this.scene.time.delayedCall(1500, () => {
      if (!this.sprite?.body) return;
      this.isFallen = false;
      this.sprite.body.checkCollision.none = false;
      this.sprite.setAngle(0);
      this.sprite.clearTint();
      if (this.hasBall) this.setBallPossession(true); 
    });
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }

  getSprite() { return this.sprite; }

  /** @param {number} x @param {number} y @param {number} [dist=8] */
  isNearPosition(x, y, dist = 8) {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y) < dist;
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  /** @param {number} delta ms */
  update(delta) {
    if (this._kickCooldown > 0) this._kickCooldown -= delta;
    if (this._catchCooldown > 0) this._catchCooldown -= delta;

    if (this.isFallen) return;

    // Animación de caminata "Nokia" (inclinación)
    const speed = Math.hypot(this.sprite.body.velocity.x, this.sprite.body.velocity.y);
    if (speed > 5) {
      this._walkTimer = (this._walkTimer || 0) + delta;
      // Rotación de ±12 grados
      this.sprite.setAngle(Math.sin(this._walkTimer * 0.015) * 12);
    } else {
      this.sprite.setAngle(0);
      this._walkTimer = 0;
    }
  }

  // ─── Limpieza ──────────────────────────────────────────────────────────────

  destroy() { this.sprite?.destroy(); }
}
