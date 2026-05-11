/**
 * src/systems/InputSystem.js
 *
 * Gestiona toda la entrada del jugador.
 * Flechas / WASD → mover · SPACE → patea · Q → cambiar jugador · P → pausa
 */

import Phaser from 'phaser';

const KICK_COOLDOWN_MS = 300;

export default class InputSystem {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    this.homeTeam = null;
    this.ball     = null;

    this._moveDir      = { x: 0, y: 0 };
    this._kickCooldown = 0;

    // Marcador visual para el jugador controlado (Más pequeño)
    this._activeMarker = this.scene.add.graphics();
    this._activeMarker.fillStyle(0xffff00, 1);
    this._activeMarker.fillTriangle(0, 0, -1.5, -3, 1.5, -3); // Triangulito apuntando abajo
    this._activeMarker.setDepth(10);

    this._receiverMarker = this.scene.add.graphics();
    this._receiverMarker.fillStyle(0x00ffff, 0.6);
    this._receiverMarker.fillCircle(0, 0, 2);
    this._receiverMarker.setDepth(10);
    this._receiverMarker.setVisible(false);

    this.enabled = true;

    this._initKeys();
  }

  setEnabled(bool) {
    this.enabled = bool;
    if (!bool && this._activeMarker) {
      this._activeMarker.setVisible(false);
    }
  }

  /**
   * @param {import('../entities/Team.js').default} homeTeam
   * @param {import('../entities/Team.js').default} _awayTeam  reservado
   * @param {import('../entities/Ball.js').default} ball
   */
  setup(homeTeam, _awayTeam, ball) {
    this.homeTeam = homeTeam;
    this.ball     = ball;
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  _initKeys() {
    const kb = this.scene.input.keyboard;

    this._cursors = kb.createCursorKeys();
    this._wasd    = kb.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });

    // Definir teclas de acción explícitamente
    this._keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._keyX     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this._keyP     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this._keyZ     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Eventos
    this._keyP.on('down', () => { this._onPause(); });
    this._keyZ.on('down', () => { this._onPlayerSwitch(); });
    
    // SPACE y X los procesaremos en el update para mayor responsividad o mantener eventos
    this._keySpace.on('down', () => { this._onShoot(); });
    this._keyX.on('down', () => { this._onPassOrTackle(); });
  }

  isJustPressed(action) {
    if (action === 'pass') return Phaser.Input.Keyboard.JustDown(this._keyX);
    if (action === 'shoot') return Phaser.Input.Keyboard.JustDown(this._keySpace);
    return false;
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  update() {
    const activePlayer = this.homeTeam?.getActivePlayer();
    if (!activePlayer) {
      this._activeMarker.setVisible(false);
      return;
    }

    // Posicionar el marcador visual sobre el jugador siempre
    const pos = activePlayer.getPosition();
    this._activeMarker.setPosition(pos.x, pos.y - 7); 
    this._activeMarker.setVisible(this.enabled !== false); // Ocultar si el input está deshabilitado

    if (this.enabled === false) return; // Si está deshabilitado, no mover

    this._moveDir = this._readMovement();
    activePlayer.move(this._moveDir.x, this._moveDir.y);

    // Buscar objetivo de pase en tiempo real
    this._passTarget = this._findBestPassTarget(activePlayer);
    if (this._passTarget && activePlayer.hasBall) {
      this._receiverMarker.setPosition(this._passTarget.sprite.x, this._passTarget.sprite.y - 12);
      this._receiverMarker.setVisible(true);
    } else {
      this._receiverMarker.setVisible(false);
    }

    if (this._kickCooldown > 0) {
      this._kickCooldown -= this.scene.game.loop.deltaTime;
    }
  }

  // ─── Lectura de input ──────────────────────────────────────────────────────

  _readMovement() {
    let x = 0;
    let y = 0;

    if (this._cursors.left.isDown  || this._wasd.left.isDown)  x -= 1;
    if (this._cursors.right.isDown || this._wasd.right.isDown) x += 1;
    if (this._cursors.up.isDown    || this._wasd.up.isDown)    y -= 1;
    if (this._cursors.down.isDown  || this._wasd.down.isDown)  y += 1;

    return { x, y };
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  _onShoot() {
    if (!this.enabled) return;
    if (this._kickCooldown > 0) return;

    const player = this.homeTeam?.getActivePlayer();
    if (!player) return;

    if (!player.hasBall) {
      // Si no tiene el balón, el botón de tiro también puede barrerse
      player.tackle();
      return;
    }

    // Disparo va directo al punto rojo oscilante en la portería contraria
    const pos = player.getPosition();
    const isAttackingDown = !this.scene.isSecondHalf;
    const target = isAttackingDown ? this.scene.targetDotBot : this.scene.targetDotTop;
    
    let dx = 0;
    let dy = isAttackingDown ? 1 : -1;

    if (target) {
      dx = target.x - pos.x;
      dy = target.y - pos.y;
      
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        dx /= dist;
        dy /= dist;
      }
    }
    
    // Si patea con éxito (Aumento potencia de tiro con powerRatio = 2.2 para que sea más letal)
    const kicked = player.kick(this.ball, dx, dy, 2.2);
    if (kicked) {
      this.scene.releaseBallPossession?.();
      this._kickCooldown = KICK_COOLDOWN_MS;
    }
  }

  _onPassOrTackle() {
    if (!this.enabled) return;
    const player = this.homeTeam?.getActivePlayer();
    if (!player) return;

    if (player.hasBall) {
      if (this._kickCooldown > 0) return;
      
      let dx, dy;
      if (this._passTarget) {
        // Pase dirigido al compañero marcado
        dx = this._passTarget.sprite.x - player.sprite.x;
        dy = this._passTarget.sprite.y - player.sprite.y;
        
        // Hacer que el receptor se quede estático esperando el balón
        const target = this._passTarget;
        target.isWaitingForPass = true;
        this.scene.time.delayedCall(1500, () => {
          if (target) target.isWaitingForPass = false;
        });

        const dist = Math.hypot(dx, dy);
        dx /= dist;
        dy /= dist;
      } else {
        // Pase en dirección del movimiento
        ({ x: dx, y: dy } = this._moveDir);
        if (dx === 0 && dy === 0) dy = player.team === 'home' ? 1 : -1;
      }

      // Potencia aumentada para el pase (powerRatio = 1.3 antes 0.7)
      const kicked = player.kick(this.ball, dx, dy, 1.3);
      if (kicked) {
        this.scene.releaseBallPossession?.();
        this._kickCooldown = KICK_COOLDOWN_MS;
      }
    } else {
      console.log('Action: TACKLE');
      player.tackle(this._moveDir.x, this._moveDir.y);
    }
  }

  _findBestPassTarget(player) {
    if (!player.hasBall || !this.homeTeam) return null;

    const players = this.homeTeam.getAllPlayers();
    let bestTarget = null;
    let minDist = Infinity;

    // Dirección actual del jugador (o hacia adelante si está quieto)
    let vx = this._moveDir.x;
    let vy = this._moveDir.y;
    if (vx === 0 && vy === 0) {
      vy = player.team === 'home' ? 1 : -1;
    }

    players.forEach(p => {
      if (p === player) return;

      const dx = p.sprite.x - player.sprite.x;
      const dy = p.sprite.y - player.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) return; // Demasiado cerca

      // Verificar si está en un cono de 60 grados (aprox cos(30)=0.86)
      const dot = (dx * vx + dy * vy) / (dist * Math.hypot(vx, vy));
      if (dot > 0.75) { // Un cono generoso
        if (dist < minDist) {
          minDist = dist;
          bestTarget = p;
        }
      }
    });

    return bestTarget;
  }

  _onPause() {
    if (!this.enabled) return;
    this.scene.scene.pause();
    this.scene.scene.launch('PauseScene');
  }

  _onPlayerSwitch() {
    if (!this.enabled) return;
    if (!this.homeTeam || !this.ball) return;
    const team = this.homeTeam;
    const activePlayer = team.getActivePlayer();
    
    // Deshabilitar cambio de jugador si llevamos el balón para evitar pases accidentales
    if (activePlayer && activePlayer.hasBall) return;

    const ballPos = this.ball.getPosition();
    let bestIndex = -1;
    let minDist = Infinity;

    // Buscar el jugador más cercano que no sea el activo actual
    team.getAllPlayers().forEach((p, i) => {
      if (i === team.activePlayerIndex) return;
      const d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, ballPos.x, ballPos.y);
      if (d < minDist) {
        minDist = d;
        bestIndex = i;
      }
    });

    if (bestIndex !== -1) {
      team.setActivePlayer(bestIndex);
    }
  }

  // ─── API pública ───────────────────────────────────────────────────────────
  
  /**
   * Retorna true solo en el frame en que se presiona la tecla.
   * @param {'pass'|'shoot'} action 
   */
  isJustPressed(action) {
    if (!this.enabled) return false;
    if (action === 'pass') {
      return Phaser.Input.Keyboard.JustDown(this._keyX);
    }
    if (action === 'shoot') {
      return Phaser.Input.Keyboard.JustDown(this._keySpace);
    }
    if (action === 'switch') {
      return Phaser.Input.Keyboard.JustDown(this._keyZ);
    }
    return false;
  }

  getMovementDirection() { return this._moveDir; }

  reset() {
    this._moveDir      = { x: 0, y: 0 };
    this._kickCooldown = 0;
  }
}
