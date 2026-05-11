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
    this.finalScore = data?.score ?? { home: 0, away: 0 };
    this.canPlayExtraTime = data?.canPlayExtraTime || false;
  }

  create() {
    const cx = 40; // Centro horizontal (80/2)
    const cy = 40; // Centro vertical (80/2)

    // Fondo Blanco con borde negro (Más alto para caber las 3 opciones)
    this.add.rectangle(cx, cy + 5, 76, 86, 0x000000);
    this.add.rectangle(cx, cy + 5, 74, 84, 0xffffff);
    this.add.rectangle(cx, cy + 5, 70, 80, 0xffffff).setStrokeStyle(1, 0xeeeeee);

    // Título (Negro sobre Blanco)
    this.drawPixelText(cx, cy - 28, 'FIN PARTIDO', 0x000000, true);

    // Línea divisoria
    this.add.rectangle(cx, cy - 20, 60, 1, 0xdddddd);

    // Etiquetas de equipos
    this.drawPixelText(cx, cy - 14, 'LOCAL VISIT', 0x444444, true);

    // Marcador final (Pixel Art)
    this.drawPixelText(cx, cy - 4, `${this.finalScore.home}-${this.finalScore.away}`, 0x000000, true);

    // Opciones
    this.options = [];
    if (this.canPlayExtraTime) {
      this.options.push({ text: 'PRORROGA', action: 'extratime' });
    }
    this.options.push({ text: 'REINTENTAR', action: 'restart' });
    this.options.push({ text: 'MENU', action: 'menu' });
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
      
      if (isSelected) {
        // Fondo de selección
        const rect = this.add.rectangle(cx, cy + 12 + i * 11, 60, 9, 0x000000, 0.1);
        this.optionContainers.push(rect);
      }

      const color = isSelected ? 0x000000 : 0x888888;
      const label = opt.text;
      
      const container = this.drawPixelText(cx, cy + 12 + i * 11, label, color, true);
      this.optionContainers.push(container);
    });
  }

  confirmSelection() {
    const action = this.options[this.selectedIndex].action;
    
    if (action === 'extratime') {
      this.scene.stop('FullTimeScene');
      this.scene.resume('MatchScene');
      const matchScene = this.scene.get('MatchScene');
      if (matchScene) matchScene._startExtraTime();
    } else if (action === 'restart') {
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
