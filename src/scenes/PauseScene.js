/**
 * src/scenes/PauseScene.js
 *
 * Escena de pausa del partido.
 * Teclado: [R] / [ESC] → Reanudar · [M] → Menú principal
 */

import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene', active: false });
  }

  create() {
    // Fondo semitransparente
    this.add.rectangle(80, 60, 160, 120, 0x000000, 0.8);

    // Borde retro verde
    this.add.rectangle(80, 60, 140, 60, 0x000000, 0)
      .setStrokeStyle(2, 0x00ff00);

    // Título parpadeante
    const pauseTitle = this.add.text(80, 32, 'PAUSE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff00',
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: pauseTitle,
      alpha: { from: 1, to: 0.4 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Opciones de menú
    this.add.text(80, 56, '> RESUME  [R]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00ff00',
    }).setOrigin(0.5, 0);

    this.add.text(80, 70, '  MENU    [M]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00aa00',
    }).setOrigin(0.5, 0);

    // Controles de teclado
    this.input.keyboard.on('keydown-R',   () => this.handleResume());
    this.input.keyboard.on('keydown-ESC', () => this.handleResume());
    this.input.keyboard.on('keydown-M',   () => this.handleMainMenu());
  }

  /** Reanuda el partido. */
  handleResume() {
    this.scene.stop('PauseScene');
    this.scene.resume('MatchScene');
  }

  /** Vuelve al menú principal. */
  handleMainMenu() {
    this.scene.stop('PauseScene');
    this.scene.stop('MatchScene');
    this.scene.start('MenuScene');
  }

  shutdown() {
    this.tweens.killAll();
  }
}
