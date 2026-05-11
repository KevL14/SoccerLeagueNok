/**
 * src/scenes/MenuScene.js
 *
 * Menú principal con estética retro Nokia.
 * Presiona ENTER para iniciar el partido.
 */

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = 60; // centro X del canvas (120 / 2)
    const cy = 80; // centro Y del canvas (160 / 2)

    // Título
    this.add.text(cx, cy - 30, 'SOCCER', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff00',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 12, 'LEAGUE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff00',
    }).setOrigin(0.5);

    // Instrucción parpadeante
    const prompt = this.add.text(cx, cy + 20, 'PRESS ENTER', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00aa00',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Iniciar partido
    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('MatchScene');
    });
  }
}
