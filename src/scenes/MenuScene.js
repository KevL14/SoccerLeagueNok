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
    this.drawPixelText(cx, cy - 22, 'SOCCER', 0x4dff4d, true);
    this.drawPixelText(cx, cy - 10, 'LEAGUE', 0x4dff4d, true);

    // Prompt parpadeante
    const prompt = this.drawPixelText(cx, cy + 12, 'PRESS ENTER', 0xffffff, true);

    this.tweens.add({
      targets: prompt,
      scale:   { from: 1, to: 1.1 },
      alpha:   { from: 1, to: 0.7 },
      duration: 600,
      yoyo:    true,
      repeat:  -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => {
      const am = this.registry.get('audioManager');
      if (am) am.stop('menu');
      this.scene.start('MatchScene');
    });

    // Etiquetas decorativas
    this.drawPixelText(cx, cy + 30, 'NOKIA 1600', 0x1a5a1a, true);
    this.add.text(cx, cy + 38, 'X:PASS  SPC:SHOOT', {
      fontFamily: 'monospace', fontSize: '3px', color: '#1a5a1a',
    }).setOrigin(0.5);
  }

  drawPixelText(x, y, text, color, centered = false) {
    const container = this.add.container(x, y).setDepth(32);
    const chars = text.toUpperCase().split('');
    const charW = 4;
    let totalW = chars.length * charW;
    let startX = centered ? -Math.floor(totalW / 2) : 0;

    chars.forEach((char, i) => {
      const key = `font_${char}`;
      if (this.textures.exists(key)) {
        const s = this.add.sprite(startX + i * charW, 0, key).setOrigin(0, 0.5);
        s.setTint(color);
        container.add(s);
      }
    });
    return container;
  }
}
