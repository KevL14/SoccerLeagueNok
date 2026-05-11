/**
 * src/scenes/PauseScene.js
 *
 * Escena de pausa del partido.
 * Estilo similar a FullTimeScene con opciones de Reanudar, Reiniciar o Salir.
 */

import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    const cx = 40; // Centro horizontal (80/2)
    const cy = 40; // Centro vertical (80/2)

    // Fondo Blanco con borde negro
    this.add.rectangle(cx, cy, 76, 76, 0x000000);
    this.add.rectangle(cx, cy, 74, 74, 0xffffff);
    this.add.rectangle(cx, cy, 70, 70, 0xffffff).setStrokeStyle(1, 0xeeeeee);

    // Título (Negro sobre Blanco)
    this.drawPixelText(cx, cy - 28, 'PAUSA', 0x000000, true);

    // Línea divisoria
    this.add.rectangle(cx, cy - 20, 60, 1, 0xdddddd);

    // Opciones
    this.options = [
      { text: 'REANUDAR', action: 'resume' },
      { text: 'REINICIAR', action: 'restart' },
      { text: 'SALIR AL MENU', action: 'menu' }
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
    
    // Permitir salir de pausa con ESC o P también (opcional pero amigable)
    this.input.keyboard.on('keydown-ESC', () => this.confirmSelection());
    this.input.keyboard.on('keydown-P', () => this.confirmSelection());
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
        const rect = this.add.rectangle(cx, cy - 4 + i * 12, 60, 9, 0x000000, 0.1);
        this.optionContainers.push(rect);
      }

      const color = isSelected ? 0x000000 : 0x888888;
      const label = opt.text;
      
      const container = this.drawPixelText(cx, cy - 4 + i * 12, label, color, true);
      this.optionContainers.push(container);
    });
  }

  confirmSelection() {
    const action = this.options[this.selectedIndex].action;
    
    if (action === 'resume') {
      this.scene.stop('PauseScene');
      this.scene.resume('MatchScene');
    } else if (action === 'restart') {
      this.scene.stop('PauseScene');
      this.scene.stop('MatchScene');
      this.scene.stop('UIScene');
      this.scene.start('MatchScene');
    } else if (action === 'menu') {
      this.scene.stop('PauseScene');
      this.scene.stop('MatchScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    }
  }

  shutdown() {
    // No necesitamos killAll tweens aquí ya que no usamos tweens en esta versión,
    // pero es buena práctica si añadiéramos alguno.
  }
}
