// BootScene.js
// Esta escena inicial se encarga de cargar todos los assets (sprites, sonidos, fuentes).
// Una vez cargados, transfiere el control a la escena de menú.

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Carga de sprites retro
    this.load.image('ball', 'assets/sprites/ball.png');
    this.load.image('player', 'assets/sprites/player.png');

    // Carga de sonidos arcade
    this.load.audio('goal', 'assets/sounds/goal.wav');

    // Aquí también se pueden cargar fuentes retro y elementos UI
  }

  create() {
    // Una vez cargado todo, pasamos al menú principal
    this.scene.start('MenuScene');
  }
}
