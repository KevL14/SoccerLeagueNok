// src/scenes/BootScene.js
// Esta escena inicial se encarga de cargar todos los assets (sprites, sonidos, fuentes).
// Además, inicializa el AudioManager para centralizar la gestión de sonidos retro.
// Una vez cargados, transfiere el control a la escena de menú.

import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager.js'; // Importamos AudioManager

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Inicializamos AudioManager y cargamos sonidos retro
    this.audioManager = new AudioManager(this);
    this.audioManager.preload();

    // Carga de sprites retro
    this.load.image('ball', 'assets/sprites/ball.png');
    this.load.image('player', 'assets/sprites/player.png');

    // Aquí también se pueden cargar fuentes retro y elementos UI
  }

  create() {
    // Creamos sonidos listos para usar
    this.audioManager.create();

    // Ejemplo: reproducir sonido de menú al iniciar
    this.audioManager.play('menu');

    // Una vez cargado todo, pasamos al menú principal
    this.scene.start('MenuScene');
  }
}
