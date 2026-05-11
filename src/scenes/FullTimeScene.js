/**
 * src/scenes/FullTimeScene.js
 *
 * Pantalla de fin de partido con opciones de reiniciar o volver al menú.
 */

import Phaser from 'phaser';

export default class FullTimeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FullTimeScene' });
  }

  init(data) {
    this.finalScore = data ?? { home: 0, away: 0 };
  }

  create() {
    const cx = 40; // Centro horizontal (80/2)
    const cy = 40; // Centro vertical (80/2)

    // Fondo con doble borde pixelado — Ajustado a 80x80
    this.add.rectangle(cx, cy, 76, 76, 0x00ff00);
    this.add.rectangle(cx, cy, 74, 74, 0x000000);
    this.add.rectangle(cx, cy, 70, 70, 0x000000).setStrokeStyle(1, 0x005500);

    // Título (Pixel Art)
    this.drawPixelText(cx, cy - 28, 'FIN PARTIDO', 0x00ff00, true);

    // Línea divisoria
    this.add.rectangle(cx, cy - 20, 60, 1, 0x005500);

    // Etiquetas de equipos
    this.drawPixelText(cx, cy - 14, 'LOCAL VISIT', 0x00aa00, true);

    // Marcador final (Pixel Art)
    this.drawPixelText(cx, cy - 4, `${this.finalScore.home}-${this.finalScore.away}`, 0xffffff, true);

    // Opciones
    this.options = [
      { text: 'REINTENTAR', action: 'restart' },
      { text: 'MENU', action: 'menu' }
    ];
    this.selectedIndex = 0;
    this.optionContainers = [];

    this.updateSelection();

    // Controles
    this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-X', () => this.confirmSelection());
  }

  drawPixelText(x, y, text, color, centered = false) {
    const container = this.add.container(x, y).setDepth(100);
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

  changeSelection(dir) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.options.length);
    this.updateSelection();
  }

  updateSelection() {
    // Limpiar contenedores previos
    if (this.optionContainers) {
      this.optionContainers.forEach(c => c.destroy());
    }
    this.optionContainers = [];

    const cx = 40;
    const cy = 40;

    this.options.forEach((opt, i) => {
      const isSelected = i === this.selectedIndex;
      const label = isSelected ? ` ${opt.text} ` : opt.text;
      const color = isSelected ? 0xffffff : 0x00aa00;
      
      const container = this.drawPixelText(cx, cy + 12 + i * 12, label, color, true);
      
      // Añadir corchetes decorativos si está seleccionado
      if (isSelected) {
        // Los corchetes ya van en el texto si quisiéramos, pero vamos a usar guiones o simplemente color
      }
      
      this.optionContainers.push(container);
    });
  }

  confirmSelection() {
    const action = this.options[this.selectedIndex].action;
    
    if (action === 'restart') {
      this.scene.stop('MatchScene');
      this.scene.stop('UIScene');
      this.scene.start('MatchScene');
    } else {
      this.scene.stop('MatchScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    }
  }
}
