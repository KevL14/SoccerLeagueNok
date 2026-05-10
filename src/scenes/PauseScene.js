/**
 * src/scenes/PauseScene.js
 * 
 * Escena que se activa cuando el jugador pausa el partido.
 * Maneja:
 * - Menú retro estilo Nokia con opciones
 * - Reanudar el partido (R)
 * - Volver al menú principal (M)
 * - Animación de pausa simple
 * - Fondo negro con texto verde pixel
 */

import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene', active: false });
  }

  create() {
    // Fondo oscuro (semi-transparente) para dimmer visual
    this.add.rectangle(80, 60, 160, 120, 0x000000, 0.8);

    // Borde retro (rectángulo sin relleno)
    const border = this.add.rectangle(80, 60, 140, 60, undefined, 0);
    border.setStrokeStyle(2, 0x00ff00); // Verde Nokia

    // Título "PAUSE" grande
    const pauseTitle = this.add.text(50, 30, 'PAUSE', {
      fontFamily: 'RetroFont',
      fontSize: '16px',
      color: '#00ff00'
    });

    // Opción 1: Reanudar (con animación)
    const resumeText = this.add.text(35, 55, '> RESUME [R]', {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#00ff00'
    });

    // Opción 2: Menú principal
    const menuText = this.add.text(40, 70, 'MAIN MENU [M]', {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#00ff00'
    });

    // Animación de parpadeo en título
    this.tweens.add({
      targets: [pauseTitle],
      alpha: [1, 0.5],
      duration: 400,
      repeat: -1, // Loop infinito
      yoyo: true
    });

    // Animación de cursor en opción activa
    this.tweens.add({
      targets: [resumeText],
      x: this.add(-5, 55),
      duration: 300,
      repeat: -1,
      yoyo: true
    });

    // Input teclado
    this.input.keyboard.on('keydown-R', () => {
      this.handleResume();
    });

    this.input.keyboard.on('keydown-M', () => {
      this.handleMainMenu();
    });

    // Opcionalmente: ESC también reanuda
    this.input.keyboard.on('keydown-ESC', () => {
      this.handleResume();
    });

    console.log('⏸️ PauseScene activa');
  }

  /**
   * Reanuda el partido.
   */
  handleResume() {
    console.log('▶️ Reanudando partido...');
    this.scene.stop('PauseScene');
    this.scene.resume('MatchScene');
  }

  /**
   * Vuelve al menú principal.
   */
  handleMainMenu() {
    console.log('🏠 Volviendo al menú...');
    this.scene.stop('PauseScene');
    this.scene.stop('MatchScene');
    this.scene.start('MenuScene');
  }

  /**
   * Limpia tweens al cerrar la escena.
   */
  shutdown() {
    this.tweens.killAll();
  }
}

