/**
 * src/scenes/MenuScene.js
 * Nokia LCD style — 60×85 viewport
 */

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const cx = 30, cy = 42;

    // Fondo LCD Nokia
    this.add.rectangle(cx, cy, 60, 85, 0x1a2a08);

    // Puntos LCD
    const dots = this.add.graphics();
    dots.fillStyle(0x000000, 0.1);
    for (let x = 0; x < 60; x += 2) {
      for (let y = 0; y < 85; y += 2) {
        dots.fillRect(x, y, 1, 1);
      }
    }

    // Título
    this.add.text(cx, cy - 22, 'SOCCER', {
      fontFamily: 'monospace', fontSize: '11px', color: '#4dff4d',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, 'LEAGUE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#4dff4d',
    }).setOrigin(0.5);

    // Prompt parpadeante
    const prompt = this.add.text(cx, cy + 10, 'PRESS ENTER', {
      fontFamily: 'monospace', fontSize: '5px', color: '#33cc33',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt, alpha: { from: 1, to: 0.1 },
      duration: 420, yoyo: true, repeat: -1,
    });

    // Nokia label
    this.add.text(cx, cy + 30, 'NOKIA 1600', {
      fontFamily: 'monospace', fontSize: '4px', color: '#1a5a1a',
    }).setOrigin(0.5);

    // Controls help
    this.add.text(cx, cy + 38, 'ARROWS:move  X:pass  SPC:shoot', {
      fontFamily: 'monospace', fontSize: '3px', color: '#1a5a1a',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
      const am = this.registry.get('audioManager');
      if (am) am.stop('menu');
      this.scene.start('MatchScene');
    });
  }
}
