/**
 * src/scenes/MenuScene.js
 * Nokia LCD style — 60×85 viewport
 */

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const cx = 40, cy = 40;

    // Fondo LCD Nokia
    this.add.rectangle(cx, cy, 80, 80, 0x1a2a08);

    // Puntos LCD
    const dots = this.add.graphics();
    dots.fillStyle(0x000000, 0.1);
    for (let x = 0; x < 80; x += 2) {
      for (let y = 0; y < 80; y += 2) {
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
    const prompt = this.add.text(cx, cy + 12, 'PRESS ENTER', {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize:   '6px',
      color:      '#ffffff',
      fontStyle:  'bold',
      stroke:     '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      scale:   { from: 1, to: 1.1 },
      alpha:   { from: 1, to: 0.7 },
      duration: 600,
      yoyo:    true,
      repeat:  -1,
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
