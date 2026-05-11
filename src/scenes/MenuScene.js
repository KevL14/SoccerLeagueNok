/**
 * src/scenes/MenuScene.js
 * Nokia LCD style — 60×85 viewport
 */

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  init() {
    this.selectedIndex = 0;
    this.options = [
      { text: 'INICIAR PARTIDO', enabled: true },
      { text: 'OPCIONES', enabled: false },
      { text: 'SALIR', enabled: false }
    ];
    this.optionTexts = [];
  }

  create() {
    const cx = 40, cy = 40;

    // 1. Fondo LCD Blanco
    this.add.rectangle(cx, cy, 80, 80, 0xffffff);
    
    // 2. Puntos LCD
    const dots = this.add.graphics();
    dots.fillStyle(0x000000, 0.05);
    for (let x = 0; x < 80; x += 2) {
      for (let y = 0; y < 80; y += 2) {
        dots.fillRect(x, y, 1, 1);
      }
    }

    // 3. Título en una sola línea (más pequeño para que quepa)
    this.drawPixelText(cx, 10, 'SOCCER LEAGUE', 0x000000, true);

    // 4. Imagen del Logo (debe existir en public/menu_logo.png)
    this.logo = this.add.image(cx, 28, 'menu_logo');
    this.logo.setDisplaySize(25, 25); // Imagen pequeña abajo del título

    // 5. Opciones del menú
    const startY = 48;
    this.options.forEach((opt, i) => {
      const color = opt.enabled ? 0x000000 : 0xaaaaaa; // Gris si está deshabilitado
      const txt = this.drawPixelText(cx, startY + (i * 10), opt.text, color, true);
      this.optionTexts.push(txt);
    });

    // Cursor indicador (ahora oscuro)
    this.cursor = this.add.rectangle(cx, startY, 70, 9, 0x000000, 0.1);
    this.updateCursor();

    // Controles
    this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());

    // Marco
    this.add.graphics().lineStyle(1, 0x000000, 0.3).strokeRect(0, 0, 80, 80);
  }

  changeSelection(dir) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.options.length);
    this.updateCursor();
    const am = this.registry.get('audioManager');
    if (am) am.play('kick'); // Sonido de feedback
  }

  updateCursor() {
    const startY = 48;
    this.cursor.y = startY + (this.selectedIndex * 10);
    
    // Feedback visual en el texto
    this.optionTexts.forEach((container, i) => {
      container.setAlpha(i === this.selectedIndex ? 1 : 0.6);
    });
  }

  confirmSelection() {
    const selected = this.options[this.selectedIndex];
    if (!selected.enabled) return;

    if (selected.text === 'INICIAR PARTIDO') {
      this.cameras.main.flash(500, 255, 255, 255);
      const am = this.registry.get('audioManager');
      if (am) am.stop('menu');
      this.time.delayedCall(300, () => this.scene.start('MatchScene'));
    }
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
