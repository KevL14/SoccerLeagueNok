/**
 * src/scenes/GoalScene.js
 *
 * Escena de celebración de gol.
 * Se muestra 3 segundos (o hasta que el jugador presione ENTER)
 * y luego vuelve a MatchScene reiniciando la posición.
 */

import Phaser from 'phaser';

export default class GoalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GoalScene' });
  }

  /** @param {{ team: 'home'|'away', scorer?: string, time?: number }} data */
  init(data) {
    this.goalData = data ?? { team: 'home', scorer: null, time: 0 };
    this._continued = false; // guard: ejecutar continueToMatch una sola vez
  }

  create() {
    const cx = 60;

    // Fondo negro
    this.add.rectangle(cx, 80, 160, 160, 0x000000);

    // Texto "GOAL!!!" parpadeante
    const goalText = this.add.text(cx, 50, 'GOAL!!!', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ff00',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: goalText,
      alpha: { from: 1, to: 0.2 },
      duration: 200,
      yoyo: true,
      repeat: 10,
    });

    // Equipo que anotó
    const teamLabel = this.goalData.team === 'home' ? 'EQUIPO LOCAL' : 'EQUIPO VISITANTE';
    this.add.text(cx, 80, teamLabel, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00ff00',
    }).setOrigin(0.5);

    // Anotador (opcional)
    if (this.goalData.scorer) {
      this.add.text(cx, 92, `Anotador: ${this.goalData.scorer}`, {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#00aa00',
      }).setOrigin(0.5);
    }

    // Instrucción
    this.add.text(cx, 115, 'ENTER para continuar', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#007700',
    }).setOrigin(0.5);

    // Sonido de gol
    const bootScene = this.scene.get('BootScene');
    bootScene?.audioManager?.play('goal');

    // Continuar automáticamente o con ENTER (solo una vez)
    this.time.delayedCall(3000, () => this.continueToMatch());
    this.input.keyboard.once('keydown-ENTER', () => this.continueToMatch());
  }

  continueToMatch() {
    if (this._continued) return;
    this._continued = true;

    this.tweens.killAll();

    const matchScene = this.scene.get('MatchScene');
    matchScene?.resetMatch?.();

    this.scene.stop('GoalScene');
    this.scene.resume('MatchScene');

    if (matchScene) matchScene.matchPaused = false;
  }

  shutdown() {
    this.tweens.killAll();
  }
}
