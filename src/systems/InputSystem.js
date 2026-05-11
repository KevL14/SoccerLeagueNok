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

    // Marcador visual para el jugador controlado
    this._activeMarker = this.scene.add.graphics();
    this._activeMarker.fillStyle(0xffff00, 1);
    this._activeMarker.fillTriangle(0, 0, -3, -5, 3, -5); // Triangulito apuntando abajo
    this._activeMarker.setDepth(10);
    this.enabled = true;

    this._initKeys();
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
    this._keyQ     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Eventos
    this._keyP.on('down', () => { this._onPause(); });
    this._keyQ.on('down', () => { this._onPlayerSwitch(); });
    
    // SPACE y X los procesaremos en el update para mayor responsividad o mantener eventos
    this._keySpace.on('down', () => { this._onShoot(); });
    this._keyX.on('down', () => { this._onPassOrTackle(); });
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
    if (this._kickCooldown > 0) return;

    const player = this.homeTeam?.getActivePlayer();
    if (!player) return;

    if (!player.hasBall) {
      // Si no tiene el balón, el botón de tiro también puede barrerse
      player.tackle();
      return;
    }

    // Disparo va directo al punto rojo (Target Dot)
    const pos = player.getPosition();
    const dotX = this.scene.targetDot ? this.scene.targetDot.x : pos.x;
    const dotY = this.scene.targetDot ? this.scene.targetDot.y : pos.y + 10;
    
    const dx = dotX - pos.x;
    const dy = dotY - pos.y;
    
    // Si patea con éxito (Aumento potencia de tiro con powerRatio = 1.6)
    const kicked = player.kick(this.ball, dx, dy, 1.6);
    if (kicked) {
      this.scene.releaseBallPossession?.();
      this._kickCooldown = KICK_COOLDOWN_MS;
    }
  }

  _onPassOrTackle() {
    const player = this.homeTeam?.getActivePlayer();
    if (!player) return;

    if (player.hasBall) {
      if (this._kickCooldown > 0) return;
      let { x: kx, y: ky } = this._moveDir;
      if (kx === 0 && ky === 0) { ky = 1; }

      // Potencia menor para el pase (powerRatio = 0.7)
      const kicked = player.kick(this.ball, kx, ky, 0.7);
      if (kicked) {
        this.scene.releaseBallPossession?.();
        this._kickCooldown = KICK_COOLDOWN_MS;
      }
    } else {
      console.log('Action: TACKLE');
      // Si no tiene el balón, hace una barrida
      player.tackle();
    }
  }

  _onPause() {
    this.scene.scene.pause();
    this.scene.scene.launch('PauseScene');
  }

  _onPlayerSwitch() {
    if (!this.homeTeam || !this.ball) return;
    const team = this.homeTeam;
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
    return false;
  }

  getMovementDirection() { return this._moveDir; }

  reset() {
    this._moveDir      = { x: 0, y: 0 };
    this._kickCooldown = 0;
  }
}
