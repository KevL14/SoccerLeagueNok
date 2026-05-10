// MenuScene.js
// Esta escena muestra el menú principal con estética retro Nokia.
// Permite iniciar el partido al presionar ENTER.

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Texto retro estilo Nokia
    this.add.text(40, 40, 'SOCCER LEAGUE', {
      fontFamily: 'RetroFont', // Fuente pixel art
      fontSize: '16px',
      color: '#00ff00'         // Verde clásico Nokia
    });

    // Evento de teclado para iniciar el partido
    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start('MatchScene');
    });
  }
}
